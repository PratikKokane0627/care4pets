import express from "express";

import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

import {
    createCategory, getAllCategories, getCategoryById, updateCategory, deleteCategory,uploadCategoryImage,
} from "../controllers/categoryController.js";


const router = express.Router();

router.post("/", protect, authorize("admin"), createCategory);
router.get("/", getAllCategories);

router.get("/:id", getCategoryById);
router.put("/:id", protect, authorize("admin"), updateCategory);
router.delete("/:id", protect, authorize("admin"), deleteCategory);

router.post("/:id/upload-image", protect,authorize("admin"),upload.single("image"), uploadCategoryImage);

export default router;