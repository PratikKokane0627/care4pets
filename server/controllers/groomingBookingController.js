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

export const getAvailableGroomingBookings = asyncHandler(
  async (req, res) => {
    const {
      bookingDate,
      serviceId,
      page = 1,
      limit = 10,
      sort = "oldest",
    } = req.query;

    const query = {
      groomerId: null,
      status: "pending",
      isActive: true,
    };

    if (bookingDate) {
      const selectedDate = new Date(bookingDate);

      if (Number.isNaN(selectedDate.getTime())) {
        throw new ApiError(400, "Invalid booking date");
      }

      selectedDate.setHours(0, 0, 0, 0);

      const nextDay = new Date(selectedDate);
      nextDay.setDate(nextDay.getDate() + 1);

      query.bookingDate = {
        $gte: selectedDate,
        $lt: nextDay,
      };
    }

    if (serviceId) {
      if (!mongoose.Types.ObjectId.isValid(serviceId)) {
        throw new ApiError(400, "Invalid grooming service ID");
      }

      query.serviceId = serviceId;
    }

    const pageNumber = Math.max(Number(page) || 1, 1);

    const limitNumber = Math.min(
      Math.max(Number(limit) || 10, 1),
      50
    );

    const skip = (pageNumber - 1) * limitNumber;

    const sortOptions = {
      oldest: {
        bookingDate: 1,
        bookingTime: 1,
        createdAt: 1,
      },
      newest: {
        bookingDate: -1,
        bookingTime: -1,
        createdAt: -1,
      },
    };

    const selectedSort =
      sortOptions[sort] || sortOptions.oldest;

    const [bookings, totalBookings] = await Promise.all([
      GroomingBooking.find(query)
        .populate(
          "ownerId",
          "name email phone"
        )
        .populate(
          "petId",
          "petName species breed gender age profileImage"
        )
        .populate(
          "serviceId",
          "serviceName description category duration price image"
        )
        .sort(selectedSort)
        .skip(skip)
        .limit(limitNumber),

      GroomingBooking.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      message: "Available grooming bookings fetched successfully",
      count: bookings.length,
      totalBookings,
      currentPage: pageNumber,
      totalPages: Math.ceil(totalBookings / limitNumber),
      bookings,
    });
  }
);

export const getGroomerBookings = asyncHandler(async (req, res) => {
  const {
    status,
    bookingDate,
    page = 1,
    limit = 10,
    sort = "newest",
  } = req.query;

  const query = {
    groomerId: req.user._id,
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

    date.setHours(0, 0, 0, 0);

    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);

    query.bookingDate = {
      $gte: date,
      $lt: nextDay,
    };
  }

  const pageNumber = Math.max(Number(page) || 1, 1);
  const limitNumber = Math.min(Math.max(Number(limit) || 10, 1), 50);

  const skip = (pageNumber - 1) * limitNumber;

  const sortOptions = {
    newest: { bookingDate: -1, createdAt: -1 },
    oldest: { bookingDate: 1, createdAt: 1 },
  };

  const selectedSort = sortOptions[sort] || sortOptions.newest;

  const [bookings, totalBookings] = await Promise.all([
    GroomingBooking.find(query)
      .populate("ownerId", "name email phone")
      .populate(
        "petId",
        "petName species breed age gender profileImage"
      )
      .populate(
        "serviceId",
        "serviceName category duration price image"
      )
      .sort(selectedSort)
      .skip(skip)
      .limit(limitNumber),

    GroomingBooking.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    message: "Groomer bookings fetched successfully",
    count: bookings.length,
    totalBookings,
    currentPage: pageNumber,
    totalPages: Math.ceil(totalBookings / limitNumber),
    bookings,
  });
});

export const acceptGroomingBooking = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid booking ID");
  }

  const booking = await GroomingBooking.findOne({
    _id: id,
    isActive: true,
  });

  if (!booking) {
    throw new ApiError(404, "Grooming booking not found");
  }

  if (booking.status !== "pending") {
    throw new ApiError(
      400,
      `Cannot accept a ${booking.status} booking`
    );
  }

  if (booking.groomerId) {
    throw new ApiError(
      400,
      "This booking has already been assigned to a groomer"
    );
  }

  booking.groomerId = req.user._id;
  booking.status = "accepted";

  await booking.save();

  const updatedBooking = await GroomingBooking.findById(booking._id)
    .populate("ownerId", "name email phone")
    .populate(
      "petId",
      "petName species breed age gender profileImage"
    )
    .populate(
      "serviceId",
      "serviceName category duration price"
    )
    .populate(
      "groomerId",
      "name email phone"
    );

  res.status(200).json({
    success: true,
    message: "Grooming booking accepted successfully",
    booking: updatedBooking,
  });
});

