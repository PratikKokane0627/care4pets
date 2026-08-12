import GroomerProfile from "../models/GroomerProfile.js";
import User from "../models/User.js";
import Review from "../models/Review.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import uploadToCloudinary from "../utils/uploadToCloudinary.js";
import deleteUploadedImage from "../utils/deleteUploadedImage.js";

const validateAvailability = (availability) => {
  if (!Array.isArray(availability)) {
    throw new ApiError(400, "Availability must be an array");
  }
  for (const slot of availability) {
    if (!slot.day || !slot.startTime || !slot.endTime) {
      throw new ApiError(400, "Each availability entry requires day, startTime and endTime");
    }
    if (slot.startTime >= slot.endTime) {
      throw new ApiError(400, "Availability start time must be before end time");
    }
  }
};

export const getMyGroomerProfile = asyncHandler(async (req, res) => {
  const profile = await GroomerProfile.findOne({ userId: req.user._id }).populate(
    "userId",
    "name email phone status profileImage address"
  );
  if (!profile) throw new ApiError(404, "Groomer profile not found");
  res.json({ success: true, profile });
});

export const updateMyGroomerProfile = asyncHandler(async (req, res) => {
  const profile = await GroomerProfile.findOne({ userId: req.user._id });
  if (!profile) throw new ApiError(404, "Groomer profile not found");

  for (const field of ["bio", "experience", "skills", "serviceAreas"]) {
    if (req.body[field] !== undefined) profile[field] = req.body[field];
  }
  await profile.save();
  res.json({ success: true, message: "Groomer profile updated", profile });
});

export const updateMyAvailability = asyncHandler(async (req, res) => {
  validateAvailability(req.body.availability);
  const profile = await GroomerProfile.findOne({ userId: req.user._id });
  if (!profile) throw new ApiError(404, "Groomer profile not found");

  profile.availability = req.body.availability;
  await profile.save();
  res.json({ success: true, message: "Availability updated", availability: profile.availability });
});

export const uploadMyGroomerImage = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, "Please upload an image");

  const profile = await GroomerProfile.findOne({ userId: req.user._id });
  if (!profile) throw new ApiError(404, "Groomer profile not found");

  const user = await User.findById(req.user._id).select("+profileImagePublicId");
  const oldPublicId = user.profileImagePublicId;
  const result = await uploadToCloudinary(
    req.file.buffer,
    "care4pets/groomers",
    req.file.mimetype
  );

  try {
    user.profileImage = result.secure_url;
    user.profileImagePublicId = result.public_id;
    await user.save({ validateBeforeSave: false });
  } catch (error) {
    await deleteUploadedImage(result.public_id);
    throw error;
  }

  if (oldPublicId) await deleteUploadedImage(oldPublicId);

  res.json({
    success: true,
    message: "Groomer profile image uploaded successfully",
    profileImage: user.profileImage,
    user,
  });
});

export const deleteMyGroomerImage = asyncHandler(async (req, res) => {
  const profile = await GroomerProfile.findOne({ userId: req.user._id });
  if (!profile) throw new ApiError(404, "Groomer profile not found");

  const user = await User.findById(req.user._id).select("+profileImagePublicId");

  if (user.profileImagePublicId) {
    await deleteUploadedImage(user.profileImagePublicId);
  }

  user.profileImage = "";
  user.profileImagePublicId = "";
  await user.save({ validateBeforeSave: false });

  res.json({
    success: true,
    message: "Groomer profile image deleted successfully",
    profileImage: user.profileImage,
    user,
  });
});

export const getMyGroomerReviews = asyncHandler(async (req, res) => {
  const groomerObjectId = req.user._id;

  const [reviews, ratingRows] = await Promise.all([
    Review.find({
      reviewType: "groomer",
      groomerId: groomerObjectId,
      isActive: true,
    })
      .populate("userId", "name email profileImage")
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
          groomerId: groomerObjectId,
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
  const distribution = [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count: ratingRows.find((row) => row._id === rating)?.count || 0,
  }));

  res.json({
    success: true,
    summary: { averageRating, totalReviews, distribution },
    reviews,
  });
});

export const getAvailableGroomers = asyncHandler(async (req, res) => {
  const filter = { isActive: true };
  if (req.query.day) {
    filter.availability = { $elemMatch: { day: req.query.day, isAvailable: true } };
  }
  if (req.query.area) filter.serviceAreas = new RegExp(req.query.area, "i");

  const profiles = await GroomerProfile.find(filter).populate({
    path: "userId",
    match: {
      role: "groomer",
      status: "active",
      // Email verification before login temporarily disabled.
      // isVerified: true,
    },
    select: "name phone profileImage",
  });

  res.json({ success: true, groomers: profiles.filter((profile) => profile.userId) });
});

export const ensureGroomerProfile = async (userId, data = {}) => {
  const user = await User.findOne({ _id: userId, role: "groomer" });
  if (!user) throw new ApiError(404, "Groomer not found");
  return GroomerProfile.findOneAndUpdate(
    { userId },
    {
      $setOnInsert: { userId },
      $set: {
        ...(data.bio !== undefined && { bio: data.bio }),
        ...(data.experience !== undefined && { experience: data.experience }),
        ...(data.skills !== undefined && { skills: data.skills }),
        ...(data.serviceAreas !== undefined && { serviceAreas: data.serviceAreas }),
        ...(data.availability !== undefined && { availability: data.availability }),
      },
    },
    { upsert: true, returnDocument: "after", runValidators: true }
  );
};
