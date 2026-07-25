import express from "express";

import {
  getAvailableGroomers,
  getMyGroomerProfile,
  updateMyAvailability,
  updateMyGroomerProfile,
} from "../controllers/groomerController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get("/available", protect, getAvailableGroomers);
router.get("/profile", protect, authorize("groomer"), getMyGroomerProfile);
router.put("/profile", protect, authorize("groomer"), updateMyGroomerProfile);
router.put("/availability", protect, authorize("groomer"), updateMyAvailability);

export default router;
