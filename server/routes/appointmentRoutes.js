import express from "express";

import { bookAppointment, getMyAppointments, getAppointmentById, cancelAppointment, } from "../controllers/appointmentController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.post("/",protect,authorize("owner"),bookAppointment);
router.get("/",protect,authorize("owner"),getMyAppointments);

router.get("/:id",protect,authorize("owner", "vet", "admin"),getAppointmentById);

router.put("/:id/cancel",protect,authorize("owner"),cancelAppointment);

export default router;