import mongoose from "mongoose";
import Category from "../models/Category.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";

export const createCategory = asyncHandler(async (req, res) => {
  const { categoryName, description } = req.body || {};

  if (!categoryName?.trim()) {
    throw new ApiError(400, "Category name is required");
  }

  const existingCategory = await Category.findOne({
    categoryName: {
      $regex: `^${categoryName.trim()}$`,
      $options: "i",
    },
    isActive: true,
  });

  if (existingCategory) {
    throw new ApiError(409, "Category already exists");
  }

  const category = await Category.create({
    categoryName: categoryName.trim(),
    description: description?.trim() || "",
  });

  res.status(201).json({
    success: true,
    message: "Category created successfully",
    category,
  });
});