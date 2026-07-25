import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import { createPaymentOrder,  verifyPayment,getPaymentSuccess, paymentFailure, getPaymentHistory, refundPayment,razorpayWebhook } from "../controllers/paymentController.js";
import { createServicePayment, getServicePaymentHistory, verifyServicePayment } from "../controllers/servicePaymentController.js";

const router = express.Router();

router.post("/create-order/:orderId",protect,createPaymentOrder);
router.post("/verify-payment", protect,verifyPayment);
router.get("/history",protect, getPaymentHistory);
router.get("/success/:orderId",protect,getPaymentSuccess);
router.post("/failure",protect,paymentFailure);
router.post("/service/:type/:id/create", protect, authorize("owner"), createServicePayment);
router.post("/service/verify", protect, authorize("owner"), verifyServicePayment);
router.get("/service/history", protect, authorize("owner"), getServicePaymentHistory);
router.post( "/refund/:orderId", protect, authorize("admin"),refundPayment);
router.post(
  "/webhook",
  razorpayWebhook
);

export default router;
