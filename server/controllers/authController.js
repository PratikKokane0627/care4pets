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