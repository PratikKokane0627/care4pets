import mongoose from "mongoose";

import Appointment from "../models/Appointment.js";
import Pet from "../models/Pet.js";
import VetProfile from "../models/VetProfile.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";

export const bookAppointment = asyncHandler(async (req, res) => {
  const {
    petId,
    vetId,
    appointmentDate,
    appointmentTime,
    reason,
    symptoms,
    notes,
  } = req.body;

  if (
    !petId ||
    !vetId ||
    !appointmentDate ||
    !appointmentTime ||
    !reason
  ) {
    throw new ApiError(
      400,
      "Pet, veterinarian, date, time, and reason are required"
    );
  }

  if (!mongoose.Types.ObjectId.isValid(petId)) {
    throw new ApiError(400, "Invalid pet ID");
  }

  if (!mongoose.Types.ObjectId.isValid(vetId)) {
    throw new ApiError(400, "Invalid veterinarian ID");
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

  const vet = await VetProfile.findOne({
    _id: vetId,
    status: "approved",
    isActive: true,
  }).populate({
    path: "userId",
    match: {
      role: "vet",
      status: "active",
    },
  });

  if (!vet || !vet.userId) {
    throw new ApiError(
      404,
      "Veterinarian is not available"
    );
  }

  const selectedDate = new Date(appointmentDate);

  if (Number.isNaN(selectedDate.getTime())) {
    throw new ApiError(400, "Invalid appointment date");
  }

  selectedDate.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (selectedDate < today) {
    throw new ApiError(
      400,
      "Appointment date cannot be in the past"
    );
  }

  const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;

  if (!timePattern.test(appointmentTime)) {
    throw new ApiError(
      400,
      "Appointment time must use HH:mm format"
    );
  }

  const dayName = selectedDate.toLocaleDateString("en-US", {
    weekday: "long",
  });

  const availabilityForDay = vet.availability?.find(
    (item) =>
      item.day === dayName &&
      item.isAvailable
  );

  if (!availabilityForDay) {
    throw new ApiError(
      400,
      `Veterinarian is not available on ${dayName}`
    );
  }

  if (
    appointmentTime < availabilityForDay.startTime ||
    appointmentTime >= availabilityForDay.endTime
  ) {
    throw new ApiError(
      400,
      `Appointment time must be between ${availabilityForDay.startTime} and ${availabilityForDay.endTime}`
    );
  }

  const existingAppointment = await Appointment.findOne({
    vetId,
    appointmentDate: selectedDate,
    appointmentTime,
    status: {
      $in: ["pending", "accepted"],
    },
    isActive: true,
  });

  if (existingAppointment) {
    throw new ApiError(
      409,
      "This appointment slot is already booked"
    );
  }

  const appointment = await Appointment.create({
    ownerId: req.user._id,
    petId,
    vetId,
    appointmentDate: selectedDate,
    appointmentTime,
    reason: reason.trim(),
    symptoms: symptoms?.trim() || "",
    notes: notes?.trim() || "",
    consultationFee: vet.consultationFee,
    status: "pending",
    paymentStatus: "pending",
  });

  const populatedAppointment = await Appointment.findById(
    appointment._id
  )
    .populate(
      "ownerId",
      "name email phone"
    )
    .populate(
      "petId",
      "petName species breed age gender profileImage"
    )
    .populate({
      path: "vetId",
      populate: {
        path: "userId",
        select: "name email phone profileImage",
      },
    });

  res.status(201).json({
    success: true,
    message: "Appointment booked successfully",
    appointment: populatedAppointment,
  });
});

export const getMyAppointments = asyncHandler(async (req, res) => {
  const {
    status,
    date,
    sort = "newest",
    page = 1,
    limit = 10,
  } = req.query;

  const pageNumber = Math.max(Number(page) || 1, 1);
  const limitNumber = Math.min(Math.max(Number(limit) || 10, 1), 50);
  const skip = (pageNumber - 1) * limitNumber;

  const filter = {
    ownerId: req.user._id,
    isActive: true,
  };

  // Filter by appointment status
  if (status) {
    const allowedStatuses = [
      "pending",
      "accepted",
      "rejected",
      "cancelled",
      "completed",
    ];

    if (!allowedStatuses.includes(status)) {
      throw new ApiError(400, "Invalid appointment status");
    }

    filter.status = status;
  }

  // Filter by exact date
  if (date) {
    const selectedDate = new Date(date);

    if (Number.isNaN(selectedDate.getTime())) {
      throw new ApiError(400, "Invalid appointment date");
    }

    selectedDate.setHours(0, 0, 0, 0);

    const nextDate = new Date(selectedDate);
    nextDate.setDate(nextDate.getDate() + 1);

    filter.appointmentDate = {
      $gte: selectedDate,
      $lt: nextDate,
    };
  }

  const sortOptions = {
    newest: {
      appointmentDate: -1,
      appointmentTime: -1,
    },
    oldest: {
      appointmentDate: 1,
      appointmentTime: 1,
    },
  };

  const selectedSort = sortOptions[sort] || sortOptions.newest;

  const [appointments, total] = await Promise.all([
    Appointment.find(filter)
      .populate(
        "petId",
        "petName species breed age gender profileImage"
      )
      .populate({
        path: "vetId",
        select:
          "specialization experience clinicName clinicAddress consultationFee profileImage averageRating",
        populate: {
          path: "userId",
          select: "name email phone profileImage",
        },
      })
      .sort(selectedSort)
      .skip(skip)
      .limit(limitNumber),

    Appointment.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    message: "Appointments fetched successfully",
    count: appointments.length,
    pagination: {
      currentPage: pageNumber,
      totalPages: Math.ceil(total / limitNumber),
      totalAppointments: total,
      limit: limitNumber,
    },
    appointments,
  });
});


export const getAppointmentById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid appointment ID");
  }

  const appointment = await Appointment.findOne({
    _id: id,
    isActive: true,
  })
    .populate("ownerId", "name email phone profileImage address")
    .populate(
      "petId",
      "petName species breed age gender weight profileImage medicalHistory vaccinationStatus"
    )
    .populate({
      path: "vetId",
      select:
        "qualification specialization experience clinicName clinicAddress consultationFee profileImage availability averageRating totalReviews userId",
      populate: {
        path: "userId",
        select: "name email phone role status profileImage address",
      },
    });

  if (!appointment) {
    throw new ApiError(404, "Appointment not found");
  }

  const isAdmin = req.user.role === "admin";

  const isOwner =
    req.user.role === "owner" &&
    appointment.ownerId._id.toString() === req.user._id.toString();

  const isAssignedVet =
    req.user.role === "vet" &&
    appointment.vetId?.userId?._id.toString() === req.user._id.toString();

  if (!isAdmin && !isOwner && !isAssignedVet) {
    throw new ApiError(
      403,
      "You are not authorized to view this appointment"
    );
  }

  res.status(200).json({
    success: true,
    message: "Appointment fetched successfully",
    appointment,
  });
});