import express from "express";

import { addPet } from "../controllers/petController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.post("/", protect, authorize("owner"), addPet);

export default router;