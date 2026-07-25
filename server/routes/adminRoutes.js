import express from "express";

import {
  approveVet,
  createGroomer,
  deleteUser,
  getAppointments,
  getDashboard,
  getGroomers,
  getPayments,
  getReports,
  getUserById,
  getUsers,
  getVets,
  rejectVet,
  updateGroomerStatus,
  updateUserStatus,
} from "../controllers/adminController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(protect, authorize("admin"));

router.get("/dashboard", getDashboard);
router.get("/users", getUsers);
router.get("/users/:id", getUserById);
router.patch("/users/:id/status", updateUserStatus);
router.delete("/users/:id", deleteUser);

router.get("/vets", getVets);
router.patch("/vets/:id/approve", approveVet);
router.patch("/vets/:id/reject", rejectVet);

router.get("/groomers", getGroomers);
router.post("/groomers", createGroomer);
router.patch("/groomers/:id/status", updateGroomerStatus);

router.get("/appointments", getAppointments);
router.get("/payments", getPayments);
router.get("/reports", getReports);

export default router;
