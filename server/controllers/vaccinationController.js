import mongoose from "mongoose";
import Vaccination from "../models/Vaccination.js";
import Pet from "../models/Pet.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";

export const createVaccination = asyncHandler(async (req, res) => {
  const {
    petId,
    vaccineName,
    doseNumber,
    vaccinationDate,
    nextDueDate,
    clinicName,
    notes,
  } = req.body || {};

  if (
    !petId ||
    !vaccineName ||
    !vaccinationDate ||
    !nextDueDate
  ) {
    throw new ApiError(400, "Please provide all required fields");
  }

  if (!mongoose.Types.ObjectId.isValid(petId)) {
    throw new ApiError(400, "Invalid pet ID");
  }

  const pet = await Pet.findOne({
    _id: petId,
    ownerId: req.user._id,
    isActive: true,
  });

  if (!pet) {
    throw new ApiError(
      404,
      "Pet not found or does not belong to you"
    );
  }

  if (new Date(nextDueDate) <= new Date(vaccinationDate)) {
    throw new ApiError(
      400,
      "Next due date must be after vaccination date"
    );
  }

  const vaccination = await Vaccination.create({
    petId,
    ownerId: req.user._id,
    vaccineName,
    doseNumber,
    vaccinationDate,
    nextDueDate,
    clinicName,
    notes,
    status: "completed",
  });

  res.status(201).json({
    success: true,
    message: "Vaccination record created successfully",
    vaccination,
  });
});


export const getMyVaccinations = asyncHandler(async (req, res) => {
  const {
    petId,
    status,
    search,
    page = 1,
    limit = 10,
    sort = "newest",
  } = req.query;

  const filter = {
    ownerId: req.user._id,
    isActive: true,
  };

  if (petId) {
    if (!mongoose.Types.ObjectId.isValid(petId)) {
      throw new ApiError(400, "Invalid pet ID");
    }

    filter.petId = petId;
  }

  const allowedStatuses = ["completed", "upcoming", "overdue"];

  if (status) {
    if (!allowedStatuses.includes(status)) {
      throw new ApiError(400, "Invalid vaccination status");
    }

    filter.status = status;
  }

  if (search?.trim()) {
    filter.vaccineName = {
      $regex: search.trim(),
      $options: "i",
    };
  }

  const pageNumber = Math.max(Number(page) || 1, 1);
  const limitNumber = Math.min(
    Math.max(Number(limit) || 10, 1),
    100
  );

  const skip = (pageNumber - 1) * limitNumber;

  const sortOptions = {
    newest: { vaccinationDate: -1 },
    oldest: { vaccinationDate: 1 },
    dueSoon: { nextDueDate: 1 },
    dueLater: { nextDueDate: -1 },
  };

  const sortOption = sortOptions[sort] || sortOptions.newest;

  const [vaccinations, total] = await Promise.all([
    Vaccination.find(filter)
      .populate(
        "petId",
        "petName species breed profileImage vaccinationStatus"
      )
      .populate({
        path: "veterinarian",
        select:
          "specialization clinicName profileImage userId",
        populate: {
          path: "userId",
          select: "name email phone",
        },
      })
      .sort(sortOption)
      .skip(skip)
      .limit(limitNumber),

    Vaccination.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    message: "Vaccination records fetched successfully",
    pagination: {
      total,
      page: pageNumber,
      limit: limitNumber,
      totalPages: Math.ceil(total / limitNumber),
    },
    vaccinations,
  });
});