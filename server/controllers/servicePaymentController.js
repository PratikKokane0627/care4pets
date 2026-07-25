import crypto from "crypto";
import mongoose from "mongoose";

import razorpay from "../config/razorpay.js";
import Appointment from "../models/Appointment.js";
import GroomingBooking from "../models/GroomingBooking.js";
import Notification from "../models/notificationModel.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

const resources = {
  appointment: {
    model: Appointment,
    amount: "consultationFee",
    referenceModel: "Appointment",
    label: "appointment",
  },
  grooming: {
    model: GroomingBooking,
    amount: "price",
    referenceModel: "GroomingBooking",
    label: "grooming booking",
  },
};

const getResource = (type) => {
  const resource = resources[type];
  if (!resource) throw new ApiError(400, "Payment type must be appointment or grooming");
  return resource;
};

export const createServicePayment = asyncHandler(async (req, res) => {
  const resource = getResource(req.params.type);
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    throw new ApiError(400, `Invalid ${resource.label} ID`);
  }

  const record = await resource.model.findOne({
    _id: req.params.id,
    ownerId: req.user._id,
    isActive: true,
  });
  if (!record) throw new ApiError(404, `${resource.label} not found`);
  if (record.paymentStatus === "paid") throw new ApiError(400, "Payment is already complete");
  if (["cancelled", "rejected"].includes(record.status)) {
    throw new ApiError(400, `Cannot pay for a ${record.status} ${resource.label}`);
  }

  const paymentOrder = await razorpay.orders.create({
    amount: Math.round(record[resource.amount] * 100),
    currency: "INR",
    receipt: `${req.params.type}_${record._id}`,
    payment_capture: 1,
    notes: {
      resourceType: req.params.type,
      resourceId: record._id.toString(),
      userId: req.user._id.toString(),
    },
  });

  record.razorpayOrderId = paymentOrder.id;
  await record.save();

  res.status(201).json({
    success: true,
    payment: {
      type: req.params.type,
      resourceId: record._id,
      razorpayOrderId: paymentOrder.id,
      amount: paymentOrder.amount,
      currency: paymentOrder.currency,
      key: process.env.RAZORPAY_KEY_ID,
    },
  });
});

export const verifyServicePayment = asyncHandler(async (req, res) => {
  const {
    type,
    razorpay_order_id: orderId,
    razorpay_payment_id: paymentId,
    razorpay_signature: signature,
  } = req.body;
  if (!orderId || !paymentId || !signature) {
    throw new ApiError(400, "All payment details are required");
  }

  const resource = getResource(type);
  const record = await resource.model.findOne({
    razorpayOrderId: orderId,
    ownerId: req.user._id,
  });
  if (!record) throw new ApiError(404, `${resource.label} payment not found`);
  if (record.paymentStatus === "paid") {
    return res.json({ success: true, message: "Payment already verified", paymentStatus: "paid" });
  }

  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  if (
    Buffer.byteLength(expected) !== Buffer.byteLength(signature) ||
    !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
  ) {
    record.paymentStatus = "failed";
    record.failedAt = new Date();
    await record.save();
    throw new ApiError(400, "Invalid payment signature");
  }

  record.paymentStatus = "paid";
  record.razorpayPaymentId = paymentId;
  record.paidAt = new Date();
  await record.save();
  await Notification.create({
    userId: record.ownerId,
    title: "Payment Successful",
    message: `Your ${resource.label} payment was successful.`,
    type: "Payment",
    referenceId: record._id,
    referenceModel: resource.referenceModel,
  });

  res.json({
    success: true,
    message: "Payment verified successfully",
    payment: { type, resourceId: record._id, paymentStatus: record.paymentStatus, paidAt: record.paidAt },
  });
});

export const getServicePaymentHistory = asyncHandler(async (req, res) => {
  const [appointments, groomingBookings] = await Promise.all([
    Appointment.find({
      ownerId: req.user._id,
      paymentStatus: { $in: ["paid", "failed", "refunded"] },
    }).select("consultationFee paymentStatus razorpayPaymentId paidAt failedAt createdAt"),
    GroomingBooking.find({
      ownerId: req.user._id,
      paymentStatus: { $in: ["paid", "failed", "refunded"] },
    }).select("price paymentStatus razorpayPaymentId paidAt failedAt createdAt"),
  ]);

  const payments = [
    ...appointments.map((item) => ({ type: "appointment", ...item.toObject() })),
    ...groomingBookings.map((item) => ({ type: "grooming", ...item.toObject() })),
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.json({ success: true, payments });
});
