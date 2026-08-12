import mongoose from "mongoose";
import Review from "../models/Review.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import User from "../models/User.js";
import Appointment from "../models/Appointment.js";
import GroomingBooking from "../models/GroomingBooking.js";
import VetProfile from "../models/VetProfile.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";

const updateProductRating = async (productId, session = null) => {
  const aggregateOptions = session ? { session } : {};

  const result = await Review.aggregate(
    [
      {
        $match: {
          reviewType: "product",
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

const updateVetRating = async (vetId, session = null) => {
  const aggregateOptions = session ? { session } : {};

  const result = await Review.aggregate(
    [
      {
        $match: {
          reviewType: "vet",
          vetId: new mongoose.Types.ObjectId(vetId),
          isActive: true,
        },
      },
      {
        $group: {
          _id: "$vetId",
          averageRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
        },
      },
    ],
    aggregateOptions
  );

  const averageRating =
    result.length > 0 ? Number(result[0].averageRating.toFixed(1)) : 0;

  const totalReviews = result.length > 0 ? result[0].totalReviews : 0;

  await VetProfile.findByIdAndUpdate(
    vetId,
    { averageRating, totalReviews },
    { session, runValidators: true }
  );
};

const parseRating = (value, label = "Rating") => {
  const numericRating = Number(value);

  if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
    throw new ApiError(400, `${label} must be an integer between 1 and 5`);
  }

  return numericRating;
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
    reviewType: "product",
    productId,
  });

  if (existingReview?.isActive) {
    throw new ApiError(
      409,
      "You have already reviewed this product"
    );
  }

  let createdReview;

  if (existingReview && !existingReview.isActive) {
    existingReview.orderId = orderId;
    existingReview.rating = numericRating;
    existingReview.comment = trimmedComment;
    existingReview.isVerifiedPurchase = true;
    existingReview.isActive = true;
    existingReview.deletedBy = null;
    existingReview.deletedAt = null;

    await existingReview.save();

    createdReview = existingReview;
  } else {
    createdReview = await Review.create({
      userId,
      reviewType: "product",
      productId,
      orderId,
      rating: numericRating,
      comment: trimmedComment,
      isVerifiedPurchase: true,
      isActive: true,
    });
  }

  await updateProductRating(productId);

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

export const addVetReview = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { vetId, appointmentId, rating, comment } = req.body;

  if (!vetId || !appointmentId || rating === undefined || !comment?.trim()) {
    throw new ApiError(
      400,
      "Veterinarian, appointment, rating and comment are required"
    );
  }

  if (!mongoose.Types.ObjectId.isValid(vetId)) {
    throw new ApiError(400, "Invalid veterinarian ID");
  }

  if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
    throw new ApiError(400, "Invalid appointment ID");
  }

  const numericRating = Number(rating);

  if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
    throw new ApiError(400, "Rating must be an integer between 1 and 5");
  }

  const trimmedComment = comment.trim();

  if (trimmedComment.length < 3) {
    throw new ApiError(400, "Comment must contain at least 3 characters");
  }

  if (trimmedComment.length > 1000) {
    throw new ApiError(400, "Comment cannot exceed 1000 characters");
  }

  const vet = await VetProfile.findOne({
    _id: vetId,
    status: "approved",
    isActive: true,
  }).populate({
    path: "userId",
    match: { role: "vet", status: "active" },
  });

  if (!vet || !vet.userId) {
    throw new ApiError(404, "Veterinarian not found");
  }

  const appointment = await Appointment.findOne({
    _id: appointmentId,
    ownerId: userId,
    vetId,
    status: "completed",
    isActive: true,
  });

  if (!appointment) {
    throw new ApiError(
      400,
      "You can review a veterinarian only after a completed appointment"
    );
  }

  const existingReview = await Review.findOne({
    userId,
    reviewType: "vet",
    vetId,
  });

  if (existingReview?.isActive) {
    throw new ApiError(409, "You have already reviewed this veterinarian");
  }

  let createdReview;

  if (existingReview && !existingReview.isActive) {
    existingReview.appointmentId = appointmentId;
    existingReview.rating = numericRating;
    existingReview.comment = trimmedComment;
    existingReview.isVerifiedPurchase = true;
    existingReview.isActive = true;
    existingReview.deletedBy = null;
    existingReview.deletedAt = null;

    await existingReview.save();
    createdReview = existingReview;
  } else {
    createdReview = await Review.create({
      userId,
      reviewType: "vet",
      vetId,
      appointmentId,
      rating: numericRating,
      comment: trimmedComment,
      isVerifiedPurchase: true,
      isActive: true,
    });
  }

  await updateVetRating(vetId);

  await createdReview.populate("userId", "name profileImage");
  await createdReview.populate("appointmentId", "_id appointmentDate appointmentTime");

  res.status(201).json({
    success: true,
    message: "Veterinarian review added successfully",
    review: createdReview,
  });
});

