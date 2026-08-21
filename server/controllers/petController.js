import mongoose from "mongoose";
import uploadToCloudinary from "../utils/uploadToCloudinary.js";
import deleteUploadedImage from "../utils/deleteUploadedImage.js";
import Pet from "../models/Pet.js";
import Appointment from "../models/Appointment.js";
import Vaccination from "../models/Vaccination.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { getPetVaccinationState } from "../utils/vaccinationState.js";

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
  }).sort({ createdAt: -1 }).lean();

  const vaccinations = pets.length
    ? await Vaccination.find({
        ownerId: req.user._id,
        petId: { $in: pets.map((pet) => pet._id) },
        isActive: true,
      })
        .select("petId vaccinationDate nextDueDate status")
        .lean()
    : [];

  const vaccinationsByPetId = vaccinations.reduce((map, vaccination) => {
    const key = vaccination.petId.toString();
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(vaccination);
    return map;
  }, new Map());

  const petsWithVaccinationStatus = pets.map((pet) => ({
    ...pet,
    ...getPetVaccinationState(vaccinationsByPetId.get(pet._id.toString()) || []),
    storedVaccinationStatus: pet.vaccinationStatus,
  }));

  res.status(200).json({
    success: true,
    message: "Pets fetched successfully",
    count: petsWithVaccinationStatus.length,
    pets: petsWithVaccinationStatus,
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

  const vaccinations = await Vaccination.find({
    petId: pet._id,
    ownerId: req.user._id,
    isActive: true,
  }).select("vaccinationDate nextDueDate status");

  const computedPet = {
    ...pet.toObject(),
    ...getPetVaccinationState(vaccinations),
    storedVaccinationStatus: pet.vaccinationStatus,
  };

  res.status(200).json({
    success: true,
    message: "Pet fetched successfully",
    pet: computedPet,
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


export const deletePet = asyncHandler(async (req, res) => {
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

  // Soft Delete
  pet.isActive = false;

  await pet.save();

  res.status(200).json({
    success: true,
    message: "Pet deleted successfully",
  });
});



export const uploadPetImage = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid pet ID");
  }

  const pet = await Pet.findOne({
    _id: id,
    ownerId: req.user._id,
    isActive: true,
  });

  if (!pet) {
    throw new ApiError(404, "Pet not found");
  }

  if (!req.file) {
    throw new ApiError(400, "Please upload an image");
  }

  const oldPublicId = pet.profileImage?.publicId;

  const result = await uploadToCloudinary(
    req.file.buffer,
    "care4pets/pets",
    req.file.mimetype
  );

  try {
    pet.profileImage = {
      url: result.secure_url,
      publicId: result.public_id,
    };

    await pet.save();
  } catch (error) {
    await deleteUploadedImage(result.public_id);
    throw error;
  }

  if (oldPublicId) {
    await deleteUploadedImage(oldPublicId);
  }

  res.status(200).json({
    success: true,
    message: "Pet image uploaded successfully",
    image: pet.profileImage,
    pet,
  });
});

export const deletePetImage = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid pet ID");
  }

  const pet = await Pet.findOne({
    _id: id,
    ownerId: req.user._id,
    isActive: true,
  });

  if (!pet) {
    throw new ApiError(404, "Pet not found");
  }

  if (pet.profileImage?.publicId) {
    await deleteUploadedImage(pet.profileImage.publicId);
  }

  pet.profileImage = {
    url: "",
    publicId: "",
  };

  await pet.save();

  res.status(200).json({
    success: true,
    message: "Pet image deleted successfully",
    image: pet.profileImage,
    pet,
  });
});





export const getPetMedicalHistory = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, "Invalid pet ID");
    }

    const pet = await Pet.findById(id);

    if (!pet || !pet.isActive) {
        throw new ApiError(404, "Pet not found");
    }

    // Owner can only access their own pet
    if (
        req.user.role === "owner" &&
        pet.ownerId.toString() !== req.user._id.toString()
    ) {
        throw new ApiError(
            403,
            "You are not authorized to access this pet"
        );
    }

    const history = await Appointment.find({
        petId: id,
        status: "completed",
        isActive: true,
    })
        .populate({
            path: "vetId",
            populate: {
                path: "userId",
                select: "name email phone",
            },
        })
        .sort({ completedAt: -1 });

    res.status(200).json({
        success: true,
        count: history.length,
        history,
    });
});
