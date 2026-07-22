import express from "express";
import { placeOrder,getMyOrders, getOrderById, cancelOrder, getAllOrders,updateOrderStatus,

 } from "../controllers/orderController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.post("/", protect, placeOrder);
router.get("/my-orders",protect,getMyOrders);
router.get("/admin/all",protect,authorize("admin"),getAllOrders);

router.patch("/admin/:id/status",protect,authorize("admin"),updateOrderStatus);
router.patch( "/:id/cancel",protect,cancelOrder);
router.get("/:id",protect,getOrderById);

export default router;