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


