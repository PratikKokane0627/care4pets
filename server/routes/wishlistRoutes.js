import express from "express";

import {
  addToWishlist,getMyWishlist, removeFromWishlist, clearWishlist,moveWishlistToCart,
} from "../controllers/wishlistController.js";

import {
  protect,
} from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/",protect,addToWishlist);
router.get("/",protect, getMyWishlist);
router.delete("/",protect, clearWishlist);

router.post("/:productId/move-to-cart",protect, moveWishlistToCart);
router.delete("/:productId",protect,removeFromWishlist);

export default router;