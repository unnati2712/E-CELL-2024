import express from "express";
import {
  checkout,
  key,
  paymentverification,
  EvePaymentVerification,
  EveVerify,
} from "../controllers/payment.js";
const router = express.Router();
router.route("/checkout").post(checkout);
router
  .route("/paymentverification/:userId/:eventId/:amount")
  .post(paymentverification);
router
  .route("/evepaymentverification/:userId/eve/:amount/:libId")
  .post(EvePaymentVerification);
router.route("/eveverify").post(EveVerify);
router.get("/getkey", key);
export default router;