export const getVetReviewsById = asyncHandler(async (req, res) => {
  const { vetId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(vetId)) {
    throw new ApiError(400, "Invalid veterinarian ID");
  }

  const vet = await VetProfile.findOne({
    _id: vetId,
    status: "approved",
    isActive: true,
  }).select("averageRating totalReviews");

  if (!vet) {
    throw new ApiError(404, "Veterinarian not found");
  }

  const [reviews, ratingStats] = await Promise.all([
    Review.find({
      reviewType: "vet",
      vetId,
      isActive: true,
    })
      .populate("userId", "name profileImage")
      .populate("appointmentId", "_id appointmentDate appointmentTime")
      .sort({ createdAt: -1 }),
    Review.aggregate([
      {
        $match: {
          reviewType: "vet",
          vetId: new mongoose.Types.ObjectId(vetId),
          isActive: true,
        },
      },
      { $group: { _id: "$rating", count: { $sum: 1 } } },
    ]),
  ]);

  const ratingBreakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  ratingStats.forEach((item) => {
    ratingBreakdown[item._id] = item.count;
  });

  res.status(200).json({
    success: true,
    message: "Veterinarian reviews fetched successfully",
    vet: {
      _id: vet._id,
      averageRating: vet.averageRating,
      totalReviews: vet.totalReviews,
    },
    ratingBreakdown,
    reviews,
  });
});

