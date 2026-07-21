import mongoose from "mongoose";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";

export const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity = 1 } = req.body;
  const userId = req.user._id;

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    throw new ApiError(400, "Invalid product ID");
  }

  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new ApiError(400, "Quantity must be at least 1");
  }

  const product = await Product.findOne({
    _id: productId,
    isActive: true,
  });

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  if (product.stock < quantity) {
    throw new ApiError(400, "Insufficient stock");
  }

  let cart = await Cart.findOne({ userId });

  if (!cart) {
    cart = new Cart({
      userId,
      items: [],
    });
  }

  const existingItem = cart.items.find(
    (item) => item.productId.toString() === productId
  );

  if (existingItem) {
    const newQuantity = existingItem.quantity + quantity;

    if (newQuantity > product.stock) {
      throw new ApiError(400, "Requested quantity exceeds stock");
    }

    existingItem.quantity = newQuantity;
    existingItem.price = product.discountPrice || product.price;
    existingItem.totalPrice =
      existingItem.quantity * existingItem.price;
  } else {
    cart.items.push({
      productId,
      quantity,
      price: product.discountPrice || product.price,
      totalPrice:
        quantity * (product.discountPrice || product.price),
    });
  }

  cart.totalItems = cart.items.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  cart.totalAmount = cart.items.reduce(
    (sum, item) => sum + item.totalPrice,
    0
  );

  await cart.save();

  res.status(200).json({
    success: true,
    message: "Product added to cart successfully",
    cart,
  });
});