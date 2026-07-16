import express from "express";

import { createVet } from "../controllers/vetController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.post("/", protect, authorize("admin"), createVet);

export default router;