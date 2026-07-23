import express from "express";

import {
  addToWishlist,getMyWishlist, removeFromWishlist, clearWishlist,moveWishlistToCart,wishlistSummary,getWishlistDashboard,
} from "../controllers/wishlistController.js";

import {
  protect,
} from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.post("/",protect,addToWishlist);
router.get("/",protect, getMyWishlist);
router.delete("/",protect, clearWishlist);
router.get("/admin/dashboard",protect,authorize("admin"),getWishlistDashboard);
router.get("/summary",protect,wishlistSummary);



router.post("/:productId/move-to-cart",protect, moveWishlistToCart);
router.delete("/:productId",protect,removeFromWishlist);

export default router;