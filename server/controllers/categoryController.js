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

export const getAllCategories = asyncHandler(async (req, res) => {
  const {
    search,
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    order = "desc",
  } = req.query;

  const pageNumber = Math.max(Number(page) || 1, 1);
  const limitNumber = Math.min(
    Math.max(Number(limit) || 10, 1),
    100
  );

  const query = {
    isActive: true,
  };

  if (search?.trim()) {
    const searchText = search.trim();

    query.$or = [
      {
        categoryName: {
          $regex: searchText,
          $options: "i",
        },
      },
      {
        description: {
          $regex: searchText,
          $options: "i",
        },
      },
    ];
  }

  const allowedSortFields = [
    "categoryName",
    "createdAt",
    "updatedAt",
  ];

  const selectedSortField = allowedSortFields.includes(sortBy)
    ? sortBy
    : "createdAt";

  const sortOrder = order === "asc" ? 1 : -1;

  const skip = (pageNumber - 1) * limitNumber;

  const [categories, totalCategories] = await Promise.all([
    Category.find(query)
      .sort({
        [selectedSortField]: sortOrder,
      })
      .skip(skip)
      .limit(limitNumber),

    Category.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    message: "Categories fetched successfully",
    pagination: {
      currentPage: pageNumber,
      totalPages: Math.ceil(totalCategories / limitNumber),
      totalCategories,
      limit: limitNumber,
    },
    categories,
  });
});


export const getCategoryById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid category ID");
  }

  const category = await Category.findOne({
    _id: id,
    isActive: true,
  });

  if (!category) {
    throw new ApiError(404, "Category not found");
  }

  res.status(200).json({
    success: true,
    message: "Category fetched successfully",
    category,
  });
});