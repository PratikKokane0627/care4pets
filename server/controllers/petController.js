import mongoose from "mongoose";
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


export const getMyPets = asyncHandler(async (req, res) => {
  const pets = await Pet.find({
    ownerId: req.user._id,
    isActive: true,
  }).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    message: "Pets fetched successfully",
    count: pets.length,
    pets,
  });
});


export const getPetById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check valid MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid pet ID");
  }

  // Find pet belonging to logged-in owner
  const pet = await Pet.findOne({
    _id: id,
    ownerId: req.user._id,
    isActive: true,
  });

  if (!pet) {
    throw new ApiError(404, "Pet not found");
  }

  res.status(200).json({
    success: true,
    message: "Pet fetched successfully",
    pet,
  });
});


export const updatePet = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid pet ID");
  }

  // Find owner's pet
  const pet = await Pet.findOne({
    _id: id,
    ownerId: req.user._id,
    isActive: true,
  });

  if (!pet) {
    throw new ApiError(404, "Pet not found");
  }

  // Update only provided fields
  pet.petName = req.body.petName ?? pet.petName;
  pet.species = req.body.species ?? pet.species;
  pet.breed = req.body.breed ?? pet.breed;
  pet.age = req.body.age ?? pet.age;
  pet.gender = req.body.gender ?? pet.gender;
  pet.weight = req.body.weight ?? pet.weight;
  pet.color = req.body.color ?? pet.color;
  pet.dateOfBirth = req.body.dateOfBirth ?? pet.dateOfBirth;
  pet.medicalHistory =
    req.body.medicalHistory ?? pet.medicalHistory;
  pet.vaccinationStatus =
    req.body.vaccinationStatus ?? pet.vaccinationStatus;

  await pet.save();

  res.status(200).json({
    success: true,
    message: "Pet updated successfully",
    pet,
  });
});