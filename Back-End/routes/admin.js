import express from "express";
import {
  isAuthorised,
  adminDashboard,
  handleFindUserByEmail,
  handleFindUserByUserId,
  handleEditUser,
  handleCreateTeam,
  handleFetchEvent,
  searchTeam,
  deleteTeam,
  paymentDashboard,
} from "../controllers/admin.js";
const router = express.Router();

router.post("/is-authorised", isAuthorised);

router.get("/admin-dashboard", adminDashboard);

router.post("/find-user-by-email", handleFindUserByEmail);
router.post("/find-user-by-userid", handleFindUserByUserId);
router.patch("/edit-user", handleEditUser);

router.post("/fetch-event", handleFetchEvent);
router.post("/create-team", handleCreateTeam);

router.post("/search-team", searchTeam);
router.post("/delete-team", deleteTeam);

router.get("/payment-dashboard", paymentDashboard);

export default router;
