import bcrypt from "bcryptjs";
import crypto from "crypto";

import User from "../models/User.js";
import VetProfile from "../models/VetProfile.js";
import { sendOtpEmail, sendPasswordResetEmail } from "../services/emailService.js";
import deleteAccountData from "../services/accountCleanupService.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import deleteUploadedImage from "../utils/deleteUploadedImage.js";
import generateToken from "../utils/generateToken.js";
import uploadToCloudinary from "../utils/uploadToCloudinary.js";

const hashToken = (value) =>
  crypto.createHash("sha256").update(value).digest("hex");

const validateNewPassword = (password) => {
  if (!password || password.length < 8) {
    throw new ApiError(400, "Password must contain at least 8 characters");
  }
};

const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  status: user.status,
  profileImage: user.profileImage,
  address: user.address,
  isVerified: user.isVerified,
  lastLogin: user.lastLogin,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

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
    isVerified: true,
  });

  // Email verification before login temporarily disabled.
  // Verification is required before authentication.
  res.status(201).json({
    success: true,
    message: "Registration successful. You can now log in",
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

  // Email verification before login temporarily disabled.
  // if (!user.isVerified) {
  //   throw new ApiError(403, "Verify your email before logging in");
  // }

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


export const getProfile = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: "Profile fetched successfully",
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      phone: req.user.phone,
      role: req.user.role,
      status: req.user.status,
      profileImage: req.user.profileImage,
      address: req.user.address,
      isVerified: req.user.isVerified,
      lastLogin: req.user.lastLogin,
      createdAt: req.user.createdAt,
      updatedAt: req.user.updatedAt,
    },
  });
});

export const sendOtp = asyncHandler(async (req, res) => {
  const email = req.body.email?.toLowerCase().trim();
  if (!email) throw new ApiError(400, "Email is required");

  const user = await User.findOne({ email }).select(
    "+otpToken +otpExpire +otpAttempts +otpLastSentAt"
  );
  if (user) {
    if (user.otpLastSentAt && Date.now() - user.otpLastSentAt.getTime() < 60 * 1000) {
      return res.json({
        success: true,
        message: "If an account exists for this email, a verification code has been sent",
      });
    }
    const otp = crypto.randomInt(100000, 1000000).toString();
    user.otpToken = hashToken(otp);
    user.otpExpire = new Date(Date.now() + 10 * 60 * 1000);
    user.otpAttempts = 0;
    user.otpLastSentAt = new Date();
    await user.save({ validateBeforeSave: false });

    try {
      await sendOtpEmail(user.email, otp);
    } catch (error) {
      user.otpToken = undefined;
      user.otpExpire = undefined;
      user.otpLastSentAt = undefined;
      await user.save({ validateBeforeSave: false });
      throw error;
    }
  }

  res.json({
    success: true,
    message: "If an account exists for this email, a verification code has been sent",
  });
});

export const verifyOtp = asyncHandler(async (req, res) => {
  const email = req.body.email?.toLowerCase().trim();
  const otp = String(req.body.otp || "").trim();
  if (!email || !/^\d{6}$/.test(otp)) {
    throw new ApiError(400, "Email and a valid 6-digit OTP are required");
  }

  const user = await User.findOne({ email }).select(
    "+otpToken +otpExpire +otpAttempts"
  );

  if (!user || !user.otpToken || !user.otpExpire || user.otpExpire <= new Date()) {
    throw new ApiError(400, "OTP is invalid or has expired");
  }
  if (user.otpAttempts >= 5) {
    user.otpToken = undefined;
    user.otpExpire = undefined;
    await user.save({ validateBeforeSave: false });
    throw new ApiError(429, "Too many invalid attempts. Request a new OTP");
  }

  const submittedHash = hashToken(otp);
  if (!crypto.timingSafeEqual(Buffer.from(user.otpToken), Buffer.from(submittedHash))) {
    user.otpAttempts += 1;
    await user.save({ validateBeforeSave: false });
    throw new ApiError(400, "OTP is invalid or has expired");
  }

  user.isVerified = true;
  user.otpToken = undefined;
  user.otpExpire = undefined;
  user.otpAttempts = 0;
  await user.save({ validateBeforeSave: false });

  res.json({ success: true, message: "Email verified successfully" });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const email = req.body.email?.toLowerCase().trim();
  if (!email) throw new ApiError(400, "Email is required");

  const user = await User.findOne({ email }).select(
    "+resetPasswordToken +resetPasswordExpire"
  );

  if (user) {
    const token = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = hashToken(token);
    user.resetPasswordExpire = new Date(Date.now() + 15 * 60 * 1000);
    await user.save({ validateBeforeSave: false });

    const clientUrl = (process.env.CLIENT_URL || "http://localhost:5173").replace(/\/$/, "");
    const resetUrl = `${clientUrl}/reset-password/${token}`;

    try {
      await sendPasswordResetEmail(user.email, resetUrl);
    } catch (error) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
      throw error;
    }
  }

  res.json({
    success: true,
    message: "If an account exists for this email, a password reset link has been sent",
  });
});

