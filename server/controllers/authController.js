import bcrypt from "bcryptjs";

import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import generateToken from "../utils/generateToken.js";

export const register = asyncHandler(async (req, res) => {
  const { name, email, phone, password } = req.body;

  // 1. Validate required fields
  if (!name || !email || !phone || !password) {
    throw new ApiError(400, "All fields are required");
  }

  // 2. Check password length
  if (password.length < 8) {
    throw new ApiError(
      400,
      "Password must contain at least 8 characters"
    );
  }

  // 3. Check whether user already exists
  const existingUser = await User.findOne({
    email: email.toLowerCase(),
  });

  if (existingUser) {
    throw new ApiError(409, "User with this email already exists");
  }

  // 4. Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // 5. Create owner account
  const user = await User.create({
    name,
    email: email.toLowerCase(),
    phone,
    password: hashedPassword,
    role: "owner",
    status: "active",
  });

  // 6. Generate JWT
  const token = generateToken(user._id);

  // 7. Send response
  res.status(201).json({
    success: true,
    message: "Registration successful",
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
      profileImage: user.profileImage,
      createdAt: user.createdAt,
    },
  });
});


export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // 1. Validate input
  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  // 2. Find user and include password
  const user = await User.findOne({
    email: email.toLowerCase(),
  }).select("+password");

  // Use the same message for unknown email and wrong password
  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  // 3. Compare entered password with hashed password
  const isPasswordCorrect = await bcrypt.compare(
    password,
    user.password
  );

  if (!isPasswordCorrect) {
    throw new ApiError(401, "Invalid email or password");
  }

  // 4. Check account status
  if (user.status === "blocked") {
    throw new ApiError(
      403,
      "Your account has been blocked. Contact the administrator."
    );
  }

  if (user.status === "inactive") {
    throw new ApiError(403, "Your account is inactive");
  }

  if (user.status === "pending") {
    throw new ApiError(
      403,
      "Your account is waiting for administrator approval"
    );
  }

  if (user.status === "rejected") {
    throw new ApiError(
      403,
      "Your account application has been rejected"
    );
  }

  // 5. Update last login
  user.lastLogin = new Date();

  await user.save({
    validateBeforeSave: false,
  });

  // 6. Generate new JWT
  const token = generateToken(user._id);

  // 7. Send response
  res.status(200).json({
    success: true,
    message: "Login successful",
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
      profileImage: user.profileImage,
      lastLogin: user.lastLogin,
    },
  });
});