import "dotenv/config";
import nodemailer from "nodemailer";
import { instance } from "../index.js";
import crypto from "crypto";
import Payment from "../models/payments.js";
import Team from "../models/teams.js";
import User from "../models/users.js";
import Eve from "../models/eves.js";

export const checkout = async (req, res) => {
  try {
    const options = {
      amount: Number(req.body.amount * 100),
      currency: "INR",
    };
    const order = await instance.orders.create(options);
    res.status(200).json({
      success: true,
      order,
    });
  } catch (e) {
    res.json(e);
  }
};

export const key = async (req, res) => {
  res.status(200).json({ key: process.env.RAZORPAY_API_KEY });
};

export const paymentverification = async (req, res) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } =
      req.body;

    const { userId, eventId, amount } = req.params;

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_APT_SECRET)
      .update(body.toString())
      .digest("hex");

    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
      const team = await Team.findOne({
        $and: [{ leaderId: userId }, { eventId }],
      });
      if (team) {
        const updatedTeam = await Team.findOneAndUpdate(
          { leaderId: userId, eventId: eventId },
          { $set: { paymentCompleted: true } },
          { new: true } // Return the updated document
        );
        await Payment.create({
          userId,
          eventId,
          amount,
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature,
          status: "SUCCESS",
        });
      } else {
        const teamWithUser = await Team.findOne({
          eventId,
          teamMembers: userId,
        });
        if (teamWithUser) {
          // console.log("Team found with user:", teamWithUser);
          // return teamWithUser;
          let teamWithUser = await Team.findOneAndUpdate(
            { eventId, teamMembers: userId },
            { $set: { paymentCompleted: true } }, // Update paymentCompleted to true
            { new: true } // Return the modified document
          );

          await Payment.create({
            userId: teamWithUser.leaderId,
            eventId,
            amount,
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            status: "SUCCESS",
            paidBy: userId,
          });
        }
      }
      const user = await User.findOne({ _id: userId });

      var transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL,
          pass: process.env.EMAIL_APP_PASSWORD,
        },
      });
      var mailOptions = {
        from: process.env.EMAIL,
        to: user.email,
        subject: "Successfully registered for Endeavour'24",
        html: `
    <p>Dear ${user.userName},</p>
    <p>We are delighted to inform you that your registration for the Endeavour 2024 has been successfully processed. We appreciate your interest and are thrilled to have you join us.</p>
    <p>You will receive further communication from us regarding the event details, schedule, and any other necessary information. In the meantime, please feel free to contact us if you have any questions or concerns.</p>
    <p>We look forward to seeing you at the event and making it a memorable experience for you.</p>
    <p>Visit our website: <a href="https://www.e-cell.in/endeavour">https://www.e-cell.in/endeavour</a></p>
    <p>Best Regards,</p>
    <p>Team E-Cell KIET</p>
  `,
      };
      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          return res.redirect(`https://e-cell.in/endeavour/events/${eventId}`);
        } else {
          return res.redirect(`https://e-cell.in/endeavour/events/${eventId}`);
        }
      });
    } else {
      res.status(400).json({
        success: false,
      });
    }
  } catch (e) {
    res.json(e);
  }
};

export const EvePaymentVerification = async (req, res) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } =
      req.body;

    const { userId, amount, libId } = req.params;

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_APT_SECRET)
      .update(body.toString())
      .digest("hex");

    const isAuthentic = expectedSignature === razorpay_signature;
    // console.log(isAuthentic);

    // const user = await User.find({ _id: userId });

    await Eve.create({
      userId,
      // email: user[0].email,
      libId,
      amount,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      status: "SUCCESS",
    });

    return res.redirect(`https://e-cell.in/endeavour/eve`);

    //     var transporter = nodemailer.createTransport({
    //       service: "gmail",
    //       auth: {
    //         user: process.env.EMAIL,
    //         pass: process.env.EMAIL_APP_PASSWORD,
    //       },
    //     });
    //     var mailOptions = {
    //       from: process.env.EMAIL,
    //       to: user.email,
    //       subject: "Successfully registered for Endeavour'24",
    //       html: `
    //   <p>Dear ${user.userName},</p>
    //   <p>We are delighted to inform you that your registration for the Endeavour 2024 has been successfully processed. We appreciate your interest and are thrilled to have you join us.</p>
    //   <p>You will receive further communication from us regarding the event details, schedule, and any other necessary information. In the meantime, please feel free to contact us if you have any questions or concerns.</p>
    //   <p>We look forward to seeing you at the event and making it a memorable experience for you.</p>
    //   <p>Visit our website: <a href="https://www.e-cell.in/endeavour">https://www.e-cell.in/endeavour</a></p>
    //   <p>Best Regards,</p>
    //   <p>Team E-Cell KIET</p>
    // `,
    //     };
    //     transporter.sendMail(mailOptions, function (error, info) {
    //       if (error) {
    //         console.log(error);
    //         return res.redirect(
    //           `http://localhost:5173/endeavour/events/${eventId}`
    //         );
    //       } else {
    //         return res.redirect(
    //           `http://localhost:5173/endeavour/events/${eventId}`
    //         );
    //       }
    //     });
  } catch (e) {
    res.json(e);
  }
};

export const EveVerify = async (req, res) => {
  const { userId } = req.body;
  try {
    const eveverify = await Eve.findOne({ userId });
    if (eveverify) {
      return res.json({ msg: "Done" });
    }
    return res.json({ msg: "Not Done" });
  } catch (e) {
    res.json(e);
  }
};
