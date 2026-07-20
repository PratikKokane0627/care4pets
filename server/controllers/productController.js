import mongoose from "mongoose";
import Product from "../models/Product.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import cloudinary from "../config/cloudinary.js";
import uploadToCloudinary from "../utils/uploadToCloudinary.js";
import Category from "../models/Category.js";

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

export const getAllProducts = asyncHandler(async (req, res) => {
  const {
    search,
    categoryId,
    petType,
    minPrice,
    maxPrice,
    isFeatured,
    inStock,
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

  // Search
  if (search?.trim()) {
    const searchText = search.trim();

    query.$or = [
      {
        productName: {
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
      {
        brand: {
          $regex: searchText,
          $options: "i",
        },
      },
      {
        sku: {
          $regex: searchText,
          $options: "i",
        },
      },
    ];
  }

  // Category filter
  if (categoryId) {
    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      throw new ApiError(400, "Invalid category ID");
    }

    query.categoryId = categoryId;
  }

  // Pet type filter
  const allowedPetTypes = [
    "dog",
    "cat",
    "bird",
    "fish",
    "rabbit",
    "other",
    "all",
  ];

  if (petType) {
    const normalizedPetType = petType.trim().toLowerCase();

    if (!allowedPetTypes.includes(normalizedPetType)) {
      throw new ApiError(400, "Invalid pet type");
    }

    query.petType = normalizedPetType;
  }

  // Price filters
  if (minPrice !== undefined || maxPrice !== undefined) {
    query.price = {};

    if (minPrice !== undefined) {
      const minimumPrice = Number(minPrice);

      if (Number.isNaN(minimumPrice) || minimumPrice < 0) {
        throw new ApiError(400, "Invalid minimum price");
      }

      query.price.$gte = minimumPrice;
    }

    if (maxPrice !== undefined) {
      const maximumPrice = Number(maxPrice);

      if (Number.isNaN(maximumPrice) || maximumPrice < 0) {
        throw new ApiError(400, "Invalid maximum price");
      }

      query.price.$lte = maximumPrice;
    }

    if (
      query.price.$gte !== undefined &&
      query.price.$lte !== undefined &&
      query.price.$gte > query.price.$lte
    ) {
      throw new ApiError(
        400,
        "Minimum price cannot be greater than maximum price"
      );
    }
  }

  // Featured filter
  if (isFeatured !== undefined) {
    if (!["true", "false"].includes(isFeatured)) {
      throw new ApiError(
        400,
        "isFeatured must be true or false"
      );
    }

    query.isFeatured = isFeatured === "true";
  }

  // Stock filter
  if (inStock !== undefined) {
    if (!["true", "false"].includes(inStock)) {
      throw new ApiError(
        400,
        "inStock must be true or false"
      );
    }

    if (inStock === "true") {
      query.stock = { $gt: 0 };
    } else {
      query.stock = 0;
    }
  }

  // Sorting
  const allowedSortFields = [
    "productName",
    "price",
    "stock",
    "averageRating",
    "createdAt",
    "updatedAt",
  ];

  const selectedSortField = allowedSortFields.includes(sortBy)
    ? sortBy
    : "createdAt";

  const sortOrder = order === "asc" ? 1 : -1;

  const skip = (pageNumber - 1) * limitNumber;

  const [products, totalProducts] = await Promise.all([
    Product.find(query)
      .populate("categoryId", "categoryName image")
      .sort({
        [selectedSortField]: sortOrder,
      })
      .skip(skip)
      .limit(limitNumber),

    Product.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    message: "Products fetched successfully",
    pagination: {
      currentPage: pageNumber,
      totalPages: Math.ceil(totalProducts / limitNumber),
      totalProducts,
      limit: limitNumber,
      hasNextPage:
        pageNumber < Math.ceil(totalProducts / limitNumber),
      hasPreviousPage: pageNumber > 1,
    },
    products,
  });
});

export const getProductById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid product ID");
  }

  const product = await Product.findOne({
    _id: id,
    isActive: true,
  })
    .populate("categoryId", "categoryName description image")
    .populate("createdBy", "name email");

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  res.status(200).json({
    success: true,
    message: "Product fetched successfully",
    product,
  });
});

