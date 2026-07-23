import express from "express";

import {
  addToWishlist,getMyWishlist, removeFromWishlist, clearWishlist,
} from "../controllers/wishlistController.js";

import {
  protect,
} from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/",protect,addToWishlist);
router.get("/",protect, getMyWishlist);
router.delete("/",protect, clearWishlist);


router.delete("/:productId",protect,removeFromWishlist);

export default router;