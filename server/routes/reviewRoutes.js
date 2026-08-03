import express from "express";
import {
  addReview,
  addGroomerReview,
  addVetReview,
  getGroomerReviewsById,
  getProductReviews,
  getVetReviewsById,
  updateReview,
  deleteReview,
  getAllReviews,
  adminDeleteReview,
  getReviewDashboard,
} from "../controllers/reviewController.js";
import {protect,} from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.post("/", protect, addReview);
router.post("/vet", protect, authorize("owner"), addVetReview);
router.post("/groomer", protect, authorize("owner"), addGroomerReview);

router.get("/product/:productId",getProductReviews);
router.get("/vet/:vetId", getVetReviewsById);
router.get("/groomer/:groomerId", getGroomerReviewsById);
router.get("/admin/all", protect, authorize("admin"),getAllReviews);
router.get("/admin/dashboard",protect,authorize("admin"),getReviewDashboard);
router.delete("/admin/:id",protect,authorize("admin"),adminDeleteReview);
router.put("/:id",protect,updateReview);
router.delete("/:id",protect,deleteReview);

export default router;
