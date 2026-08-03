import express from "express";

import {
  getAvailableGroomers,
  deleteMyGroomerImage,
  getMyGroomerReviews,
  getMyGroomerProfile,
  uploadMyGroomerImage,
  updateMyAvailability,
  updateMyGroomerProfile,
} from "../controllers/groomerController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.get("/available", protect, getAvailableGroomers);
router.get("/reviews", protect, authorize("groomer"), getMyGroomerReviews);
router.get("/profile", protect, authorize("groomer"), getMyGroomerProfile);
router.put("/profile", protect, authorize("groomer"), updateMyGroomerProfile);
router.put("/profile/image", protect, authorize("groomer"), upload.single("image"), uploadMyGroomerImage);
router.delete("/profile/image", protect, authorize("groomer"), deleteMyGroomerImage);
router.put("/availability", protect, authorize("groomer"), updateMyAvailability);

export default router;
