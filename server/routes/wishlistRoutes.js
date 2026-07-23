import express from "express";

import {
  addToWishlist,
} from "../controllers/wishlistController.js";

import {
  protect,
} from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/",protect,addToWishlist);

export default router;