export const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid product ID");
  }

  const product = await Product.findOne({
    _id: id,
    isActive: true,
  });

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

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

  // Product Name
  if (productName !== undefined) {
    if (!productName.trim()) {
      throw new ApiError(400, "Product name cannot be empty");
    }

    const existingProduct = await Product.findOne({
      _id: { $ne: id },
      productName: {
        $regex: `^${productName.trim()}$`,
        $options: "i",
      },
      categoryId: categoryId || product.categoryId,
      isActive: true,
    });

    if (existingProduct) {
      throw new ApiError(
        409,
        "Product already exists in this category"
      );
    }

    product.productName = productName.trim();
  }

  // Description
  if (description !== undefined) {
    product.description = description.trim();
  }

  // Category
  if (categoryId !== undefined) {
    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      throw new ApiError(400, "Invalid category ID");
    }

    const category = await Category.findOne({
      _id: categoryId,
      isActive: true,
    });

    if (!category) {
      throw new ApiError(404, "Category not found");
    }

    product.categoryId = categoryId;
  }

  // Brand
  if (brand !== undefined) {
    product.brand = brand.trim();
  }

  // Price
  if (price !== undefined) {
    if (price < 0) {
      throw new ApiError(400, "Price cannot be negative");
    }

    product.price = price;
  }

  // Discount Price
  if (discountPrice !== undefined) {
    if (discountPrice !== null && discountPrice >= product.price) {
      throw new ApiError(
        400,
        "Discount price must be less than price"
      );
    }

    product.discountPrice = discountPrice;
  }

  // Stock
  if (stock !== undefined) {
    if (stock < 0) {
      throw new ApiError(400, "Stock cannot be negative");
    }

    product.stock = stock;
  }

  // SKU
  if (sku !== undefined) {
    const existingSku = await Product.findOne({
      _id: { $ne: id },
      sku: sku.trim().toUpperCase(),
    });

    if (existingSku) {
      throw new ApiError(409, "SKU already exists");
    }

    product.sku = sku.trim().toUpperCase();
  }

  // Pet Type
  if (petType !== undefined) {
    product.petType = petType;
  }

  // Featured
  if (isFeatured !== undefined) {
    product.isFeatured = isFeatured;
  }

  await product.save();

  const updatedProduct = await Product.findById(product._id)
    .populate("categoryId", "categoryName")
    .populate("createdBy", "name email");

  res.status(200).json({
    success: true,
    message: "Product updated successfully",
    product: updatedProduct,
  });
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid product ID");
  }

  const product = await Product.findOne({
    _id: id,
    isActive: true,
  });

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

 product.isActive = false;
product.deletedAt = new Date();
product.deletedBy = req.user._id;

await product.save();

  res.status(200).json({
    success: true,
    message: "Product deleted successfully",
  });
});

export const uploadProductImages = asyncHandler(
  async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError(400, "Invalid product ID");
    }

    const product = await Product.findOne({
      _id: id,
      isActive: true,
    });

    if (!product) {
      throw new ApiError(404, "Product not found");
    }

    if (!req.files || req.files.length === 0) {
      throw new ApiError(
        400,
        "Please select at least one image"
      );
    }

    const existingImageCount = product.images?.length || 0;
    const maximumImages = 5;

    if (
      existingImageCount + req.files.length >
      maximumImages
    ) {
      throw new ApiError(
        400,
        `A product can have a maximum of ${maximumImages} images`
      );
    }

    const uploadedImages = [];

    try {
      for (const file of req.files) {
        const result = await uploadToCloudinary(
          file.buffer,
          "care4pets/products"
        );

        uploadedImages.push({
          url: result.secure_url,
          publicId: result.public_id,
        });
      }

      product.images.push(...uploadedImages);

      await product.save();
    } catch (error) {
      await Promise.allSettled(
        uploadedImages.map((image) =>
          deleteFromCloudinary(image.publicId)
        )
      );

      throw new ApiError(
        500,
        error.message || "Product image upload failed"
      );
    }

    res.status(200).json({
      success: true,
      message: "Product images uploaded successfully",
      images: product.images,
    });
  }
);