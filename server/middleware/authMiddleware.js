import jwt from "jsonwebtoken";

import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";

export const protect = asyncHandler(async (req, res, next) => {
  let token;

  // 1. Read token from Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  // 2. Check if token exists
  if (!token) {
    throw new ApiError(401, "Authentication token is required");
  }

  try {
    // 3. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4. Find logged-in user
    const user = await User.findById(decoded.id);

    if (!user) {
      throw new ApiError(
        401,
        "User associated with this token no longer exists"
      );
    }

    // 5. Check account status
    if (user.status === "blocked") {
      throw new ApiError(403, "Your account has been blocked");
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

    // 6. Attach user to request
    req.user = user;

    // 7. Continue to controller
    next();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (error.name === "TokenExpiredError") {
      throw new ApiError(
        401,
        "Token has expired. Please login again"
      );
    }

    if (error.name === "JsonWebTokenError") {
      throw new ApiError(401, "Invalid authentication token");
    }

    throw new ApiError(401, "Authentication failed");
  }
});