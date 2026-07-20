import express from "express";

import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

import {
  createCategory,
} from "../controllers/categoryController.js";


const router = express.Router();

router.post("/",protect,authorize("admin"),createCategory);

export default router;