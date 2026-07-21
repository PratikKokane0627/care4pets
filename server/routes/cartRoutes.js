import express from "express";
import { addToCart,getUserCart,updateCartItemQuantity,removeCartItem,clearCart,

 } from "../controllers/cartController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/",protect, getUserCart)
router.post("/", protect, addToCart);
router .delete("/",protect, clearCart);

router.patch("/:productId",protect,updateCartItemQuantity);
router.delete("/:productId",protect, removeCartItem);


export default router;