export const rejectGroomingBooking = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rejectionReason } = req.body || {};

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid booking ID");
  }

  const booking = await GroomingBooking.findOne({
    _id: id,
    isActive: true,
  });

  if (!booking) {
    throw new ApiError(404, "Grooming booking not found");
  }

  if (booking.status !== "pending") {
    throw new ApiError(
      400,
      `Cannot reject a ${booking.status} booking`
    );
  }

  if (booking.groomerId) {
    throw new ApiError(
      400,
      "This booking has already been assigned to a groomer"
    );
  }

  booking.groomerId = req.user._id;
  booking.status = "rejected";
  booking.rejectionReason =
    rejectionReason?.trim() || "Rejected by groomer";

  await booking.save();

  const updatedBooking = await GroomingBooking.findById(
    booking._id
  )
    .populate("ownerId", "name email phone")
    .populate(
      "petId",
      "petName species breed age gender profileImage"
    )
    .populate(
      "serviceId",
      "serviceName category duration price"
    )
    .populate("groomerId", "name email phone");

  res.status(200).json({
    success: true,
    message: "Grooming booking rejected successfully",
    booking: updatedBooking,
  });
});

export const completeGroomingBooking = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { groomerNotes } = req.body || {};

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid booking ID");
  }

  const booking = await GroomingBooking.findOne({
    _id: id,
    isActive: true,
  });

  if (!booking) {
    throw new ApiError(404, "Grooming booking not found");
  }

  if (!booking.groomerId) {
    throw new ApiError(
      400,
      "This booking has not been assigned to a groomer"
    );
  }

  if (booking.groomerId.toString() !== req.user._id.toString()) {
    throw new ApiError(
      403,
      "You are not authorized to complete this booking"
    );
  }

  if (booking.status !== "accepted") {
    throw new ApiError(
      400,
      `Cannot complete a ${booking.status} booking`
    );
  }

  booking.status = "completed";
  booking.groomerNotes = groomerNotes?.trim() || "";
  booking.completedAt = new Date();

  await booking.save();

  const updatedBooking = await GroomingBooking.findById(booking._id)
    .populate("ownerId", "name email phone")
    .populate(
      "petId",
      "petName species breed age gender profileImage"
    )
    .populate(
      "serviceId",
      "serviceName category duration price image"
    )
    .populate("groomerId", "name email phone");

  res.status(200).json({
    success: true,
    message: "Grooming session completed successfully",
    booking: updatedBooking,
  });
});


export const updateGroomerNotes = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { groomerNotes } = req.body || {};

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid booking ID");
  }

  if (typeof groomerNotes !== "string" || !groomerNotes.trim()) {
    throw new ApiError(400, "Groomer notes are required");
  }

  const booking = await GroomingBooking.findOne({
    _id: id,
    isActive: true,
  });

  if (!booking) {
    throw new ApiError(404, "Grooming booking not found");
  }

  if (!booking.groomerId) {
    throw new ApiError(
      400,
      "This booking has not been assigned to a groomer"
    );
  }

  if (booking.groomerId.toString() !== req.user._id.toString()) {
    throw new ApiError(
      403,
      "You are not authorized to update notes for this booking"
    );
  }

  if (!["accepted", "completed"].includes(booking.status)) {
    throw new ApiError(
      400,
      `Cannot add notes to a ${booking.status} booking`
    );
  }

  booking.groomerNotes = groomerNotes.trim();

  await booking.save();

  const updatedBooking = await GroomingBooking.findById(booking._id)
    .populate("ownerId", "name email phone")
    .populate(
      "petId",
      "petName species breed age gender profileImage"
    )
    .populate(
      "serviceId",
      "serviceName category duration price image"
    )
    .populate("groomerId", "name email phone");

  res.status(200).json({
    success: true,
    message: "Groomer notes updated successfully",
    booking: updatedBooking,
  });
});