export const resetPassword = asyncHandler(async (req, res) => {
  validateNewPassword(req.body.password);

  const user = await User.findOne({
    resetPasswordToken: hashToken(req.params.token),
    resetPasswordExpire: { $gt: new Date() },
  }).select("+password +resetPasswordToken +resetPasswordExpire");

  if (!user) throw new ApiError(400, "Reset token is invalid or has expired");

  user.password = await bcrypt.hash(req.body.password, 10);
  user.passwordChangedAt = new Date();
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  res.json({
    success: true,
    message: "Password reset successfully",
    token: generateToken(user._id),
  });
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword) throw new ApiError(400, "Current password is required");
  validateNewPassword(newPassword);

  const user = await User.findById(req.user._id).select("+password");
  if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
    throw new ApiError(401, "Current password is incorrect");
  }
  if (await bcrypt.compare(newPassword, user.password)) {
    throw new ApiError(400, "New password must be different from current password");
  }

  user.password = await bcrypt.hash(newPassword, 10);
  user.passwordChangedAt = new Date();
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  res.json({
    success: true,
    message: "Password changed successfully",
    token: generateToken(user._id),
  });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const allowed = ["name", "phone"];
  allowed.forEach((field) => {
    if (req.body[field] !== undefined) req.user[field] = req.body[field];
  });

  if (req.body.address !== undefined) {
    if (typeof req.body.address !== "object" || Array.isArray(req.body.address)) {
      throw new ApiError(400, "Address must be an object");
    }
    const nextAddress = { ...req.body.address };
    if (nextAddress.zipCode !== undefined && nextAddress.postalCode === undefined) {
      nextAddress.postalCode = nextAddress.zipCode;
    }
    delete nextAddress.zipCode;

    req.user.address = {
      ...req.user.address.toObject(),
      ...nextAddress,
    };
  }

  if (req.body.email !== undefined) {
    const email = req.body.email.toLowerCase().trim();
    const exists = await User.exists({ email, _id: { $ne: req.user._id } });
    if (exists) throw new ApiError(409, "User with this email already exists");
    if (email !== req.user.email) {
      req.user.email = email;
      // Email verification before login temporarily disabled.
      // req.user.isVerified = false;
      req.user.isVerified = true;
    }
  }

  await req.user.save();
  res.json({ success: true, message: "Profile updated successfully", user: publicUser(req.user) });
});

export const updateProfileImage = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, "Please upload an image");

  const user = await User.findById(req.user._id).select("+profileImagePublicId");
  const oldPublicId = user.profileImagePublicId;
  const result = await uploadToCloudinary(
    req.file.buffer,
    "care4pets/users",
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
    message: "Profile image updated successfully",
    profileImage: user.profileImage,
    user: publicUser(user),
  });
});

export const deleteProfileImage = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("+profileImagePublicId");

  if (user.profileImagePublicId) {
    await deleteUploadedImage(user.profileImagePublicId);
  }

  user.profileImage = "";
  user.profileImagePublicId = "";
  await user.save({ validateBeforeSave: false });

  res.json({
    success: true,
    message: "Profile image deleted successfully",
    profileImage: user.profileImage,
    user: publicUser(user),
  });
});

export const deleteAccount = asyncHandler(async (req, res) => {
  const { password } = req.body;
  if (!password) throw new ApiError(400, "Password is required to delete the account");

  const user = await User.findById(req.user._id).select("+password +profileImagePublicId");
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new ApiError(401, "Password is incorrect");
  }

  if (user.role === "admin") {
    throw new ApiError(403, "Administrator accounts must be removed by another administrator");
  }

  await deleteAccountData(user);
  if (user.profileImagePublicId) {
    await deleteUploadedImage(user.profileImagePublicId);
  }

  res.json({ success: true, message: "Account deleted successfully" });
});
