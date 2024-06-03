import express from "express";
const router = express.Router();
import {
  handleLogin,
  handleRegister,
  handleRegisterTeam,
  handleMemberSearch,
  handleGoogleLogin,
  handleGoogleRegister,
  handleForgetPassword,
  handleResetPassword,
  handleOTPSending,
  UserInfo,
  UpdateDetails,
  RegisteredEvents,
  paymentInfo,
  certInfo,
  certCreated,
  searchUserName,
  isLeader,
  addMember,
  isLeaderforpayment,
} from "../controllers/users.js";
import { checkAuth, restrictToLogInUserOnly } from "../middlewares/auth.js";

function verifyToken(req, res, next) {
  const bearerHeader = req.headers["authorization"];
  if (typeof bearerHeader !== "undefined") {
    const bearer = bearerHeader.split(" ");
    const token = bearer[1];
    req.token = token;
    next();
  } else {
    return res.json({ err: "Token is not valid" });
  }
}

router.post("/login", handleLogin);
router.post("/search-user-name", searchUserName);
router.post("/register", handleRegister);
router.post("/GoogleLogin", handleGoogleLogin);
router.post("/GoogleRegister", handleGoogleRegister);

router.get("/user-info", verifyToken, UserInfo);
router.patch("/update-details/:userId", verifyToken, UpdateDetails);
router.post("/registered-events", RegisteredEvents);
router.get("/payment-info/:userId", paymentInfo);
router.get("/cert-info/:userId", certInfo);
router.post("/cert-created/:userId", certCreated);

router.get("/isLeader/:eventId", verifyToken, isLeader);
router.post("/addMember", addMember);

router.post("/memberSearch", handleMemberSearch);
router.get(`/isLeaderforpayment/:userId/:eventId`, isLeaderforpayment);
router.post("/registerteam", handleRegisterTeam);

router.post("/send-otp", handleOTPSending);
router.post("/forget-password", handleForgetPassword);
router.post("/reset-password", handleResetPassword);

export default router;
