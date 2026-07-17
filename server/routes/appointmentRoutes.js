import express from "express";

import { bookAppointment, getMyAppointments, getAppointmentById, cancelAppointment, getVetAppointments, acceptAppointment, rejectAppointment,completeAppointment, } from "../controllers/appointmentController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.post("/",protect,authorize("owner"),bookAppointment);
router.get("/",protect,authorize("owner"),getMyAppointments);
router.get("/vet",protect,authorize("vet"),getVetAppointments);

router.get("/:id",protect,authorize("owner", "vet", "admin"),getAppointmentById);

router.put("/:id/cancel",protect,authorize("owner"),cancelAppointment);
router.put("/:id/accept",protect,authorize("vet"),acceptAppointment);
router.put("/:id/reject",protect,authorize("vet"),rejectAppointment);
router.put("/:id/complete",protect,authorize("vet"),completeAppointment);


export default router;