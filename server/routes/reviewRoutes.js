import express from "express";
import {
  addReview,getProductReviews,updateReview, deleteReview, getAllReviews,adminDeleteReview,
} from "../controllers/reviewController.js";
import {protect,} from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.post("/", protect, addReview);

router.get("/product/:productId",getProductReviews);
router.get("/admin/all", protect, authorize("admin"),getAllReviews);
router.delete("/admin/:id",protect,authorize("admin"),adminDeleteReview);
router.put("/:id",protect,updateReview);
router.delete("/:id",protect,deleteReview);

export default router;