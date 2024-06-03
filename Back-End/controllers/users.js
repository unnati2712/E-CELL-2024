import "dotenv/config";
import User from "../models/users.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Team from "../models/teams.js";
import Event from "../models/events.js";
import { getUser, setUser } from "../service/auth.js";
import nodemailer from "nodemailer";
import Payment from "../models/payments.js";
import Eve from "../models/eves.js";

export async function handleLogin(req, res) {
  try {
    const { email, password } = req.body;
    // console.log(email, password);
    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ msg: "Invalid Credentials" });
    }
    if (!user.password) {
      return res.json({ msg: "Login with google" });
    }
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (passwordMatch) {
      const token = setUser(user);
      res.cookie("token", token, { maxAge: 60 * 2000 });
      return res.status(200).json({
        exists: "exists",
        token: token,
        username: user.userName,
        userId: user._id.toString(),
      });
    } else {
      return res.json({ msg: "Invalid email or password" });
    }
  } catch (error) {
    return res.status(500).json({ msg: "Internal Server Error" });
  }
}

export async function handleOTPSending(req, res) {
  try {
    const { email, OTP } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.json("Invalid Credentials");
    }
    const token = setUser(user);

    var transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_APP_PASSWORD,
      },
    });
    var mailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: "Reset Password",
      text: `Your OTP IS ${OTP}`,
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        // console.log(error);
        return res.json(error);
      } else {
        return res.json("Success");
      }
    });
  } catch (error) {
    return res.status(500).json({ msg: "Internal Server Error" });
  }
}

export async function handleForgetPassword(req, res) {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.json("Invalid Credentials");
    }
    const token = setUser(user);

    var transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_APP_PASSWORD,
      },
    });
    var mailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: "Reset Password",
      text: `https://e-cell.in/endeavour/reset-password/${user._id}/${token}`,
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        // console.log(error);
        return res.json(error);
      } else {
        return res.json("Success");
      }
    });
  } catch (error) {
    return res.status(500).json({ msg: "Internal Server Error" });
  }
}

export async function handleResetPassword(req, res) {
  try {
    const { id, token, password } = req.body;
    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        return res.json("Error with token");
      } else {
        const user = await User.findOne({ _id: id });
        if (user.password) {
          const passwordMatch = await bcrypt.compare(password, user.password);
          if (passwordMatch) {
            return res.json("Don't use same password :]");
          }
        }
        const salt = bcrypt.genSaltSync(11);
        const hash_password = await bcrypt.hash(password, salt);
        await User.findByIdAndUpdate({ _id: id }, { password: hash_password });
        return res.json("Successfully Changed the password");
      }
    });
  } catch (error) {
    // console.log(error);
    return res.status(500).json({ msg: "Internal Server Error" });
  }
}

export async function handleRegister(req, res) {
  const { email, password, phoneNumber, username } = req.body;
  // console.log(email, password, phoneNumber, username);
  try {
    const user = await User.findOne({ email });
    if (user) {
      res.json("User Already Exists");
    } else {
      const salt = bcrypt.genSaltSync(11);
      const hash_password = await bcrypt.hash(password, salt);
      const user = new User({
        userName: username,
        password: hash_password,
        email,
        phoneNumber,
      });
      user
        .save()
        .then((user) => {
          const token = setUser(user);
          res.cookie("token", token, { httpOnly: true, secure: true });
          res.json({
            msg: "User saved :)",
            token: token,
            userId: user._id,
            username: user.userName,
          });
        })
        .catch((err) => {
          // console.log(err);
          res.json("Error saving user :(");
        });
    }
  } catch (error) {
    res.json(error);
  }
}

export async function handleMemberSearch(req, res) {
  const { memberId, event } = req.body;
  try {
    const member = await User.find({ _id: memberId });
    if (member) {
      const alreadyInTeam = await User.find({
        $and: [{ _id: memberId }, { "events.eventId": event }],
      });
      if (alreadyInTeam.length > 0) {
        res.json("Already In A Team");
      } else {
        res.json(member[0].userName);
      }
    } else {
      res.json("User Not Exists");
    }
  } catch (error) {
    res.json("User Not Exists");
  }
}

