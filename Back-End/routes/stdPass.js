import express from "express";
import {handleStudentPass} from "../controllers/stdPass.js";
const router= express.Router();

router.post("/studentpass", handleStudentPass);

export default router;