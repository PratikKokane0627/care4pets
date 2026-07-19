import express from "express";

import {
  createGroomingService, getAllGroomingServices,  getGroomingServiceById,updateGroomingService,} from "../controllers/groomingServiceController.js";

import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get("/",getAllGroomingServices);
router.post("/",protect,authorize("admin"),createGroomingService);

router.get("/:id",getGroomingServiceById);
 router.put('/:id',protect,authorize("admin"),updateGroomingService);

export default router;