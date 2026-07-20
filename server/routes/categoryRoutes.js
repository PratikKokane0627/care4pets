import express from "express";

import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

import {
  createCategory,getAllCategories,
} from "../controllers/categoryController.js";


const router = express.Router();

router.post("/",protect,authorize("admin"),createCategory);
router.get("/",getAllCategories);

export default router;