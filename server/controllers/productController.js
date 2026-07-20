import mongoose from "mongoose";
import Product from "../models/Product.js";
import Category from "../models/Category.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import cloudinary from "../config/cloudinary.js";
import uploadToCloudinary from "../utils/uploadToCloudinary.js";

export const createProduct = asyncHandler(async (req, res) => {
  const {
    productName,
    description,
    categoryId,
    brand,
    price,
    discountPrice,
    stock,
    sku,
    petType,
    isFeatured,
  } = req.body || {};

  // Validation
  if (
    !productName ||
    !description ||
    !categoryId ||
    price === undefined ||
    stock === undefined ||
    !sku
  ) {
    throw new ApiError(400, "Please provide all required fields");
  }

  // Validate category id
  if (!mongoose.Types.ObjectId.isValid(categoryId)) {
    throw new ApiError(400, "Invalid category ID");
  }

  // Check category
  const category = await Category.findOne({
    _id: categoryId,
    isActive: true,
  });

  if (!category) {
    throw new ApiError(404, "Category not found");
  }

  // Duplicate SKU
  const existingSku = await Product.findOne({
    sku: sku.trim().toUpperCase(),
  });

  if (existingSku) {
    throw new ApiError(409, "SKU already exists");
  }

  // Duplicate product name
  const existingProduct = await Product.findOne({
    productName: {
      $regex: `^${productName.trim()}$`,
      $options: "i",
    },
    categoryId,
    isActive: true,
  });

  if (existingProduct) {
    throw new ApiError(
      409,
      "Product already exists in this category"
    );
  }

  const product = await Product.create({
    productName: productName.trim(),
    description: description.trim(),
    categoryId,
    brand: brand?.trim() || "",
    price,
    discountPrice,
    stock,
    sku: sku.trim().toUpperCase(),
    petType,
    isFeatured,
    createdBy: req.user._id,
  });

  const populatedProduct = await Product.findById(product._id)
    .populate("categoryId", "categoryName")
    .populate("createdBy", "name email");

  res.status(201).json({
    success: true,
    message: "Product created successfully",
    product: populatedProduct,
  });
});