export const addGroomerReview = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { groomerId, groomingBookingId, rating, serviceRating, groomerRating, comment } = req.body;

  if (!groomerId || !groomingBookingId || !comment?.trim()) {
    throw new ApiError(400, "Groomer, booking, ratings and comment are required");
  }

  if (!mongoose.Types.ObjectId.isValid(groomerId)) {
    throw new ApiError(400, "Invalid groomer ID");
  }

  if (!mongoose.Types.ObjectId.isValid(groomingBookingId)) {
    throw new ApiError(400, "Invalid grooming booking ID");
  }

  const numericServiceRating = parseRating(
    serviceRating ?? rating,
    "Service rating"
  );
  const numericGroomerRating = parseRating(
    groomerRating ?? rating,
    "Groomer rating"
  );
  const numericRating =
    rating === undefined
      ? Math.round((numericServiceRating + numericGroomerRating) / 2)
      : parseRating(rating);

  const trimmedComment = comment.trim();

  if (trimmedComment.length < 3) {
    throw new ApiError(400, "Comment must contain at least 3 characters");
  }

  if (trimmedComment.length > 1000) {
    throw new ApiError(400, "Comment cannot exceed 1000 characters");
  }

  const groomer = await User.findOne({
    _id: groomerId,
    role: "groomer",
    status: "active",
  });

  if (!groomer) {
    throw new ApiError(404, "Groomer not found");
  }

  const booking = await GroomingBooking.findOne({
    _id: groomingBookingId,
    ownerId: userId,
    groomerId,
    status: "completed",
    isActive: true,
  });

  if (!booking) {
    throw new ApiError(400, "You can review a groomer only after a completed grooming booking");
  }

  const existingReview = await Review.findOne({
    userId,
    reviewType: "groomer",
    groomingBookingId,
  });

  if (existingReview?.isActive) {
    throw new ApiError(409, "You have already reviewed this grooming booking");
  }

  let createdReview;

  if (existingReview && !existingReview.isActive) {
    existingReview.groomingBookingId = groomingBookingId;
    existingReview.groomerId = groomerId;
    existingReview.rating = numericRating;
    existingReview.serviceRating = numericServiceRating;
    existingReview.groomerRating = numericGroomerRating;
    existingReview.comment = trimmedComment;
    existingReview.isVerifiedPurchase = true;
    existingReview.isActive = true;
    existingReview.deletedBy = null;
    existingReview.deletedAt = null;
    await existingReview.save();
    createdReview = existingReview;
  } else {
    createdReview = await Review.create({
      userId,
      reviewType: "groomer",
      groomerId,
      groomingBookingId,
      rating: numericRating,
      serviceRating: numericServiceRating,
      groomerRating: numericGroomerRating,
      comment: trimmedComment,
      isVerifiedPurchase: true,
      isActive: true,
    });
  }

  await createdReview.populate("userId", "name profileImage");
  await createdReview.populate("groomerId", "name email profileImage");
  await createdReview.populate({
    path: "groomingBookingId",
    select: "_id bookingDate bookingTime status petId serviceId",
    populate: [
      { path: "petId", select: "petName name species breed" },
      { path: "serviceId", select: "serviceName name category price" },
    ],
  });

  res.status(201).json({
    success: true,
    message: "Groomer review added successfully",
    review: createdReview,
  });
});

