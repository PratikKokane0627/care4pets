import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import cloudinary from "../config/cloudinary.js";
import uploadToCloudinary from "../utils/uploadToCloudinary.js";
import User from "../models/User.js";
import VetProfile from "../models/VetProfile.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";

export const createVet = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    phone,
    password,
    qualification,
    specialization,
    experience,
    registrationNumber,
    clinicName,
    clinicAddress,
    consultationFee,
    about,
    availableDays,
    availableTime,
  } = req.body;

  if (
    !name ||
    !email ||
    !phone ||
    !password ||
    !qualification ||
    !specialization ||
    experience === undefined ||
    !registrationNumber ||
    !clinicName ||
    !clinicAddress?.city ||
    !clinicAddress?.state ||
    consultationFee === undefined
  ) {
    throw new ApiError(400, "All required veterinarian fields must be provided");
  }

  if (password.length < 8) {
    throw new ApiError(
      400,
      "Password must contain at least 8 characters"
    );
  }

  const normalizedEmail = email.toLowerCase().trim();

  const existingUser = await User.findOne({
    email: normalizedEmail,
  });

  if (existingUser) {
    throw new ApiError(409, "User with this email already exists");
  }

  const existingRegistration = await VetProfile.findOne({
    registrationNumber: registrationNumber.trim(),
  });

  if (existingRegistration) {
    throw new ApiError(
      409,
      "Veterinarian registration number already exists"
    );
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const vetUser = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    phone,
    password: hashedPassword,
    role: "vet",
    status: "active",
    isVerified: true,
  });

  try {
    const vetProfile = await VetProfile.create({
      userId: vetUser._id,
      qualification,
      specialization,
      experience,
      registrationNumber: registrationNumber.trim(),
      clinicName,
      clinicAddress,
      consultationFee,
      about,
      availableDays,
      availableTime,
      status: "approved",
      isActive: true,
    });

    const populatedVet = await VetProfile.findById(vetProfile._id).populate(
      "userId",
      "name email phone role status profileImage"
    );

    res.status(201).json({
      success: true,
      message: "Veterinarian created successfully",
      vet: populatedVet,
    });
  } catch (error) {
    // Roll back the User document if VetProfile creation fails
    await User.findByIdAndDelete(vetUser._id);
    throw error;
  }
});



export const getAllVets = asyncHandler(async (req, res) => {
  const {
    search,
    specialization,
    city,
    minExperience,
    maxFee,
    minRating,
    availableDay,
    sort = "newest",
    page = 1,
    limit = 10,
  } = req.query;

  const pageNumber = Math.max(Number(page) || 1, 1);
  const limitNumber = Math.min(Math.max(Number(limit) || 10, 1), 50);
  const skip = (pageNumber - 1) * limitNumber;

  const profileFilter = {
    status: "approved",
    isActive: true,
  };

  if (specialization) {
    profileFilter.specialization = specialization;
  }

  if (city) {
    profileFilter["clinicAddress.city"] = {
      $regex: city.trim(),
      $options: "i",
    };
  }

  if (minExperience !== undefined) {
    const experienceValue = Number(minExperience);

    if (Number.isNaN(experienceValue) || experienceValue < 0) {
      throw new ApiError(400, "Minimum experience must be a valid number");
    }

    profileFilter.experience = {
      $gte: experienceValue,
    };
  }

  if (maxFee !== undefined) {
    const feeValue = Number(maxFee);

    if (Number.isNaN(feeValue) || feeValue < 0) {
      throw new ApiError(400, "Maximum fee must be a valid number");
    }

    profileFilter.consultationFee = {
      $lte: feeValue,
    };
  }

  if (minRating !== undefined) {
    const ratingValue = Number(minRating);

    if (
      Number.isNaN(ratingValue) ||
      ratingValue < 0 ||
      ratingValue > 5
    ) {
      throw new ApiError(
        400,
        "Minimum rating must be between 0 and 5"
      );
    }

    profileFilter.averageRating = {
      $gte: ratingValue,
    };
  }

  if (availableDay) {
    profileFilter.availableDays = availableDay;
  }

  const userFilter = {
    role: "vet",
    status: "active",
  };

  if (search?.trim()) {
    const searchRegex = {
      $regex: search.trim(),
      $options: "i",
    };

    const matchingUsers = await User.find({
      ...userFilter,
      name: searchRegex,
    }).select("_id");

    const matchingUserIds = matchingUsers.map((user) => user._id);

    profileFilter.$or = [
      {
        userId: {
          $in: matchingUserIds,
        },
      },
      {
        clinicName: searchRegex,
      },
      {
        qualification: searchRegex,
      },
      {
        specialization: searchRegex,
      },
    ];
  }

  const sortOptions = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    rating: { averageRating: -1 },
    experience: { experience: -1 },
    feeLowToHigh: { consultationFee: 1 },
    feeHighToLow: { consultationFee: -1 },
  };

  const selectedSort = sortOptions[sort] || sortOptions.newest;

  const vets = await VetProfile.find(profileFilter)
    .populate({
      path: "userId",
      select: "name email phone role status profileImage address",
      match: userFilter,
    })
    .sort(selectedSort)
    .skip(skip)
    .limit(limitNumber);

  const filteredVets = vets.filter((vet) => vet.userId);

  const total = await VetProfile.countDocuments(profileFilter);

  res.status(200).json({
    success: true,
    message: "Veterinarians fetched successfully",
    count: filteredVets.length,
    pagination: {
      currentPage: pageNumber,
      totalPages: Math.ceil(total / limitNumber),
      totalVets: total,
      limit: limitNumber,
    },
    vets: filteredVets,
  });
});


