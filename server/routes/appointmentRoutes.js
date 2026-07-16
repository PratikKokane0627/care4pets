import express from "express";

import { bookAppointment } from "../controllers/appointmentController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.post("/",protect,authorize("owner"),bookAppointment);

export default router;