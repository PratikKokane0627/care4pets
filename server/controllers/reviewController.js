import mongoose from "mongoose";
import Review from "../models/Review.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";

const updateProductRating = async (productId, session = null) => {
  const aggregateOptions = session ? { session } : {};

  const result = await Review.aggregate(
    [
      {
        $match: {
          productId: new mongoose.Types.ObjectId(productId),
          isActive: true,
        },
      },
      {
        $group: {
          _id: "$productId",
          averageRating: {
            $avg: "$rating",
          },
          totalReviews: {
            $sum: 1,
          },
        },
      },
    ],
    aggregateOptions
  );

  const averageRating =
    result.length > 0
      ? Number(result[0].averageRating.toFixed(1))
      : 0;

  const totalReviews =
    result.length > 0 ? result[0].totalReviews : 0;

  await Product.findByIdAndUpdate(
    productId,
    {
      averageRating,
      totalReviews,
    },
    {
      session,
      runValidators: true,
    }
  );
};

export const addReview = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const {
    productId,
    orderId,
    rating,
    comment,
  } = req.body;

  if (!productId || !orderId || rating === undefined || !comment?.trim()) {
    throw new ApiError(
      400,
      "Product ID, order ID, rating and comment are required"
    );
  }

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    throw new ApiError(400, "Invalid product ID");
  }

  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    throw new ApiError(400, "Invalid order ID");
  }

  const numericRating = Number(rating);

  if (
    !Number.isInteger(numericRating) ||
    numericRating < 1 ||
    numericRating > 5
  ) {
    throw new ApiError(
      400,
      "Rating must be an integer between 1 and 5"
    );
  }

  const trimmedComment = comment.trim();

  if (trimmedComment.length < 3) {
    throw new ApiError(
      400,
      "Comment must contain at least 3 characters"
    );
  }

  if (trimmedComment.length > 1000) {
    throw new ApiError(
      400,
      "Comment cannot exceed 1000 characters"
    );
  }

  const product = await Product.findOne({
    _id: productId,
    isActive: true,
    isDeleted: {
      $ne: true,
    },
  });

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  const order = await Order.findOne({
    _id: orderId,
    userId,
  });

  if (!order) {
    throw new ApiError(
      404,
      "Order not found or does not belong to you"
    );
  }

  if (order.orderStatus !== "Delivered") {
    throw new ApiError(
      400,
      "You can review a product only after the order is delivered"
    );
  }

  const purchasedItem = order.items.find(
    (item) =>
      item.productId.toString() === productId.toString()
  );

  if (!purchasedItem) {
    throw new ApiError(
      400,
      "This product was not purchased in the selected order"
    );
  }

  const existingReview = await Review.findOne({
  userId,
  productId,
});

if (existingReview?.isActive) {
  throw new ApiError(
    409,
    "You have already reviewed this product"
  );
}

  const session = await mongoose.startSession();

  let createdReview;

  try {
   await session.withTransaction(async () => {
  if (existingReview && !existingReview.isActive) {
    existingReview.orderId = orderId;
    existingReview.rating = numericRating;
    existingReview.comment = trimmedComment;
    existingReview.isVerifiedPurchase = true;
    existingReview.isActive = true;

    await existingReview.save({ session });

    createdReview = existingReview;
  } else {
    const reviews = await Review.create(
      [
        {
          userId,
          productId,
          orderId,
          rating: numericRating,
          comment: trimmedComment,
          isVerifiedPurchase: true,
          isActive: true,
        },
      ],
      {
        session,
      }
    );

    createdReview = reviews[0];
  }

  await updateProductRating(
    productId,
    session
  );
});
  } finally {
    await session.endSession();
  }

  await createdReview.populate(
    "userId",
    "name profileImage"
  );

  res.status(201).json({
    success: true,
    message: "Review added successfully",
    review: createdReview,
  });
});

