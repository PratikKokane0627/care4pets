import express from "express";
import {
  changePassword,
  deleteAccount,
  deleteProfileImage,
  forgotPassword,
  getProfile,
  login,
  register,
  resetPassword,
  // Email verification before login temporarily disabled.
  // sendOtp,
  updateProfile,
  updateProfileImage,
  // verifyOtp,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";
import { authRateLimit } from "../middleware/rateLimitMiddleware.js";

const router = express.Router();

// Register
router.post("/register", authRateLimit, register);
router.post("/login", authRateLimit, login);
// Email verification before login temporarily disabled.
// router.post("/send-otp", authRateLimit, sendOtp);
// router.post("/verify-otp", authRateLimit, verifyOtp);
router.post("/forgot-password", authRateLimit, forgotPassword);
router.post("/reset-password/:token", authRateLimit, resetPassword);

router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);
router.put("/profile/image", protect, upload.single("image"), updateProfileImage);
router.delete("/profile/image", protect, deleteProfileImage);
router.post("/change-password", protect, changePassword);
router.put("/change-password", protect, changePassword);
router.delete("/account", protect, deleteAccount);

export default router;
