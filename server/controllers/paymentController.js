import Razorpay from "../config/razorpay.js";
import Order from "../models/Order.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import mongoose from "mongoose";
import crypto from "crypto";
import razorpay from "../config/razorpay.js";

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


export const verifyPayment = asyncHandler(async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  } = req.body;

  if (
    !razorpay_order_id ||
    !razorpay_payment_id ||
    !razorpay_signature
  ) {
    throw new ApiError(
      400,
      "All payment details are required"
    );
  }

  // Find Order
  const order = await Order.findOne({
    razorpayOrderId: razorpay_order_id,
  }).select("+razorpaySignature");

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  if (order.paymentStatus === "Paid") {
    throw new ApiError(
      400,
      "Payment already verified"
    );
  }

  // Generate Signature
  const body =
    razorpay_order_id + "|" + razorpay_payment_id;

  const expectedSignature = crypto
    .createHmac(
      "sha256",
      process.env.RAZORPAY_KEY_SECRET
    )
    .update(body)
    .digest("hex");

  // Verify Signature
  if (expectedSignature !== razorpay_signature) {
    order.paymentStatus = "Failed";
    order.failedAt = new Date();
    order.paymentFailureReason =
      "Signature verification failed";

    await order.save();

    throw new ApiError(
      400,
      "Invalid payment signature"
    );
  }

  // Payment Success
  order.paymentStatus = "Paid";
  order.orderStatus = "Confirmed";

  order.razorpayPaymentId = razorpay_payment_id;
  order.razorpaySignature = razorpay_signature;
  order.paidAt = new Date();

  await order.save();

  res.status(200).json({
    success: true,
    message: "Payment verified successfully",
    payment: {
      orderId: order._id,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      razorpayPaymentId: order.razorpayPaymentId,
      paidAt: order.paidAt,
    },
  });
});


export const getPaymentSuccess = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const userId = req.user._id;

  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    res.status(400);
    throw new Error("Invalid order ID");
  }

  const order = await Order.findOne({
    _id: orderId,
    userId,
  })
    .select(
      `
        orderNumber
        totalAmount
        paymentMethod
        paymentStatus
        orderStatus
        razorpayOrderId
        razorpayPaymentId
        paidAt
        createdAt
      `
    )
    .lean();

  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  if (order.paymentStatus !== "Paid") {
    res.status(400);
    throw new Error("Payment has not been completed");
  }

  res.status(200).json({
    success: true,
    message: "Payment completed successfully",
    payment: {
      orderId: order._id,
      orderNumber: order.orderNumber,
      amount: order.totalAmount,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      orderStatus: order.orderStatus,
      razorpayOrderId: order.razorpayOrderId,
      razorpayPaymentId: order.razorpayPaymentId,
      paidAt: order.paidAt,
      createdAt: order.createdAt,
    },
  });
});

export const paymentFailure = asyncHandler(async (req, res) => {
  const {
    razorpay_order_id,
    errorCode,
    errorDescription,
    errorSource,
    errorStep,
    errorReason,
  } = req.body || {};

  if (!razorpay_order_id) {
    res.status(400);
    throw new Error("Razorpay order ID is required");
  }

  const order = await Order.findOne({
    razorpayOrderId: razorpay_order_id,
    userId: req.user._id,
  });

  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  if (order.paymentStatus === "Paid") {
    res.status(400);
    throw new Error("Payment is already completed");
  }

  order.paymentStatus = "Failed";
  order.failedAt = new Date();

  order.paymentFailureReason =
    errorDescription ||
    errorReason ||
    "Payment failed";

  await order.save();

  res.status(200).json({
    success: true,
    message: "Payment failure recorded successfully",
    payment: {
      orderId: order._id,
      razorpayOrderId: order.razorpayOrderId,
      paymentStatus: order.paymentStatus,
      failureReason: order.paymentFailureReason,
      failedAt: order.failedAt,
      error: {
        code: errorCode || null,
        source: errorSource || null,
        step: errorStep || null,
        reason: errorReason || null,
      },
    },
  });
});
export const getPaymentHistory = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;

  const skip = (page - 1) * limit;

  const totalPayments = await Order.countDocuments({
    userId,
    paymentStatus: {
      $in: ["Paid", "Failed", "Refunded"],
    },
  });

  const payments = await Order.find({
    userId,
    paymentStatus: {
      $in: ["Paid", "Failed", "Refunded"],
    },
  })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.status(200).json({
    success: true,
    currentPage: page,
    totalPages: Math.ceil(totalPayments / limit),
    totalPayments,
    payments,
  });
});

export const refundPayment = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    res.status(400);
    throw new Error("Invalid order ID");
  }

  const order = await Order.findById(orderId);

  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  if (order.paymentStatus !== "Paid") {
    res.status(400);
    throw new Error("Only paid orders can be refunded");
  }

  if (!order.razorpayPaymentId) {
    res.status(400);
    throw new Error("Razorpay payment ID not found");
  }

  const refund = await razorpay.payments.refund(
    order.razorpayPaymentId,
    {
      amount: order.totalAmount * 100, // amount in paise
    }
  );

  order.paymentStatus = "Refunded";
  order.refundId = refund.id;
  order.refundAmount = refund.amount / 100;
  order.refundedAt = new Date();

  await order.save();

  res.status(200).json({
    success: true,
    message: "Payment refunded successfully",
    refund: {
      refundId: refund.id,
      amount: refund.amount / 100,
      status: refund.status,
      refundedAt: order.refundedAt,
    },
  });
});


export const razorpayWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers["x-razorpay-signature"];

  const expectedSignature = crypto
    .createHmac(
      "sha256",
      process.env.RAZORPAY_WEBHOOK_SECRET
    )
    .update(req.body)
    .digest("hex");

  if (signature !== expectedSignature) {
    return res.status(400).json({
      success: false,
      message: "Invalid webhook signature",
    });
  }

  const event = JSON.parse(req.body.toString());

  switch (event.event) {
    case "payment.captured": {
      const payment = event.payload.payment.entity;

      const order = await Order.findOne({
        razorpayOrderId: payment.order_id,
      });

      if (order) {
        order.paymentStatus = "Paid";
        order.orderStatus = "Confirmed";
        order.razorpayPaymentId = payment.id;
        order.paidAt = new Date();

        await order.save();
      }

      break;
    }

    case "refund.processed": {
      const refund = event.payload.refund.entity;

      const order = await Order.findOne({
        razorpayPaymentId: refund.payment_id,
      });

      if (order) {
        order.paymentStatus = "Refunded";
        order.refundId = refund.id;
        order.refundAmount = refund.amount / 100;
        order.refundedAt = new Date();

        await order.save();
      }

      break;
    }

    default:
      console.log("Unhandled event:", event.event);
  }

  res.status(200).json({
    success: true,
    message: "Webhook processed successfully",
  });
});