export const getGroomerReviewsById = asyncHandler(async (req, res) => {
  const { groomerId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(groomerId)) {
    throw new ApiError(400, "Invalid groomer ID");
  }

  const groomer = await User.findOne({
    _id: groomerId,
    role: "groomer",
    status: "active",
  }).select("name profileImage");

  if (!groomer) {
    throw new ApiError(404, "Groomer not found");
  }

  const [reviews, ratingStats] = await Promise.all([
    Review.find({
      reviewType: "groomer",
      groomerId,
      isActive: true,
    })
      .populate("userId", "name profileImage")
      .populate({
        path: "groomingBookingId",
        select: "_id bookingDate bookingTime status petId serviceId",
        populate: [
          { path: "petId", select: "petName name species breed" },
          { path: "serviceId", select: "serviceName name category price" },
        ],
      })
      .sort({ createdAt: -1 }),
    Review.aggregate([
      {
        $match: {
          reviewType: "groomer",
          groomerId: new mongoose.Types.ObjectId(groomerId),
          isActive: true,
        },
      },
      { $group: { _id: "$rating", count: { $sum: 1 } } },
    ]),
  ]);

  const totalReviews = reviews.length;
  const averageRating =
    totalReviews > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
      : 0;
  const ratingBreakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  ratingStats.forEach((item) => {
    ratingBreakdown[item._id] = item.count;
  });

  res.status(200).json({
    success: true,
    message: "Groomer reviews fetched successfully",
    groomer: {
      _id: groomer._id,
      name: groomer.name,
      profileImage: groomer.profileImage,
      averageRating,
      totalReviews,
    },
    ratingBreakdown,
    reviews,
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
        reviewType: "product",
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
        reviewType: "product",
        productId,
        isActive: true,
      }),

      Review.aggregate([
        {
          $match: {
            reviewType: "product",
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

  const review = await Review.findById(id);

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

  await review.save();

  if (review.reviewType === "vet") {
    await updateVetRating(review.vetId);
  } else if (review.reviewType === "product") {
    await updateProductRating(review.productId);
  }

  await review.populate(
    "userId",
    "name profileImage"
  );

  res.status(200).json({
    success: true,
    message: "Review updated successfully",
    review,
  });
});


export const deleteReview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid review ID");
  }

  const review = await Review.findById(id);

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

  await review.save();

  if (review.reviewType === "vet") {
    await updateVetRating(review.vetId);
  } else if (review.reviewType === "product") {
    await updateProductRating(review.productId);
  }

  res.status(200).json({
    success: true,
    message: "Review deleted successfully",
    review: {
      _id: review._id,
      productId: review.productId,
      vetId: review.vetId,
      groomerId: review.groomerId,
      reviewType: review.reviewType,
      isActive: review.isActive,
    },
  });
});

export const getAllReviews = asyncHandler(async (req, res) => {
  const {
    search,
    rating,
    isActive,
    reviewType,
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = req.query;

  const query = {};

  if (rating) {
    query.rating = Number(rating);
  }

  if (reviewType) {
    if (!["product", "vet", "groomer"].includes(reviewType)) {
      throw new ApiError(400, "Review type must be product, vet or groomer");
    }
    query.reviewType = reviewType;
  }

  if (isActive !== undefined) {
    query.isActive = isActive === "true";
  }

  if (search?.trim()) {
    const searchText = search.trim();

    const matchingUsers = await User.find({
      $or: [
        {
          name: {
            $regex: searchText,
            $options: "i",
          },
        },
        {
          email: {
            $regex: searchText,
            $options: "i",
          },
        },
      ],
    }).select("_id");

    const userIds = matchingUsers.map((user) => user._id);

    const matchingProducts = await Product.find({
      productName: {
        $regex: searchText,
        $options: "i",
      },
    }).select("_id");

    const productIds = matchingProducts.map(
      (product) => product._id
    );

    const matchingVetUsers = await User.find({
      role: "vet",
      $or: [
        {
          name: {
            $regex: searchText,
            $options: "i",
          },
        },
        {
          email: {
            $regex: searchText,
            $options: "i",
          },
        },
      ],
    }).select("_id");

    const matchingVets = await VetProfile.find({
      $or: [
        {
          userId: {
            $in: matchingVetUsers.map((user) => user._id),
          },
        },
        {
          clinicName: {
            $regex: searchText,
            $options: "i",
          },
        },
        {
          specialization: {
            $regex: searchText,
            $options: "i",
          },
        },
      ],
    }).select("_id");

    const vetIds = matchingVets.map((vet) => vet._id);

    const matchingGroomers = await User.find({
      role: "groomer",
      $or: [
        {
          name: {
            $regex: searchText,
            $options: "i",
          },
        },
        {
          email: {
            $regex: searchText,
            $options: "i",
          },
        },
      ],
    }).select("_id");

    const groomerIds = matchingGroomers.map((groomer) => groomer._id);

    query.$or = [
      {
        comment: {
          $regex: searchText,
          $options: "i",
        },
      },
      {
        userId: {
          $in: userIds,
        },
      },
      {
        productId: {
          $in: productIds,
        },
      },
      {
        vetId: {
          $in: vetIds,
        },
      },
      {
        groomerId: {
          $in: groomerIds,
        },
      },
    ];

    if (mongoose.Types.ObjectId.isValid(searchText)) {
      query.$or.push({
        _id: searchText,
      });
    }
  }

  const pageNumber = Math.max(parseInt(page) || 1, 1);

  const pageLimit = Math.min(
    Math.max(parseInt(limit) || 10, 1),
    100
  );

  const skip = (pageNumber - 1) * pageLimit;

  const allowedSortFields = [
    "createdAt",
    "updatedAt",
    "rating",
  ];

  const selectedSortField = allowedSortFields.includes(sortBy)
    ? sortBy
    : "createdAt";

  const selectedSortOrder =
    sortOrder === "asc" ? 1 : -1;

  const [reviews, totalReviews] = await Promise.all([
    Review.find(query)
      .populate(
        "userId",
        "name email profileImage"
      )
      .populate(
        "productId",
        "productName images averageRating"
      )
      .populate({
        path: "vetId",
        select: "clinicName specialization averageRating userId",
        populate: { path: "userId", select: "name email profileImage" },
      })
      .populate(
        "groomerId",
        "name email profileImage"
      )
      .populate(
        "orderId",
        "_id orderStatus"
      )
      .populate(
        "appointmentId",
        "_id status appointmentDate appointmentTime"
      )
      .populate(
        "groomingBookingId",
        "_id status bookingDate bookingTime petId serviceId"
      )
      .sort({
        [selectedSortField]: selectedSortOrder,
      })
      .skip(skip)
      .limit(pageLimit),

    Review.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    message: "Reviews fetched successfully",

    pagination: {
      currentPage: pageNumber,
      totalPages: Math.ceil(
        totalReviews / pageLimit
      ),
      totalReviews,
      limit: pageLimit,
      hasNextPage:
        pageNumber <
        Math.ceil(totalReviews / pageLimit),
      hasPreviousPage:
        pageNumber > 1,
    },

    reviews,
  });
});

export const adminDeleteReview = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid review ID");
  }

  const review = await Review.findById(id);

  if (!review) {
    throw new ApiError(404, "Review not found");
  }

  if (!review.isActive) {
    throw new ApiError(
      400,
      "Review is already deleted"
    );
  }

  review.isActive = false;
  review.deletedBy = req.user._id;
  review.deletedAt = new Date();

  await review.save();

  if (review.reviewType === "vet") {
    await updateVetRating(review.vetId);
  } else if (review.reviewType === "product") {
    await updateProductRating(review.productId);
  }

  res.status(200).json({
    success: true,
    message: "Review deleted successfully by admin",
    review: {
      _id: review._id,
      userId: review.userId,
      productId: review.productId,
      vetId: review.vetId,
      groomerId: review.groomerId,
      reviewType: review.reviewType,
      isActive: review.isActive,
    },
  });
});


