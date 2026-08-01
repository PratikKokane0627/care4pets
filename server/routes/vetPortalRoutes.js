import express from "express";

import {
  getVetDashboard,
  getVetPatientById,
  getVetPatients,
  getVetPrescriptions,
  getVetReviews,
  getVetReviewSummary,
} from "../controllers/vetPortalController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(protect, authorize("vet"));

router.get("/dashboard", getVetDashboard);
router.get("/patients", getVetPatients);
router.get("/patients/:petId", getVetPatientById);
router.get("/prescriptions", getVetPrescriptions);
router.get("/reviews", getVetReviews);
router.get("/reviews/summary", getVetReviewSummary);

export default router;
