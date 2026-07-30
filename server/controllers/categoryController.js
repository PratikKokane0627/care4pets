import mongoose from "mongoose";
import Category from "../models/Category.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import deleteUploadedImage from "../utils/deleteUploadedImage.js";
import uploadToCloudinary from "../utils/uploadToCloudinary.js";

const escapeRegex = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const createCategory = asyncHandler(async (req, res) => {
  const { categoryName, description } = req.body || {};

  if (!categoryName?.trim()) {
    throw new ApiError(400, "Category name is required");
  }

  const normalizedName = categoryName.trim();
  const existingCategory = await Category.findOne({
    categoryName: {
      $regex: `^${escapeRegex(normalizedName)}$`,
      $options: "i",
    },
  });

  if (existingCategory?.isActive) {
    throw new ApiError(409, "Category already exists");
  }

  const category = existingCategory || new Category();
  category.categoryName = normalizedName;
  category.description = description?.trim() || "";
  category.isActive = true;

  await category.save();

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

export const updateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { categoryName, description } = req.body || {};

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

  if (categoryName !== undefined) {
    if (!categoryName.trim()) {
      throw new ApiError(400, "Category name cannot be empty");
    }

    const normalizedName = categoryName.trim();
    const duplicateCategory = await Category.findOne({
      _id: { $ne: id },
      categoryName: {
        $regex: `^${escapeRegex(normalizedName)}$`,
        $options: "i",
      },
    });

    if (duplicateCategory?.isActive) {
      throw new ApiError(409, "Category already exists");
    }

    if (duplicateCategory) {
      await Category.deleteOne({ _id: duplicateCategory._id, isActive: false });
    }

    category.categoryName = normalizedName;
  }

  if (description !== undefined) {
    category.description = description.trim();
  }

  await category.save();

  res.status(200).json({
    success: true,
    message: "Category updated successfully",
    category,
  });
});


export const deleteCategory = asyncHandler(async (req, res) => {
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

  category.isActive = false;

  await category.save();

  res.status(200).json({
    success: true,
    message: "Category deleted successfully",
  });
});


export const uploadCategoryImage = asyncHandler(async (req, res) => {
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

  if (!req.file) {
    throw new ApiError(400, "Image is required");
  }

  // Upload image to Cloudinary
  const uploadedImage = await uploadToCloudinary(
    req.file.buffer,
    "care4pets/categories",
    req.file.mimetype
  );

  // Delete old image if it exists
  if (category.image?.publicId) {
    await deleteUploadedImage(category.image.publicId);
  }

  category.image = {
    url: uploadedImage.secure_url,
    publicId: uploadedImage.public_id,
  };

  await category.save();

  res.status(200).json({
    success: true,
    message: "Category image uploaded successfully",
    image: category.image,
  });
});

export const deleteCategoryImage = asyncHandler(async (req, res) => {
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

  if (category.image?.publicId) {
    await deleteUploadedImage(category.image.publicId);
  }

  category.image = {
    url: "",
    publicId: "",
  };

  await category.save();

  res.status(200).json({
    success: true,
    message: "Category image deleted successfully",
    image: category.image,
  });
});
