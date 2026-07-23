import mongoose from "mongoose";
import Wishlist from "../models/Wishlist.js";
import Product from "../models/Product.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";


export const addToWishlist = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { productId } = req.body;

  if (!productId) {
    throw new ApiError(400, "Product ID is required");
  }

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    throw new ApiError(400, "Invalid product ID");
  }

  const product = await Product.findOne({
    _id: productId,
    isActive: true,
    isDeleted: {
      $ne: true,
    },
  });

  if (!product) {
    throw new ApiError(
      404,
      "Product not found or currently unavailable"
    );
  }

  const existingWishlistItem = await Wishlist.findOne({
    userId,
    productId,
  });

  if (existingWishlistItem) {
    throw new ApiError(
      409,
      "Product is already in your wishlist"
    );
  }

  let wishlistItem;

  try {
    wishlistItem = await Wishlist.create({
      userId,
      productId,
    });
  } catch (error) {
    if (error.code === 11000) {
      throw new ApiError(
        409,
        "Product is already in your wishlist"
      );
    }

    throw error;
  }

  await wishlistItem.populate(
    "productId",
    "productName price discountPrice images stock brand averageRating totalReviews"
  );

  res.status(201).json({
    success: true,
    message: "Product added to wishlist successfully",
    wishlistItem,
  });
});

