import mongoose from "mongoose";

import GroomingBooking from "../models/GroomingBooking.js";
import GroomingService from "../models/GroomingService.js";
import Pet from "../models/Pet.js";
import Notification from "../models/notificationModel.js";

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

    await Notification.create({
      userId: req.user._id,
      title: "Grooming Booked",
      message: "Your grooming service was booked successfully.",
      type: "Grooming",
      referenceId: booking._id,
      referenceModel: "GroomingBooking",
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

  await Notification.create({
    userId: booking.ownerId,
    title: "Grooming Status Updated",
    message: `Your grooming booking status is now ${booking.status}.`,
    type: "Grooming",
    referenceId: booking._id,
    referenceModel: "GroomingBooking",
  });

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

  await Notification.create({
    userId: booking.ownerId,
    title: "Grooming Status Updated",
    message: `Your grooming booking status is now ${booking.status}.`,
    type: "Grooming",
    referenceId: booking._id,
    referenceModel: "GroomingBooking",
  });

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

  await Notification.create({
    userId: booking.ownerId,
    title: "Grooming Status Updated",
    message: `Your grooming booking status is now ${booking.status}.`,
    type: "Grooming",
    referenceId: booking._id,
    referenceModel: "GroomingBooking",
  });

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
export const getGroomerDashboardStats = asyncHandler(async (req, res) => {
  const groomerId = req.user._id;

  // Use this explicitly inside the aggregation pipeline
  const groomerObjectId = new mongoose.Types.ObjectId(
    req.user._id.toString()
  );

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  const monthStart = new Date(
    todayStart.getFullYear(),
    todayStart.getMonth(),
    1
  );

  const nextMonthStart = new Date(
    todayStart.getFullYear(),
    todayStart.getMonth() + 1,
    1
  );

  const baseQuery = {
    groomerId,
    isActive: true,
  };

  const [
    totalBookings,
    acceptedBookings,
    rejectedBookings,
    cancelledBookings,
    completedBookings,
    todayBookings,
    monthlyBookings,
    monthlyRevenueResult,
    recentBookings,
  ] = await Promise.all([
    GroomingBooking.countDocuments(baseQuery),

    GroomingBooking.countDocuments({
      ...baseQuery,
      status: "accepted",
    }),

    GroomingBooking.countDocuments({
      ...baseQuery,
      status: "rejected",
    }),

    GroomingBooking.countDocuments({
      ...baseQuery,
      status: "cancelled",
    }),

    GroomingBooking.countDocuments({
      ...baseQuery,
      status: "completed",
    }),

    GroomingBooking.countDocuments({
      ...baseQuery,
      bookingDate: {
        $gte: todayStart,
        $lt: todayEnd,
      },
    }),

    GroomingBooking.countDocuments({
      ...baseQuery,
      bookingDate: {
        $gte: monthStart,
        $lt: nextMonthStart,
      },
    }),

    GroomingBooking.aggregate([
      {
        $match: {
          groomerId: groomerObjectId,
          isActive: true,
          status: "completed",
          completedAt: {
            $gte: monthStart,
            $lt: nextMonthStart,
          },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: {
            $sum: "$price",
          },
        },
      },
    ]),

    GroomingBooking.find(baseQuery)
      .populate("ownerId", "name email phone")
      .populate(
        "petId",
        "petName species breed profileImage"
      )
      .populate(
        "serviceId",
        "serviceName category duration price"
      )
      .sort({
        bookingDate: -1,
        bookingTime: -1,
      })
      .limit(5),
  ]);

  const monthlyRevenue =
    monthlyRevenueResult[0]?.totalRevenue || 0;

  res.status(200).json({
    success: true,
    message: "Groomer dashboard statistics fetched successfully",
    stats: {
      totalBookings,
      acceptedBookings,
      rejectedBookings,
      cancelledBookings,
      completedBookings,
      todayBookings,
      monthlyBookings,
      monthlyRevenue,
    },
    recentBookings,
  });
});

export const cancelGroomingBooking = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { cancellationReason } = req.body || {};

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid booking ID");
  }

  const booking = await GroomingBooking.findOne({
    _id: id,
    ownerId: req.user._id,
    isActive: true,
  });

  if (!booking) {
    throw new ApiError(
      404,
      "Grooming booking not found or you are not authorized"
    );
  }

  if (!["pending", "accepted"].includes(booking.status)) {
    throw new ApiError(
      400,
      `Cannot cancel a ${booking.status} booking`
    );
  }

  const bookingDateTime = new Date(booking.bookingDate);

  if (booking.bookingTime) {
    const [hours, minutes] = booking.bookingTime.split(":").map(Number);

    bookingDateTime.setHours(hours, minutes, 0, 0);
  }

  if (bookingDateTime < new Date()) {
    throw new ApiError(
      400,
      "Past grooming bookings cannot be cancelled"
    );
  }

  booking.status = "cancelled";
  booking.cancellationReason =
    cancellationReason?.trim() || "Cancelled by owner";
  booking.cancelledAt = new Date();

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
    message: "Grooming booking cancelled successfully",
    booking: updatedBooking,
  });
});

export const getGroomingBookingById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid grooming booking ID");
  }

  const booking = await GroomingBooking.findOne({
    _id: id,
    isActive: true,
  })
    .populate("ownerId", "name email phone")
    .populate(
      "petId",
      "petName species breed age gender weight profileImage"
    )
    .populate(
      "serviceId",
      "serviceName description category duration price image"
    )
    .populate("groomerId", "name email phone");

  if (!booking) {
    throw new ApiError(404, "Grooming booking not found");
  }

  const loggedInUserId = req.user._id.toString();

  const isOwner =
    booking.ownerId?._id.toString() === loggedInUserId;

  const isAssignedGroomer =
    booking.groomerId?._id.toString() === loggedInUserId;

  const isAdmin = req.user.role === "admin";

  if (!isOwner && !isAssignedGroomer && !isAdmin) {
    throw new ApiError(
      403,
      "You are not authorized to view this grooming booking"
    );
  }

  res.status(200).json({
    success: true,
    message: "Grooming booking fetched successfully",
    booking,
  });
});


