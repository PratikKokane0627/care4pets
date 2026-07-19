import express from "express";

import {
  createGroomingService,
} from "../controllers/groomingServiceController.js";

import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.post("/",protect,authorize("admin"),createGroomingService);

export default router;