import express from "express";
import {
  registerUser,
  loginUser,
  getUserStatus,
} from "../controllers/authController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

//Public route
router.post("/register", registerUser);
router.post("/login", loginUser);

//protected route
router.get("/status", protect, getUserStatus);

export default router;
