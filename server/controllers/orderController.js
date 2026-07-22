import mongoose from "mongoose";
import Order from "../models/Order.js";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";

export const placeOrder = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { shippingAddress, paymentMethod = "COD" } = req.body;

  const {
    fullName,
    phone,
    address,
    city,
    state,
    postalCode,
    country = "India",
  } = shippingAddress || {};

  if (
    !fullName ||
    !phone ||
    !address ||
    !city ||
    !state ||
    !postalCode
  ) {
    throw new ApiError(400, "Complete shipping address is required");
  }

  if (!["COD", "ONLINE"].includes(paymentMethod)) {
    throw new ApiError(400, "Invalid payment method");
  }

  const cart = await Cart.findOne({ userId }).populate({
    path: "items.productId",
    select:
      "productName images price discountPrice stock isActive",
  });

  if (!cart || cart.items.length === 0) {
    throw new ApiError(400, "Cart is empty");
  }

  const orderItems = [];
  let totalItems = 0;
  let subtotal = 0;

  for (const item of cart.items) {
    const product = item.productId;

    if (!product || !product.isActive) {
      throw new ApiError(
        400,
        "One or more products are unavailable"
      );
    }

    if (item.quantity > product.stock) {
      throw new ApiError(
        400,
        `Insufficient stock for ${product.productName}`
      );
    }

    const sellingPrice =
      product.discountPrice ?? product.price;

    const itemTotal = sellingPrice * item.quantity;

    orderItems.push({
      productId: product._id,
      productName: product.productName,
      image: product.images?.[0]?.url || "",
      quantity: item.quantity,
      price: sellingPrice,
      totalPrice: itemTotal,
    });

    totalItems += item.quantity;
    subtotal += itemTotal;
  }

  const shippingCharge = subtotal >= 1000 ? 0 : 50;
  const tax = 0;
  const totalAmount = subtotal + shippingCharge + tax;

  const session = await mongoose.startSession();

  let createdOrder;

  try {
    await session.withTransaction(async () => {
      createdOrder = await Order.create(
        [
          {
            userId,
            items: orderItems,
            shippingAddress: {
              fullName,
              phone,
              address,
              city,
              state,
              postalCode,
              country,
            },
            totalItems,
            subtotal,
            shippingCharge,
            tax,
            totalAmount,
            paymentMethod,
            paymentStatus:
              paymentMethod === "COD" ? "Pending" : "Pending",
            orderStatus: "Pending",
          },
        ],
        { session }
      );

      for (const item of orderItems) {
        const updatedProduct = await Product.findOneAndUpdate(
          {
            _id: item.productId,
            isActive: true,
            stock: { $gte: item.quantity },
          },
          {
            $inc: {
              stock: -item.quantity,
            },
          },
          {
            new: true,
            session,
          }
        );

        if (!updatedProduct) {
          throw new ApiError(
            400,
            `Stock changed for ${item.productName}. Please try again`
          );
        }
      }

      await Cart.updateOne(
        { userId },
        {
          $set: {
            items: [],
            totalItems: 0,
            totalAmount: 0,
          },
        },
        { session }
      );
    });
  } finally {
    await session.endSession();
  }

  const order = await Order.findById(
    createdOrder[0]._id
  ).populate("userId", "name email");

  res.status(201).json({
    success: true,
    message: "Order placed successfully",
    order,
  });
});