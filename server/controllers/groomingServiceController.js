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


export const getAllGroomingServices = asyncHandler(async (req, res) => {
  const {
    search,
    category,
    minPrice,
    maxPrice,
    sort = "newest",
    page = 1,
    limit = 10,
  } = req.query;

  const query = {
    isActive: true,
  };

  if (search) {
    query.$or = [
      {
        serviceName: {
          $regex: search.trim(),
          $options: "i",
        },
      },
      {
        description: {
          $regex: search.trim(),
          $options: "i",
        },
      },
    ];
  }

  if (category) {
    query.category = category;
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    query.price = {};

    if (minPrice !== undefined) {
      const parsedMinPrice = Number(minPrice);

      if (!Number.isFinite(parsedMinPrice) || parsedMinPrice < 0) {
        throw new ApiError(400, "Invalid minimum price");
      }

      query.price.$gte = parsedMinPrice;
    }

    if (maxPrice !== undefined) {
      const parsedMaxPrice = Number(maxPrice);

      if (!Number.isFinite(parsedMaxPrice) || parsedMaxPrice < 0) {
        throw new ApiError(400, "Invalid maximum price");
      }

      query.price.$lte = parsedMaxPrice;
    }

    if (
      query.price.$gte !== undefined &&
      query.price.$lte !== undefined &&
      query.price.$gte > query.price.$lte
    ) {
      throw new ApiError(
        400,
        "Minimum price cannot be greater than maximum price"
      );
    }
  }

  const pageNumber = Math.max(Number(page) || 1, 1);
  const limitNumber = Math.min(
    Math.max(Number(limit) || 10, 1),
    50
  );

  const skip = (pageNumber - 1) * limitNumber;

  const sortOptions = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    priceLow: { price: 1 },
    priceHigh: { price: -1 },
    durationLow: { duration: 1 },
    durationHigh: { duration: -1 },
    nameAZ: { serviceName: 1 },
    nameZA: { serviceName: -1 },
  };

  const selectedSort = sortOptions[sort] || sortOptions.newest;

  const [services, totalServices] = await Promise.all([
    GroomingService.find(query)
      .sort(selectedSort)
      .skip(skip)
      .limit(limitNumber),

    GroomingService.countDocuments(query),
  ]);

  const totalPages = Math.ceil(totalServices / limitNumber);

  res.status(200).json({
    success: true,
    message: "Grooming services fetched successfully",
    count: services.length,
    totalServices,
    currentPage: pageNumber,
    totalPages,
    services,
  });
});

export const getGroomingServiceById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid grooming service ID");
  }

  const service = await GroomingService.findOne({
    _id: id,
    isActive: true,
  });

  if (!service) {
    throw new ApiError(404, "Grooming service not found");
  }

  res.status(200).json({
    success: true,
    message: "Grooming service fetched successfully",
    service,
  });
});

export const updateGroomingService = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const {
    serviceName,
    description,
    duration,
    price,
    category,
  } = req.body || {};

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid grooming service ID");
  }

  const service = await GroomingService.findOne({
    _id: id,
    isActive: true,
  });

  if (!service) {
    throw new ApiError(404, "Grooming service not found");
  }

  if (serviceName !== undefined) {
    const trimmedName = serviceName.trim();

    if (!trimmedName) {
      throw new ApiError(400, "Service name cannot be empty");
    }

    const existingService = await GroomingService.findOne({
      _id: { $ne: id },
      serviceName: trimmedName,
      isActive: true,
    });

    if (existingService) {
      throw new ApiError(
        409,
        "A grooming service with this name already exists"
      );
    }

    service.serviceName = trimmedName;
  }

  if (description !== undefined) {
    service.description = description.trim();
  }

  if (duration !== undefined) {
    const parsedDuration = Number(duration);

    if (!Number.isFinite(parsedDuration) || parsedDuration <= 0) {
      throw new ApiError(
        400,
        "Duration must be greater than 0"
      );
    }

    service.duration = parsedDuration;
  }

  if (price !== undefined) {
    const parsedPrice = Number(price);

    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      throw new ApiError(
        400,
        "Price must be greater than or equal to 0"
      );
    }

    service.price = parsedPrice;
  }

  if (category !== undefined) {
    service.category = category;
  }

  await service.save();

  res.status(200).json({
    success: true,
    message: "Grooming service updated successfully",
    service,
  });
});

