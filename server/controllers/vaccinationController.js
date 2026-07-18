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

export const getVaccinationById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid vaccination ID");
  }

  const vaccination = await Vaccination.findOne({
    _id: id,
    ownerId: req.user._id,
    isActive: true,
  })
    .populate(
      "petId",
      "petName species breed age gender profileImage vaccinationStatus"
    )
    .populate({
      path: "veterinarian",
      select:
        "qualification specialization clinicName clinicAddress profileImage userId",
      populate: {
        path: "userId",
        select: "name email phone",
      },
    });

  if (!vaccination) {
    throw new ApiError(
      404,
      "Vaccination record not found or does not belong to you"
    );
  }

  res.status(200).json({
    success: true,
    message: "Vaccination record fetched successfully",
    vaccination,
  });
});


export const updateVaccination = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const {
    vaccineName,
    doseNumber,
    vaccinationDate,
    nextDueDate,
    clinicName,
    notes,
  } = req.body || {};

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid vaccination ID");
  }

  const vaccination = await Vaccination.findOne({
    _id: id,
    ownerId: req.user._id,
    isActive: true,
  });

  if (!vaccination) {
    throw new ApiError(
      404,
      "Vaccination record not found or does not belong to you"
    );
  }

  const updatedVaccinationDate = vaccinationDate
    ? new Date(vaccinationDate)
    : vaccination.vaccinationDate;

  const updatedNextDueDate = nextDueDate
    ? new Date(nextDueDate)
    : vaccination.nextDueDate;

  if (Number.isNaN(updatedVaccinationDate.getTime())) {
    throw new ApiError(400, "Invalid vaccination date");
  }

  if (Number.isNaN(updatedNextDueDate.getTime())) {
    throw new ApiError(400, "Invalid next due date");
  }

  if (updatedNextDueDate <= updatedVaccinationDate) {
    throw new ApiError(
      400,
      "Next due date must be after vaccination date"
    );
  }

  if (vaccineName !== undefined) {
    if (!vaccineName.trim()) {
      throw new ApiError(400, "Vaccine name cannot be empty");
    }

    vaccination.vaccineName = vaccineName.trim();
  }

  if (doseNumber !== undefined) {
    const dose = Number(doseNumber);

    if (!Number.isInteger(dose) || dose < 1) {
      throw new ApiError(
        400,
        "Dose number must be a positive integer"
      );
    }

    vaccination.doseNumber = dose;
  }

  vaccination.vaccinationDate = updatedVaccinationDate;
  vaccination.nextDueDate = updatedNextDueDate;

  if (clinicName !== undefined) {
    vaccination.clinicName = clinicName.trim();
  }

  if (notes !== undefined) {
    vaccination.notes = notes.trim();
  }

  await vaccination.save();

  const updatedVaccination = await Vaccination.findById(
    vaccination._id
  ).populate(
    "petId",
    "petName species breed profileImage vaccinationStatus"
  );

  res.status(200).json({
    success: true,
    message: "Vaccination record updated successfully",
    vaccination: updatedVaccination,
  });
});


export const deleteVaccination = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid vaccination ID");
  }

  const vaccination = await Vaccination.findOne({
    _id: id,
    ownerId: req.user._id,
    isActive: true,
  });

  if (!vaccination) {
    throw new ApiError(
      404,
      "Vaccination record not found or does not belong to you"
    );
  }

  
  vaccination.isActive = false;
vaccination.deletedAt = new Date();

await vaccination.save();

  res.status(200).json({
    success: true,
    message: "Vaccination record deleted successfully",
  });
});


export const getUpcomingVaccinations = asyncHandler(async (req, res) => {
  const days = Math.min(
    Math.max(Number(req.query.days) || 30, 1),
    365
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingDate = new Date(today);
  upcomingDate.setDate(upcomingDate.getDate() + days);
  upcomingDate.setHours(23, 59, 59, 999);

  const vaccinations = await Vaccination.find({
    ownerId: req.user._id,
    isActive: true,
    nextDueDate: {
      $gte: today,
      $lte: upcomingDate,
    },
  })
    .populate(
      "petId",
      "petName species breed profileImage"
    )
    .populate({
      path: "veterinarian",
      select: "clinicName specialization userId",
      populate: {
        path: "userId",
        select: "name email phone",
      },
    })
    .sort({ nextDueDate: 1 });

  const upcomingVaccinations = vaccinations.map((vaccination) => {
    const millisecondsPerDay = 1000 * 60 * 60 * 24;

    const daysRemaining = Math.ceil(
      (new Date(vaccination.nextDueDate) - today) /
        millisecondsPerDay
    );

    return {
      ...vaccination.toObject(),
      calculatedStatus: "upcoming",
      daysRemaining,
    };
  });

  res.status(200).json({
    success: true,
    message: "Upcoming vaccinations fetched successfully",
    rangeInDays: days,
    count: upcomingVaccinations.length,
    vaccinations: upcomingVaccinations,
  });
});


export const getOverdueVaccinations = asyncHandler(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const vaccinations = await Vaccination.find({
    ownerId: req.user._id,
    isActive: true,
    nextDueDate: {
      $lt: today,
    },
  })
    .populate(
      "petId",
      "petName species breed profileImage"
    )
    .populate({
      path: "veterinarian",
      select: "clinicName specialization userId",
      populate: {
        path: "userId",
        select: "name email phone",
      },
    })
    .sort({ nextDueDate: 1 });

  const overdueVaccinations = vaccinations.map((vaccination) => {
    const overdueDays = Math.ceil(
      (today - new Date(vaccination.nextDueDate)) /
      (1000 * 60 * 60 * 24)
    );

    return {
      ...vaccination.toObject(),
      calculatedStatus: "overdue",
      overdueDays,
    };
  });

  res.status(200).json({
    success: true,
    message: "Overdue vaccinations fetched successfully",
    count: overdueVaccinations.length,
    vaccinations: overdueVaccinations,
  });
});