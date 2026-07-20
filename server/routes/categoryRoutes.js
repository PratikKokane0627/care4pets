import express from "express";

import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

import {
    createCategory, getAllCategories, getCategoryById, updateCategory, deleteCategory,
} from "../controllers/categoryController.js";


const router = express.Router();

router.post("/", protect, authorize("admin"), createCategory);
router.get("/", getAllCategories);

router.get("/:id", getCategoryById);
router.put("/:id", protect, authorize("admin"), updateCategory);
router.delete("/:id", protect, authorize("admin"), deleteCategory);

export default router;