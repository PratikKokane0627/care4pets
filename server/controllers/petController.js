import Pet from "../models/Pet.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";

export const addPet = asyncHandler(async (req, res) => {
  const {
    petName,
    species,
    breed,
    age,
    gender,
    weight,
    color,
    dateOfBirth,
    medicalHistory,
    vaccinationStatus,
  } = req.body;

  if (!petName || !species || !breed || age === undefined || !gender || weight === undefined) {
    throw new ApiError(
      400,
      "Pet name, species, breed, age, gender, and weight are required"
    );
  }

  const pet = await Pet.create({
    ownerId: req.user._id,
    petName,
    species,
    breed,
    age,
    gender,
    weight,
    color,
    dateOfBirth,
    medicalHistory,
    vaccinationStatus,
  });

  res.status(201).json({
    success: true,
    message: "Pet added successfully",
    pet,
  });
});


