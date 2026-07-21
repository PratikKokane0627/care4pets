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
export const getUserCart = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const cart = await Cart.findOne({ userId }).populate({
    path: "items.productId",
    select:
      "productName images price discountPrice stock brand isActive",
  });

  if (!cart) {
    return res.status(200).json({
      success: true,
      message: "Cart is empty",
      cart: {
        userId,
        items: [],
        totalItems: 0,
        totalAmount: 0,
      },
    });
  }

  // Remove inactive or deleted products
  const availableItems = cart.items.filter(
    (item) => item.productId && item.productId.isActive
  );

  // Add here
  const totalItems = availableItems.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const totalAmount = availableItems.reduce(
    (sum, item) => sum + item.totalPrice,
    0
  );

  // Then return recalculated values here
  res.status(200).json({
    success: true,
    message:
      availableItems.length > 0
        ? "Cart fetched successfully"
        : "Cart is empty",
    cart: {
      _id: cart._id,
      userId: cart.userId,
      items: availableItems,
      totalItems,
      totalAmount,
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt,
    },
  });
});


export const updateCartItemQuantity = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { quantity } = req.body;
  const userId = req.user._id;

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    throw new ApiError(400, "Invalid product ID");
  }

  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new ApiError(400, "Quantity must be at least 1");
  }

  const cart = await Cart.findOne({ userId });

  if (!cart) {
    throw new ApiError(404, "Cart not found");
  }

  const item = cart.items.find(
    (item) => item.productId.toString() === productId
  );

  if (!item) {
    throw new ApiError(404, "Product not found in cart");
  }

  const product = await Product.findOne({
    _id: productId,
    isActive: true,
  });

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  if (quantity > product.stock) {
    throw new ApiError(400, "Requested quantity exceeds available stock");
  }

  item.quantity = quantity;
  item.price = product.discountPrice || product.price;
  item.totalPrice = item.quantity * item.price;

  cart.totalItems = cart.items.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  cart.totalAmount = cart.items.reduce(
    (sum, item) => sum + item.totalPrice,
    0
  );

  await cart.save();

  await cart.populate({
    path: "items.productId",
    select: "productName images price discountPrice stock brand",
  });

  res.status(200).json({
    success: true,
    message: "Cart updated successfully",
    cart,
  });
});