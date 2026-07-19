import express from "express";

import {
  createGroomingBooking,  getMyGroomingBookings,getAvailableGroomingBookings,
} from "../controllers/groomingBookingController.js";

import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.post("/",protect,authorize("owner"),createGroomingBooking);
 router.get('/', protect,authorize("owner"),getMyGroomingBookings);
router.get("/available",protect,authorize("groomer"),getAvailableGroomingBookings);

export default router;