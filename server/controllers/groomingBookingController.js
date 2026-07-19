import mongoose from "mongoose";

import GroomingBooking from "../models/GroomingBooking.js";
import GroomingService from "../models/GroomingService.js";
import Pet from "../models/Pet.js";

import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";

export const createGroomingBooking = asyncHandler(
  async (req, res) => {
    const {
      petId,
      serviceId,
      bookingDate,
      bookingTime,
      specialInstructions,
    } = req.body || {};

    if (!petId || !serviceId || !bookingDate || !bookingTime) {
      throw new ApiError(
        400,
        "Pet, service, booking date, and booking time are required"
      );
    }

    if (!mongoose.Types.ObjectId.isValid(petId)) {
      throw new ApiError(400, "Invalid pet ID");
    }

    if (!mongoose.Types.ObjectId.isValid(serviceId)) {
      throw new ApiError(400, "Invalid grooming service ID");
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

    const service = await GroomingService.findOne({
      _id: serviceId,
      isActive: true,
    });

    if (!service) {
      throw new ApiError(
        404,
        "Active grooming service not found"
      );
    }

    const parsedBookingDate = new Date(bookingDate);

    if (Number.isNaN(parsedBookingDate.getTime())) {
      throw new ApiError(400, "Invalid booking date");
    }

    parsedBookingDate.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (parsedBookingDate < today) {
      throw new ApiError(
        400,
        "Booking date cannot be in the past"
      );
    }

    const trimmedBookingTime = bookingTime.trim();

    const validTimeFormat =
      /^([01]\d|2[0-3]):([0-5]\d)$/.test(
        trimmedBookingTime
      );

    if (!validTimeFormat) {
      throw new ApiError(
        400,
        "Booking time must use HH:mm format"
      );
    }

    const existingBooking = await GroomingBooking.findOne({
      ownerId: req.user._id,
      petId,
      bookingDate: parsedBookingDate,
      bookingTime: trimmedBookingTime,
      status: {
        $in: ["pending", "accepted"],
      },
      isActive: true,
    });

    if (existingBooking) {
      throw new ApiError(
        409,
        "This pet already has a grooming booking at the selected date and time"
      );
    }

    const booking = await GroomingBooking.create({
      ownerId: req.user._id,
      petId,
      serviceId,
      bookingDate: parsedBookingDate,
      bookingTime: trimmedBookingTime,
      price: service.price,
      duration: service.duration,
      specialInstructions:
        specialInstructions?.trim() || "",
    });

    const populatedBooking =
      await GroomingBooking.findById(booking._id)
        .populate(
          "petId",
          "petName species breed gender age profileImage"
        )
        .populate(
          "serviceId",
          "serviceName description category price duration image"
        )
        .populate("ownerId", "name email phone");

    res.status(201).json({
      success: true,
      message: "Grooming booking created successfully",
      booking: populatedBooking,
    });
  }
);

export const getMyGroomingBookings = asyncHandler(async (req, res) => {
  const {
    status,
    bookingDate,
    search,
    page = 1,
    limit = 10,
    sort = "newest",
  } = req.query;

  const query = {
    ownerId: req.user._id,
    isActive: true,
  };

  if (status) {
    query.status = status;
  }

  if (bookingDate) {
    const date = new Date(bookingDate);

    if (Number.isNaN(date.getTime())) {
      throw new ApiError(400, "Invalid booking date");
    }

    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);

    query.bookingDate = {
      $gte: date,
      $lt: nextDay,
    };
  }

  const pageNumber = Math.max(Number(page), 1);
  const limitNumber = Math.min(Math.max(Number(limit), 1), 50);

  const skip = (pageNumber - 1) * limitNumber;

  const sortOptions = {
    newest: { bookingDate: -1, createdAt: -1 },
    oldest: { bookingDate: 1, createdAt: 1 },
  };

  const selectedSort = sortOptions[sort] || sortOptions.newest;

  let bookings = await GroomingBooking.find(query)
    .populate(
      "petId",
      "petName species breed profileImage"
    )
    .populate(
      "serviceId",
      "serviceName category price duration"
    )
    .populate(
      "groomerId",
      "name email phone"
    )
    .sort(selectedSort)
    .skip(skip)
    .limit(limitNumber);

  if (search) {
    const keyword = search.toLowerCase();

    bookings = bookings.filter((booking) =>
      booking.serviceId?.serviceName
        ?.toLowerCase()
        .includes(keyword)
    );
  }

  const totalBookings = await GroomingBooking.countDocuments(query);

  res.status(200).json({
    success: true,
    message: "My grooming bookings fetched successfully",
    count: bookings.length,
    totalBookings,
    currentPage: pageNumber,
    totalPages: Math.ceil(totalBookings / limitNumber),
    bookings,
  });
});