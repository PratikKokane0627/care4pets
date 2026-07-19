import express from "express";

import {
  createGroomingBooking,
} from "../controllers/groomingBookingController.js";

import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.post(
  "/",
  protect,
  authorize("owner"),
  createGroomingBooking
);

export default router;