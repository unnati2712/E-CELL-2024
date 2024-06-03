import Event from "../models/events.js";
import Payment from "../models/payments.js";
import User from "../models/users.js";
import Team from "../models/teams.js";

export async function handleEventById(req, res) {
  const { eventId } = req.params;
  const { userId } = req.body;
  // console.log(eventId, userId);
  try {
    const event = await Event.findOne({
      _id: eventId,
    });

    if (event) {
      if (event.price == "Free") {
        const isRegistered = await User.findOne({
          $and: [{ _id: userId }, { "events.eventId": eventId }],
        });
        if (isRegistered) {
          return res.json({
            event: event,
            payment: "Done",
            registration: "Done",
          });
        } else {
          return res.json({
            event: event,
            payment: "Done",
            registration: "Not Done",
          });
        }
      } else {
        // const isPaid = await Payment.findOne({
        //   $and: [{ userId }, { eventId }],
        // });
        const isRegistered = await User.findOne({
          $and: [{ _id: userId }, { "events.eventId": eventId }],
        });

        if (isRegistered) {
          // const isRegistered = await User.findOne({
          //   $and: [{ _id: userId }, { "events.eventId": eventId }],
          // });

          const isPaid = await Payment.findOne({
            $and: [{ userId }, { eventId }],
          });

          if (isPaid) {
            return res.json({
              event: event,
              payment: "Done",
              registration: "Done",
            });
          } else {
            let teamWithUser = await Team.findOne({
              eventId,
              teamMembers: userId,
            });

            if (teamWithUser) {
              const isMemberPaid = await Payment.findOne({
                $and: [{ userId: teamWithUser.leaderId }, { eventId }],
              });
              if (isMemberPaid) {
                return res.json({
                  event: event,
                  payment: "Done",
                  registration: "Done",
                });
              }
            }

            res.json({
              event: event,
              payment: "Not Done",
              registration: "Done",
            });
          }
        } else {
          res.json({
            event: event,
            payment: "Not Done",
            registration: "Not Done",
          });
          // res.json({
          //   event: event,
          //   payment: "Not Done",
          // });
        }
      }
    } else {
      return res.json("notExists");
    }
  } catch (error) {
    // console.log(error);
    res.json("notExists");
  }
}

export async function handleAllEvent(req, res) {
  try {
    const events = await Event.find();
    if (events) {
      res.json(events);
    } else {
      res.json("notExists");
    }
  } catch (error) {
    res.json("notExists");
  }
}