export const getProductReviews = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const {
    page = 1,
    limit = 10,
    sort = "latest",
  } = req.query;

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    throw new ApiError(400, "Invalid product ID");
  }

  const product = await Product.findById(productId)
    .select(
      "productName averageRating totalReviews isActive"
    );

  if (!product || !product.isActive) {
    throw new ApiError(404, "Product not found");
  }

  const pageNumber = Math.max(
    parseInt(page) || 1,
    1
  );

  const pageLimit = Math.min(
    Math.max(parseInt(limit) || 10, 1),
    100
  );

  const skip = (pageNumber - 1) * pageLimit;

  let sortOption = {};

  switch (sort) {
    case "highest":
      sortOption = { rating: -1 };
      break;

    case "lowest":
      sortOption = { rating: 1 };
      break;

    case "oldest":
      sortOption = { createdAt: 1 };
      break;

    default:
      sortOption = { createdAt: -1 };
  }

  const [reviews, totalReviews, ratingStats] =
    await Promise.all([
      Review.find({
        productId,
        isActive: true,
      })
        .populate(
          "userId",
          "name profileImage"
        )
        .sort(sortOption)
        .skip(skip)
        .limit(pageLimit),

      Review.countDocuments({
        productId,
        isActive: true,
      }),

      Review.aggregate([
        {
          $match: {
            productId:
              new mongoose.Types.ObjectId(productId),
            isActive: true,
          },
        },
        {
          $group: {
            _id: "$rating",
            count: {
              $sum: 1,
            },
          },
        },
      ]),
    ]);

  const ratingBreakdown = {
    5: 0,
    4: 0,
    3: 0,
    2: 0,
    1: 0,
  };

  ratingStats.forEach((item) => {
    ratingBreakdown[item._id] = item.count;
  });

  res.status(200).json({
    success: true,
    message: "Product reviews fetched successfully",

    product: {
      _id: product._id,
      productName: product.productName,
      averageRating: product.averageRating,
      totalReviews: product.totalReviews,
    },

    ratingBreakdown,

    pagination: {
      currentPage: pageNumber,
      totalPages: Math.ceil(
        totalReviews / pageLimit
      ),
      totalReviews,
      limit: pageLimit,
    },

    reviews,
  });
});


export const updateReview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rating, comment } = req.body;
  const userId = req.user._id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid review ID");
  }

  const numericRating = Number(rating);

  if (
    !Number.isInteger(numericRating) ||
    numericRating < 1 ||
    numericRating > 5
  ) {
    throw new ApiError(
      400,
      "Rating must be an integer between 1 and 5"
    );
  }

  if (!comment?.trim()) {
    throw new ApiError(400, "Comment is required");
  }

  if (comment.trim().length < 3) {
    throw new ApiError(
      400,
      "Comment must contain at least 3 characters"
    );
  }

  if (comment.trim().length > 1000) {
    throw new ApiError(
      400,
      "Comment cannot exceed 1000 characters"
    );
  }

  const session = await mongoose.startSession();

  let updatedReview;

  try {
    await session.withTransaction(async () => {
      const review = await Review.findById(id).session(session);

      if (!review || !review.isActive) {
        throw new ApiError(404, "Review not found");
      }

      if (review.userId.toString() !== userId.toString()) {
        throw new ApiError(
          403,
          "You are not authorized to update this review"
        );
      }

      review.rating = numericRating;
      review.comment = comment.trim();

      await review.save({ session });

      await updateProductRating(review.productId, session);

      updatedReview = review;
    });
  } finally {
    await session.endSession();
  }

  await updatedReview.populate(
    "userId",
    "name profileImage"
  );

  res.status(200).json({
    success: true,
    message: "Review updated successfully",
    review: updatedReview,
  });
});


export const deleteReview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid review ID");
  }

  const session = await mongoose.startSession();

  let deletedReview;

  try {
    await session.withTransaction(async () => {
      const review = await Review.findById(id).session(session);

      if (!review || !review.isActive) {
        throw new ApiError(404, "Review not found");
      }

      if (review.userId.toString() !== userId.toString()) {
        throw new ApiError(
          403,
          "You are not authorized to delete this review"
        );
      }

      review.isActive = false;

      await review.save({ session });

      await updateProductRating(
        review.productId,
        session
      );

      deletedReview = review;
    });
  } finally {
    await session.endSession();
  }

  res.status(200).json({
    success: true,
    message: "Review deleted successfully",
    review: {
      _id: deletedReview._id,
      productId: deletedReview.productId,
      isActive: deletedReview.isActive,
    },
  });
});