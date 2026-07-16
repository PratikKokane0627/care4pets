import bcrypt from "bcryptjs";

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