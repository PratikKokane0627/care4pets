import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import { createPaymentOrder,  verifyPayment,getPaymentSuccess, paymentFailure, getPaymentHistory, refundPayment, } from "../controllers/paymentController.js";

const router = express.Router();

router.post("/create-order/:orderId",protect,createPaymentOrder);
router.post("/verify-payment", protect,verifyPayment);
router.get("/history",protect, getPaymentHistory);
router.get("/success/:orderId",protect,getPaymentSuccess);
router.post("/failure",protect,paymentFailure);
router.post( "/refund/:orderId", protect, authorize("admin"),refundPayment);

export default router;