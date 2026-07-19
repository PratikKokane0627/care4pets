import mongoose from "mongoose";
import GroomingService from "../models/GroomingService.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";

export const createGroomingService = asyncHandler(async (req, res) => {
  const {
    serviceName,
    description,
    duration,
    price,
    category,
  } = req.body || {};

  if (!serviceName || !duration || price === undefined || !category) {
    throw new ApiError(
      400,
      "Service name, duration, price, and category are required"
    );
  }

  const parsedDuration = Number(duration);
  const parsedPrice = Number(price);

  if (!Number.isFinite(parsedDuration) || parsedDuration <= 0) {
    throw new ApiError(
      400,
      "Duration must be a number greater than 0"
    );
  }

  if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
    throw new ApiError(
      400,
      "Price must be a number greater than or equal to 0"
    );
  }

  const existingService = await GroomingService.findOne({
    serviceName: serviceName.trim(),
    isActive: true,
  });

  if (existingService) {
    throw new ApiError(
      409,
      "An active grooming service with this name already exists"
    );
  }

  const groomingService = await GroomingService.create({
    serviceName: serviceName.trim(),
    description: description?.trim() || "",
    duration: parsedDuration,
    price: parsedPrice,
    category,
  });

  res.status(201).json({
    success: true,
    message: "Grooming service created successfully",
    groomingService,
  });
});


