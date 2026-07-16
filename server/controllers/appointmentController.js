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