export const getVetById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid veterinarian ID");
  }

  const vet = await VetProfile.findOne({
    _id: id,
    status: "approved",
    isActive: true,
  }).populate({
    path: "userId",
    select: "name email phone role status profileImage address",
    match: {
      role: "vet",
      status: "active",
    },
  });

  if (!vet || !vet.userId) {
    throw new ApiError(404, "Veterinarian not found");
  }

  res.status(200).json({
    success: true,
    message: "Veterinarian fetched successfully",
    vet,
  });
});
export const updateVet = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid veterinarian ID");
  }

  const vet = await VetProfile.findOne({
    _id: id,
    isActive: true,
  });

  if (!vet) {
    throw new ApiError(404, "Veterinarian not found");
  }

  const isAdmin = req.user.role === "admin";

  const isProfileOwner =
    req.user.role === "vet" &&
    vet.userId.toString() === req.user._id.toString();

  if (!isAdmin && !isProfileOwner) {
    throw new ApiError(
      403,
      "You are not authorized to update this veterinarian profile"
    );
  }

  const allowedFields = [
    "qualification",
    "specialization",
    "experience",
    "clinicName",
    "consultationFee",
    "about",
    "availableDays",
  ];

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      vet[field] = req.body[field];
    }
  });

  if (req.body.clinicAddress) {
    vet.clinicAddress = {
      ...vet.clinicAddress.toObject(),
      ...req.body.clinicAddress,
    };
  }

  if (req.body.availableTime) {
    vet.availableTime = {
      ...vet.availableTime.toObject(),
      ...req.body.availableTime,
    };
  }

  // Only admin can change status fields
  if (isAdmin) {
    if (req.body.status !== undefined) {
      vet.status = req.body.status;
    }

    if (req.body.isActive !== undefined) {
      vet.isActive = req.body.isActive;
    }
  }

  await vet.save();

  const updatedVet = await VetProfile.findById(vet._id).populate(
    "userId",
    "name email phone role status profileImage address"
  );

  res.status(200).json({
    success: true,
    message: "Veterinarian profile updated successfully",
    vet: updatedVet,
  });
});


export const uploadVetImage = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid veterinarian ID");
  }

  const vet = await VetProfile.findOne({
    _id: id,
    isActive: true,
  });

  if (!vet) {
    throw new ApiError(404, "Veterinarian not found");
  }

  const isAdmin = req.user.role === "admin";

  const isProfileOwner =
    req.user.role === "vet" &&
    vet.userId.toString() === req.user._id.toString();

  if (!isAdmin && !isProfileOwner) {
    throw new ApiError(
      403,
      "You are not authorized to update this veterinarian image"
    );
  }

  if (!req.file) {
    throw new ApiError(400, "Please upload an image");
  }

  const oldPublicId = vet.profileImage?.publicId;

  const result = await uploadToCloudinary(
    req.file.buffer,
    "care4pets/vets"
  );

  try {
    vet.profileImage = {
      url: result.secure_url,
      publicId: result.public_id,
    };

    await vet.save();
  } catch (error) {
    await cloudinary.uploader.destroy(result.public_id);
    throw error;
  }

  if (oldPublicId) {
    await cloudinary.uploader.destroy(oldPublicId);
  }

  res.status(200).json({
    success: true,
    message: "Veterinarian image uploaded successfully",
    image: vet.profileImage,
    vet,
  });
});