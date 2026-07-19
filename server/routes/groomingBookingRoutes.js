import express from "express";

import {
  createGroomingBooking,  getMyGroomingBookings,getAvailableGroomingBookings, getGroomerBookings, acceptGroomingBooking,rejectGroomingBooking,
} from "../controllers/groomingBookingController.js";

import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.post("/",protect,authorize("owner"),createGroomingBooking);
 router.get('/', protect,authorize("owner"),getMyGroomingBookings);
router.get("/available",protect,authorize("groomer"),getAvailableGroomingBookings);
router.get("/groomer",protect,authorize("groomer"),getGroomerBookings);

router.put("/:id/accept",protect,authorize("groomer"),acceptGroomingBooking);
router.put("/:id/reject",protect,authorize("groomer"),rejectGroomingBooking);

export default router;