export const getReviewDashboard = asyncHandler(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    totalReviews,
    activeReviews,
    deletedReviews,
    verifiedPurchaseReviews,
    averageRating,
    ratingDistribution,
    todayReviews,
    recentReviews,
  ] = await Promise.all([
    Review.countDocuments(),

    Review.countDocuments({
      isActive: true,
    }),

    Review.countDocuments({
      isActive: false,
    }),

    Review.countDocuments({
      isVerifiedPurchase: true,
      isActive: true,
    }),

    Review.aggregate([
      {
        $match: {
          isActive: true,
        },
      },
      {
        $group: {
          _id: null,
          averageRating: {
            $avg: "$rating",
          },
        },
      },
    ]),

    Review.aggregate([
      {
        $match: {
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

    Review.countDocuments({
      isActive: true,
      createdAt: {
        $gte: today,
      },
    }),

    Review.find({
      isActive: true,
    })
      .populate("userId", "name email")
      .populate(
        "productId",
        "productName images averageRating"
      )
      .sort({
        createdAt: -1,
      })
      .limit(5),
  ]);

  const ratings = {
    5: 0,
    4: 0,
    3: 0,
    2: 0,
    1: 0,
  };

  ratingDistribution.forEach((item) => {
    ratings[item._id] = item.count;
  });

  res.status(200).json({
    success: true,
    message: "Review dashboard fetched successfully",

    dashboard: {
      totalReviews,
      activeReviews,
      deletedReviews,
      verifiedPurchaseReviews,

      averageRating:
        averageRating.length > 0
          ? Number(
              averageRating[0].averageRating.toFixed(1)
            )
          : 0,

      ratingDistribution: ratings,

      todayReviews,

      recentReviews,
    },
  });
});