export async function handleRegisterTeam(req, res) {
  const { filteredData, teamName, leaderId, eventId, phoneNumber } = req.body;
  try {
    const user = await User.findOne({
      _id: leaderId,
    });

    if (user) {
      const team = new Team({
        leaderId,
        teamName,
        phoneNumber,
        teamMembers: filteredData.map((member) => member.userId),
        eventId,
        paymentCompleted: false,
      });
      await team.save();

      const teamId = await Team.findOne({
        $and: [{ leaderId }, { eventId }],
      });

      filteredData.push({ userId: leaderId });

      filteredData
        .map((member) => member.userId)
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

export async function handleGoogleLogin(req, res) {
  const { email } = req.body;
  try {
    let user = await User.findOne({ email });
    if (user) {
      const token = setUser(user);
      res.cookie("token", token, { httpOnly: true, secure: true });
      return res.json({
        exists: "true",
        userName: user.userName,
        email: user.email,
        userId: user._id,
        isAdmin: user.isAdmin,
        isSuperAdmin: user.isSuperAdmin,
        token,
      });
    } else {
      return res.json({
        exists: "false",
      });
    }
  } catch (error) {
    // console.error("Error during Google login:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function handleGoogleRegister(req, res) {
  const { email, userName } = req.body;
  try {
    const user = await User.findOne({
      $and: [{ email: email }],
    });

    const randomDigits = Math.floor(Math.random() * 100);

    if (user) {
      res.json("User Already Exists");
    } else {
      const user = new User({
        email,
        userName: userName + randomDigits,
      });

      user
        .save()
        .then((user) => {
          const token = setUser(user);
          // console.log(token);
          res.cookie("token", token, { httpOnly: true, secure: true });
          return res.json({
            created: true,
          });
        })
        .catch((err) => {
          res.json("Error saving user:", err);
        });
    }
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function UserInfo(req, res) {
  const eventname = [];
  const teamId = [];
  let authData;

  jwt.verify(req.token, process.env.JWT_SECRET, (err, authD) => {
    if (err) {
      return res.json({ msg: "invalid token" });
    } else {
      authData = authD;
      userInfo();
    }
  });

  async function userInfo() {
    const userId = authData._id;
    try {
      let user = await User.findOne({ _id: userId });
      if (!user) {
        return res.json("User Not Exists");
      }

      if (!user.events || user.events.length === 0) {
        return res.json({ user: user });
      }

      await Promise.all(
        user.events.map(async (event) => {
          try {
            let eventm = await Event.findOne({ _id: event.eventId });
            eventname.push({
              eventName: eventm.name,
              eventId: eventm._id.toString(),
            });
            teamId.push(event.teamId);
          } catch (error) {
            throw new Error("Error fetching event data");
          }
        })
      );

      return res.json({ user: user, eventl: eventname, teamIds: teamId });
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  }
}

export async function RegisteredEvents(req, res) {
  const { teamId } = req.body;
  if (!teamId) {
    return res.json({ msg: "Not Registered in any Team" });
  }
  try {
    const uniqueUserIds = new Set(); // Use a Set to collect unique user IDs
    // Iterate over each team ID and collect unique user IDs
    await Promise.all(
      teamId.map(async (team) => {
        try {
          const Teamm = await Team.findOne({ _id: team });
          Teamm.teamMembers.forEach((userId) => uniqueUserIds.add(userId)); // Add unique user IDs to the Set
          uniqueUserIds.add(Teamm.leaderId);
        } catch (error) {
          throw new Error("Error fetching team data");
        }
      })
    );
    // Fetch user documents corresponding to the unique user IDs
    const users = await User.find({ _id: { $in: Array.from(uniqueUserIds) } });
    // Send the response with the unique users
    return res.json({ members: users });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function paymentInfo(req, res) {
  const { userId } = req.params;
  const eventname = [];
  try {
    const paymentInfo = await Payment.find({ userId });
    const eveInfo = await Eve.findOne({ userId });
    // console.log(eveInfo);

    await Promise.all(
      paymentInfo.map(async (payment) => {
        try {
          const event = await Event.findOne({ _id: payment.eventId });
          eventname.push({ id: event._id, name: event.name });
        } catch (error) {
          throw new Error("Error fetching team data");
        }
      })
    );
    return res.json({
      payment: paymentInfo,
      eventname: eventname,
      eveInfo: eveInfo,
    });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function UpdateDetails(req, res) {
  let authData;

  jwt.verify(req.token, process.env.JWT_SECRET, (err, authD) => {
    if (err) {
      return res.json({ msg: "invalid token" });
    } else {
      authData = authD;
      updateUserInfo();
    }
  });

  async function updateUserInfo() {
    const userId = authData._id;
    const { phoneNumber, college, course, year, studentId, gender, city } =
      req.body;
    try {
      let user = await User.findOne({ _id: userId });
      if (user) {
        await User.findByIdAndUpdate(
          { _id: userId },
          { phoneNumber, college, course, year, studentId, gender, city }
        );
        return res.json("Successfully Updated");
      } else {
        return res.json("User Not Exists");
      }
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  }
}

export async function searchUserName(req, res) {
  try {
    const { username } = req.body;
    const user = await User.findOne({ userName: username });
    if (user) {
      return res.json({ msg: "Taken" });
    } else {
      return res.json({ msg: "Not Taken" });
    }
  } catch (error) {
    return res.status(500).json({ msg: "Internal Server Error" });
  }
}

export async function isLeader(req, res) {
  let teamDetails = [];
  const { eventId } = req.params;
  jwt.verify(req.token, process.env.JWT_SECRET, async (err, authD) => {
    if (err) {
      return res.json({ msg: "invalid token" });
    } else {
      let user = await User.findOne({ _id: authD._id });
      if (user) {
        const team = await Team.findOne({
          $and: [{ leaderId: authD._id }, { eventId }],
        });

        const event = await Event.findOne({ _id: eventId });

        if (team) {
          team.teamMembers.push(team.leaderId);
          teamDetails.push({
            teamMembers: team.teamMembers,
            teamlength: team.teamMembers.length,
            eventId: team.eventId,
            teamSize: event.teamSize,
            teamId: team._id,
          });
          return res.json({
            msg: "leader",
            teamDetails,
          });
        } else {
          return res.json({ msg: "not a leader" });
        }
      } else {
        return res.json({ msg: "invalid user" });
      }
    }
  });
}

export async function addMember(req, res) {
  const { teammember, eventId, teamId } = req.body;
  // console.log(teammember, eventId, teamId);
  try {
    const team = await Team.findOne({ _id: teamId });
    // team.teamMember.push(teammember);
    // console.log(team);
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    team.teamMembers.push(teammember);

    const newEvent = { eventId, teamId };

    const user = await User.findOne({ _id: teammember });
    user.events.push(newEvent);

    await team.save();
    await user.save();

    // Return the updated team document
    res.status(200).json({
      message: "Team member updated successfully",
    });
  } catch (error) {
    // console.log(error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function isLeaderforpayment(req, res) {
  const { userId, eventId } = req.params;
  try {
    const team = await Team.findOne({
      $and: [{ leaderId: userId }, { eventId }],
    });
    if (team) {
      return res.json({
        msg: "leader",
      });
    } else {
      return res.json({
        msg: "Not a Leader",
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function certInfo(req, res) {
  const { userId } = req.params;
  const events = [
    { name: "Market-Watch", id: "6611852e883214b109d2e89e" },
    { name: "B-Quiz", id: "6611852e883214b109d2e89f" },
    { name: "B-Plan", id: "6611852e883214b109d2e8a0" },
    { name: "IPL Mania", id: "6611852e883214b109d2e8a1" },
    { name: "Movie-A-thon", id: "6611874dc1d2ef7cfdd0154b" },
    { name: "E-Sports(BGMI)", id: "66118a00c6665db651249ee8" },
    { name: "Treasure Hunt", id: "66126286c559174d3c6f41ae" },
  ];

  try {
    const user = await User.findOne({ _id: userId });
    if (!user) {
      return res.json({ msg: "no" });
    }

    if (user.isCertDownloadable !== "yes") {
      return res.json({ msg: "no" });
    }
    const participatedEventNames = [];
    for (const participatedEvent of user.events) {
      for (const event of events) {
        if (participatedEvent.eventId === event.id) {
          const team = await Team.findOne({ _id: participatedEvent.teamId });
          if (team && team.paymentCompleted === true) {
            participatedEventNames.push(event.name);
          }
        }
      }
    }
    return res.json({
      msg: "yes",
      realName: user.realName,
      college: user.college,
      participatedEventNames: participatedEventNames,
    });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function certCreated(req, res) {
  const { userId } = req.params;
  const { fullName, collegeName } = req.body;

  try {
    const user = await User.findOne({ _id: userId });
    // const eve = await Eve.findOne({ _id: "6631eaba89ba284fc5d578b2" });
    // console.log(eve._id.getTimestamp());
    if (user) {
      if (user.isCertDownloadable == "yes") {
        return res.json({
          msg: "yes",
        });
      }
      await User.findByIdAndUpdate(
        { _id: userId },
        { isCertDownloadable: "yes", realName: fullName, college: collegeName }
      );
      return res.json({
        msg: "no",
      });
    }
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
}