export const getAllGroomingBookings = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    status,
    paymentStatus,
    search,
    bookingDate,
    sortBy = "createdAt",
    order = "desc",
  } = req.query;

  const pageNumber = Math.max(Number(page) || 1, 1);
  const limitNumber = Math.min(Math.max(Number(limit) || 10, 1), 100);

  const query = {
    isActive: true,
  };

  if (status) {
    query.status = status;
  }

  if (paymentStatus) {
    query.paymentStatus = paymentStatus;
  }

  if (bookingDate) {
    const startDate = new Date(bookingDate);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 1);

    query.bookingDate = {
      $gte: startDate,
      $lt: endDate,
    };
  }

  const sortOrder = order === "asc" ? 1 : -1;

  let bookingsQuery = GroomingBooking.find(query)
    .populate("ownerId", "name email phone")
    .populate(
      "petId",
      "petName species breed age gender profileImage"
    )
    .populate(
      "serviceId",
      "serviceName category duration price image"
    )
    .populate("groomerId", "name email phone role")
    .sort({
      [sortBy]: sortOrder,
    });

  if (search?.trim()) {
    const searchText = search.trim();

    bookingsQuery = bookingsQuery
      .populate({
        path: "ownerId",
        match: {
          $or: [
            { name: { $regex: searchText, $options: "i" } },
            { email: { $regex: searchText, $options: "i" } },
          ],
        },
        select: "name email phone",
      })
      .populate({
        path: "petId",
        match: {
          petName: {
            $regex: searchText,
            $options: "i",
          },
        },
        select: "petName species breed profileImage",
      })
      .populate({
        path: "serviceId",
        match: {
          serviceName: {
            $regex: searchText,
            $options: "i",
          },
        },
        select: "serviceName category duration price image",
      });
  }

  const bookings = await bookingsQuery;

  let filteredBookings = bookings;

  if (search?.trim()) {
    filteredBookings = bookings.filter(
      (booking) =>
        booking.ownerId ||
        booking.petId ||
        booking.serviceId ||
        booking.groomerId
    );
  }

  const totalBookings = filteredBookings.length;

  const paginatedBookings = filteredBookings.slice(
    (pageNumber - 1) * limitNumber,
    pageNumber * limitNumber
  );

  res.status(200).json({
    success: true,
    message: "All grooming bookings fetched successfully",
    pagination: {
      currentPage: pageNumber,
      totalPages: Math.ceil(totalBookings / limitNumber),
      totalBookings,
      limit: limitNumber,
    },
    bookings: paginatedBookings,
  });
});

export const getAdminGroomingDashboardStats = asyncHandler(async (req, res) => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  const monthStart = new Date(
    todayStart.getFullYear(),
    todayStart.getMonth(),
    1
  );

  const nextMonthStart = new Date(
    todayStart.getFullYear(),
    todayStart.getMonth() + 1,
    1
  );

  const [
    totalBookings,
    pendingBookings,
    acceptedBookings,
    rejectedBookings,
    cancelledBookings,
    completedBookings,
    todayBookings,
    monthlyBookings,
    totalRevenueResult,
    monthlyRevenueResult,
    recentBookings,
  ] = await Promise.all([
    GroomingBooking.countDocuments({ isActive: true }),

    GroomingBooking.countDocuments({
      isActive: true,
      status: "pending",
    }),

    GroomingBooking.countDocuments({
      isActive: true,
      status: "accepted",
    }),

    GroomingBooking.countDocuments({
      isActive: true,
      status: "rejected",
    }),

    GroomingBooking.countDocuments({
      isActive: true,
      status: "cancelled",
    }),

    GroomingBooking.countDocuments({
      isActive: true,
      status: "completed",
    }),

    GroomingBooking.countDocuments({
      isActive: true,
      bookingDate: {
        $gte: todayStart,
        $lt: todayEnd,
      },
    }),

    GroomingBooking.countDocuments({
      isActive: true,
      bookingDate: {
        $gte: monthStart,
        $lt: nextMonthStart,
      },
    }),

    GroomingBooking.aggregate([
      {
        $match: {
          isActive: true,
          status: "completed",
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: {
            $sum: "$price",
          },
        },
      },
    ]),

    GroomingBooking.aggregate([
      {
        $match: {
          isActive: true,
          status: "completed",
          completedAt: {
            $gte: monthStart,
            $lt: nextMonthStart,
          },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: {
            $sum: "$price",
          },
        },
      },
    ]),

    GroomingBooking.find({ isActive: true })
      .populate("ownerId", "name email")
      .populate("petId", "petName")
      .populate("serviceId", "serviceName price")
      .populate("groomerId", "name")
      .sort({ createdAt: -1 })
      .limit(5),
  ]);

  res.status(200).json({
    success: true,
    message: "Admin dashboard fetched successfully",

    stats: {
      totalBookings,
      pendingBookings,
      acceptedBookings,
      rejectedBookings,
      cancelledBookings,
      completedBookings,
      todayBookings,
      monthlyBookings,
      totalRevenue:
        totalRevenueResult[0]?.totalRevenue || 0,
      monthlyRevenue:
        monthlyRevenueResult[0]?.totalRevenue || 0,
    },

    recentBookings,
  });
});
