import Razorpay from "../config/razorpay.js";
import Order from "../models/Order.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import mongoose from "mongoose";

export const createPaymentOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const userId = req.user._id;

  // Validate Order ID
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    throw new ApiError(400, "Invalid order ID");
  }

  // Find Order
  const order = await Order.findOne({
    _id: orderId,
    userId,
  });

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  // Only ONLINE payments
  if (order.paymentMethod !== "ONLINE") {
    throw new ApiError(
      400,
      "This order is not eligible for online payment"
    );
  }

  // Already paid
  if (order.paymentStatus === "Paid") {
    throw new ApiError(
      400,
      "Order has already been paid"
    );
  }

  // Cancelled Order
  if (order.orderStatus === "Cancelled") {
    throw new ApiError(
      400,
      "Cancelled orders cannot be paid"
    );
  }

  const options = {
    amount: Math.round(order.totalAmount * 100), // paise
    currency: "INR",
    receipt: `order_${order._id}`,
    payment_capture: 1,
    notes: {
      orderId: order._id.toString(),
      userId: userId.toString(),
    },
  };

  const razorpayOrder = await Razorpay.orders.create(options);

  order.razorpayOrderId = razorpayOrder.id;

  await order.save();

  res.status(201).json({
    success: true,
    message: "Payment order created successfully",
    payment: {
      orderId: order._id,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key: process.env.RAZORPAY_KEY_ID,
    },
  });
});