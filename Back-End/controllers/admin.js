import User from "../models/users.js";
import Event from "../models/events.js";
import Team from "../models/teams.js";
import Payment from "../models/payments.js";
import Eve from "../models/eves.js";

export async function isAuthorised(req, res) {
  const { adminId } = req.body;
  try {
    let admin = await User.findOne({ _id: adminId });
    if (admin) {
      if (admin.isAdmin || admin.isSuperAdmin) {
        return res.json(true);
      } else {
        return res.json(false);
      }
    } else {
      return res.json(false);
    }
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function adminDashboard(req, res) {
  let eventWiseCount = {};
  try {
    const totalRegistrations = await Team.countDocuments();
    const totalRegistrationsPaid = await Team.countDocuments({
      paymentCompleted: true,
    });
    const totalRegistrationsUnPaid = await Team.countDocuments({
      paymentCompleted: false,
    });
    const events = await Event.find();

    const eveRegistrations = await Eve.countDocuments();

    // Use Promise.all to await all async operations inside the loop
    await Promise.all(
      events.map(async (event) => {
        const eventCount = await Team.countDocuments({
          eventId: event._id,
          paymentCompleted: true,
        });
        eventWiseCount[event.name] = eventCount;
      })
    );

    // Once all async operations are completed, send the response
    return res.json({
      totalRegistrations: totalRegistrations,
      eventWiseCount,
      totalRegistrationsPaid,
      totalRegistrationsUnPaid,
      eveRegistrations,
    });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function handleFindUserByEmail(req, res) {
  const { email } = req.body;
  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.json({ msg: "Exists", user: user });
    } else {
      return res.json({ msg: "User Not Exists" });
    }
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function handleFindUserByUserId(req, res) {
  const { userId } = req.body;
  try {
    let user = await User.findOne({ _id: userId });
    if (user) {
      return res.json({ msg: "Exists", user: user });
    } else {
      return res.json({ msg: "User Not Exists" });
    }
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function handleEditUser(req, res) {
  const { userName, email, id } = req.body;
  try {
    let user = await User.find({ _id: id });
    if (user) {
      await User.findByIdAndUpdate({ _id: id }, { userName, email });
      return res.json("Successfully Updated");
    } else {
      return res.json("User Not Exists or Some Error");
    }
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function handleCreateTeam(req, res) {
  const { filteredData, teamName, leaderName, eventId } = req.body;
  try {
    const user = await User.findOne({
      userName: leaderName,
    });

    if (user) {
      const leaderId = user._id;

      const team = new Team({
        leaderId,
        teamName,
        teamMembers: filteredData.map((member) => member),
        eventId,
        paymentCompleted: true,
      });
      await team.save();

      const teamId = await Team.findOne({
        $and: [{ leaderId }, { eventId }],
      });

      filteredData.push(leaderId);

      filteredData
        .map((member) => member)
        .forEach(async (userId) => {
          try {
            await User.updateOne(
              { _id: userId },
              { $push: { events: { eventId, teamId: teamId._id } } }
            );
          } catch (error) {
            res.json("Error, Please Try again after sometime");
          }
        });

      res.json("Team Created Successfully");
    } else {
      res.json("User Not Exists");
    }
  } catch (error) {
    res.json(error);
  }
}

export async function handleFetchEvent(req, res) {
  const { eventId } = req.body;
  try {
    let event = await Event.findOne({ _id: eventId });
    if (event) {
      return res.json({ msg: "Exists", event: event });
    } else {
      return res.json({ msg: "Check event some error occure" });
    }
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function searchTeam(req, res) {
  const { leaderId, eventId } = req.body;
  try {
    const team = await Team.findOne({
      $and: [{ leaderId }, { eventId }],
    });
    if (team) {
      return res.json({ msg: "Exists", teamName: team.teamName });
    } else {
      return res.json({ msg: "Invalid Credentials" });
    }
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function deleteTeam(req, res) {
  const { leaderId, eventId } = req.body;

  let teamMembers = [];
  try {
    const team = await Team.findOne({
      $and: [{ leaderId }, { eventId }],
    });

    teamMembers = team.teamMembers;
    teamMembers.push(team.leaderId);

    await Promise.all(
      teamMembers.map(async (members) => {
        await User.updateOne(
          { _id: members },
          {
            $pull: {
              events: {
                eventId: eventId,
                teamId: team._id,
              },
            },
          }
        );
      })
    );

    await Team.deleteOne({
      $and: [{ leaderId }, { eventId }],
    });

    return res.json({ msg: "Team deleted successfully" });
  } catch (error) {
    // console.log(error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function paymentDashboard(req, res) {
  let eventWisePayments = {};
  try {
    // Get total payments
    const totalPayments = await Payment.aggregate([
      { $group: { _id: null, totalAmount: { $sum: "$amount" } } },
    ]);

    const eveRegistrations = await Eve.countDocuments();

    const eventWiseTotal = await Payment.aggregate([
      {
        $group: {
          _id: "$eventId",
          totalAmount: { $sum: "$amount" },
        },
      },
    ]);

    await Promise.all(
      eventWiseTotal.map(async (payment) => {
        const event = await Event.findOne({ _id: payment._id });
        eventWisePayments[event.name] = payment.totalAmount;
      })
    );
    return res.json({
      totalPayments: totalPayments[0] ? totalPayments[0].totalAmount : 0,
      eventWisePayments,
      eveRegistrations,
    });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
}
