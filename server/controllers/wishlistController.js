import mongoose from "mongoose";
import Wishlist from "../models/Wishlist.js";
import Product from "../models/Product.js";
import Cart from "../models/Cart.js";
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
    isDeleted: false,
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

  await wishlistItem.populate({
    path: "productId",
    select:
      "productName price discountPrice images stock brand averageRating totalReviews petType",
  });

  res.status(201).json({
    success: true,
    message: "Product added to wishlist successfully",
    wishlistItem,
  });
});

export const getMyWishlist = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(
    Math.max(Number(req.query.limit) || 10, 1),
    50
  );

  const skip = (page - 1) * limit;
  const sortType = req.query.sort || "latest";

  const matchStage = {
    userId: new mongoose.Types.ObjectId(userId),
  };

  let sortStage = {
    createdAt: -1,
  };

  if (sortType === "oldest") {
    sortStage = {
      createdAt: 1,
    };
  }

  const pipeline = [
    {
      $match: matchStage,
    },

    {
      $lookup: {
        from: "products",
        localField: "productId",
        foreignField: "_id",
        as: "product",
      },
    },

    {
      $unwind: "$product",
    },

    {
      $match: {
        "product.isActive": true,
        "product.isDeleted": {
          $ne: true,
        },
      },
    },
  ];

  if (sortType === "price-low") {
    pipeline.push({
      $sort: {
        "product.discountPrice": 1,
        "product.price": 1,
      },
    });
  } else if (sortType === "price-high") {
    pipeline.push({
      $sort: {
        "product.discountPrice": -1,
        "product.price": -1,
      },
    });
  } else if (sortType === "rating") {
    pipeline.push({
      $sort: {
        "product.averageRating": -1,
        createdAt: -1,
      },
    });
  } else {
    pipeline.push({
      $sort: sortStage,
    });
  }

  pipeline.push(
    {
      $facet: {
        items: [
          {
            $skip: skip,
          },
          {
            $limit: limit,
          },
          {
            $project: {
              _id: 1,
              createdAt: 1,
              updatedAt: 1,

              product: {
                _id: "$product._id",
                productName: "$product.productName",
                description: "$product.description",
                price: "$product.price",
                discountPrice: "$product.discountPrice",
                images: "$product.images",
                stock: "$product.stock",
                brand: "$product.brand",
                averageRating: "$product.averageRating",
                totalReviews: "$product.totalReviews",
                isActive: "$product.isActive",
              },
            },
          },
        ],

        totalCount: [
          {
            $count: "count",
          },
        ],
      },
    }
  );

  const result = await Wishlist.aggregate(pipeline);

  const wishlistItems = result[0]?.items || [];
  const totalItems = result[0]?.totalCount[0]?.count || 0;
  const totalPages = Math.ceil(totalItems / limit);

  res.status(200).json({
    success: true,
    message: "Wishlist fetched successfully",
    wishlistItems,
    pagination: {
      currentPage: page,
      totalPages,
      totalItems,
      limit,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  });
});


export const removeFromWishlist = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { productId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    throw new ApiError(400, "Invalid product ID");
  }

  const wishlistItem = await Wishlist.findOneAndDelete({
    userId,
    productId,
  });

  if (!wishlistItem) {
    throw new ApiError(
      404,
      "Product not found in your wishlist"
    );
  }

  res.status(200).json({
    success: true,
    message: "Product removed from wishlist successfully",
  });
});


export const clearWishlist = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const result = await Wishlist.deleteMany({
    userId,
  });

  res.status(200).json({
    success: true,
    message:
      result.deletedCount > 0
        ? "Wishlist cleared successfully"
        : "Wishlist is already empty",
    deletedItems: result.deletedCount,
  });
});
export const moveWishlistToCart = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { productId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    throw new ApiError(400, "Invalid product ID");
  }

  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      // Check wishlist item
      const wishlistItem = await Wishlist.findOne({
        userId,
        productId,
      }).session(session);

      if (!wishlistItem) {
        throw new ApiError(404, "Product not found in wishlist");
      }

      // Check product
      const product = await Product.findOne({
        _id: productId,
        isActive: true,
        isDeleted: false,
      }).session(session);

      if (!product) {
        throw new ApiError(404, "Product not found");
      }

      if (product.stock <= 0) {
        throw new ApiError(400, "Product is out of stock");
      }

      // Find the user's single cart document
      let cart = await Cart.findOne({ userId }).session(session);

      if (!cart) {
        cart = new Cart({
          userId,
          items: [],
          totalItems: 0,
          totalAmount: 0,
        });
      }

      // Check whether the product already exists in the items array
      const existingItem = cart.items.find(
        (item) => item.productId.toString() === productId
      );

      if (existingItem) {
        // Do not increase quantity beyond available stock
        if (existingItem.quantity >= product.stock) {
          throw new ApiError(
            400,
            `Only ${product.stock} item(s) available in stock`
          );
        }

        existingItem.quantity += 1;
        existingItem.totalPrice =
          existingItem.quantity * existingItem.price;
      } else {
        const price = product.discountPrice ?? product.price;

        cart.items.push({
          productId: product._id,
          quantity: 1,
          price,
          totalPrice: price,
        });
      }

      // Recalculate cart totals
      cart.totalItems = cart.items.reduce(
        (total, item) => total + item.quantity,
        0
      );

      cart.totalAmount = cart.items.reduce(
        (total, item) => total + item.totalPrice,
        0
      );

      await cart.save({ session });

      // Remove product from wishlist
      await Wishlist.deleteOne(
        {
          _id: wishlistItem._id,
        },
        { session }
      );
    });

    res.status(200).json({
      success: true,
      message: "Product moved to cart successfully",
    });
  } finally {
    await session.endSession();
  }
});