import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { createPaymentOrder,  verifyPayment,getPaymentSuccess, paymentFailure, } from "../controllers/paymentController.js";

const router = express.Router();

router.post("/create-order/:orderId",protect,createPaymentOrder);
router.post("/verify-payment", protect,verifyPayment);
router.get("/success/:orderId",protect,getPaymentSuccess);
router.post("/failure",protect,paymentFailure);

export default router;