import express from "express";
import { placeOrder,getMyOrders, getOrderById,

 } from "../controllers/orderController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, placeOrder);
router.get("/my-orders",protect,getMyOrders);

router.get("/:id",protect,getOrderById);

export default router;