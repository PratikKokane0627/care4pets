import bcrypt from "bcryptjs";
import mongoose from "mongoose";

import Appointment from "../models/Appointment.js";
import GroomingBooking from "../models/GroomingBooking.js";
import Order from "../models/Order.js";
import Pet from "../models/Pet.js";
import Product from "../models/Product.js";
import Notification from "../models/notificationModel.js";
import User from "../models/User.js";
import Vaccination from "../models/Vaccination.js";
import VetProfile from "../models/VetProfile.js";
import GroomerProfile from "../models/GroomerProfile.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import deleteAccountData from "./accountCleanupController.js";

const parsePagination = (query) => {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 10, 1), 100);
  return { page, limit, skip: (page - 1) * limit };
};

const pagination = (page, limit, total) => ({
  currentPage: page,
  totalPages: Math.ceil(total / limit),
  total,
  limit,
});

const assertObjectId = (id, label = "resource") => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, `Invalid ${label} ID`);
  }
};

const dateRange = (query) => {
  const createdAt = {};

  if (query.startDate) {
    const start = new Date(query.startDate);
    if (Number.isNaN(start.getTime())) throw new ApiError(400, "Invalid start date");
    createdAt.$gte = start;
  }

  if (query.endDate) {
    const end = new Date(query.endDate);
    if (Number.isNaN(end.getTime())) throw new ApiError(400, "Invalid end date");
    end.setHours(23, 59, 59, 999);
    createdAt.$lte = end;
  }

  if (createdAt.$gte && createdAt.$lte && createdAt.$gte > createdAt.$lte) {
    throw new ApiError(400, "Start date cannot be after end date");
  }

  return Object.keys(createdAt).length ? { createdAt } : {};
};

const escapeRegex = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const startOfDay = (value = new Date()) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

const getVaccinationReminderState = (vaccination, today = startOfDay()) => {
  if (!vaccination.nextDueDate) {
    return {
      calculatedStatus: "completed",
      dueLabel: "Vaccination completed",
      reminderLabel: "Disabled",
      canSendReminder: false,
      reminderKind: "disabled",
    };
  }

  const dueDate = startOfDay(vaccination.nextDueDate);
  const daysUntilDue = Math.round(
    (dueDate - today) / (1000 * 60 * 60 * 24)
  );

  if (daysUntilDue < 0) {
    const overdueDays = Math.abs(daysUntilDue);
    return {
      calculatedStatus: "overdue",
      dueLabel: `Overdue by ${overdueDays} day${overdueDays === 1 ? "" : "s"}`,
      reminderLabel: "Send Overdue Reminder",
      canSendReminder: true,
      reminderKind: "overdue",
      overdueDays,
    };
  }

  if (daysUntilDue === 0) {
    return {
      calculatedStatus: "upcoming",
      dueLabel: "Due today",
      reminderLabel: "Send Due Reminder",
      canSendReminder: true,
      reminderKind: "due-today",
      daysRemaining: 0,
    };
  }

  if (daysUntilDue === 1) {
    return {
      calculatedStatus: "upcoming",
      dueLabel: "Next dose due tomorrow",
      reminderLabel: "Send Final Reminder",
      canSendReminder: true,
      reminderKind: "final",
      daysRemaining: 1,
    };
  }

  return {
    calculatedStatus: "upcoming",
    dueLabel: `Next dose due in ${daysUntilDue} days`,
    reminderLabel: daysUntilDue <= 7 ? "Send Reminder" : "Send Later",
    canSendReminder: daysUntilDue <= 7,
    reminderKind: daysUntilDue <= 7 ? "first" : "send-later",
    daysRemaining: daysUntilDue,
  };
};

export const getDashboard = asyncHandler(async (req, res) => {
  const [
    totalUsers,
    activeUsers,
    totalOwners,
    totalPets,
    pendingVets,
    totalVets,
    totalGroomers,
    totalAppointments,
    totalBookings,
    totalProducts,
    totalOrders,
    revenue,
    recentUsers,
    recentAppointments,
    recentGroomingBookings,
    recentOrders,
    lowStockProducts,
    vaccinationRows,
    recentNotifications,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ status: "active" }),
    User.countDocuments({ role: "owner" }),
    Pet.countDocuments({ isActive: true }),
    VetProfile.countDocuments({ status: "pending" }),
    User.countDocuments({ role: "vet" }),
    User.countDocuments({ role: "groomer" }),
    Appointment.countDocuments(),
    GroomingBooking.countDocuments({ isActive: true }),
    Product.countDocuments({ isActive: true }),
    Order.countDocuments(),
    Order.aggregate([
      { $match: { paymentStatus: { $in: ["Paid", "paid"] } } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]),
    User.find()
      .select("name email role status createdAt profileImage")
      .sort({ createdAt: -1 })
      .limit(5),
    Appointment.find()
      .populate("ownerId", "name email")
      .populate("petId", "petName species")
      .populate({
        path: "vetId",
        select: "userId clinicName",
        populate: {
          path: "userId",
          select: "name email",
        },
      })
      .sort({ createdAt: -1 })
      .limit(5),
    GroomingBooking.find({ isActive: true })
      .populate("ownerId", "name email")
      .populate("petId", "petName")
      .populate("serviceId", "serviceName price")
      .populate("groomerId", "name email")
      .sort({ createdAt: -1 })
      .limit(5),
    Order.find()
      .populate("userId", "name email")
      .sort({ createdAt: -1 })
      .limit(5),
    Product.find({ isActive: true, stock: { $lte: 5 } })
      .select("productName stock price discountPrice")
      .sort({ stock: 1, updatedAt: -1 })
      .limit(5),
    Vaccination.find({ isActive: true })
      .populate("ownerId", "name email")
      .populate("petId", "petName")
      .sort({ nextDueDate: 1 })
      .limit(100),
    Notification.find()
      .populate("userId", "name email role")
      .sort({ createdAt: -1 })
      .limit(6)
      .lean(),
  ]);

  const today = startOfDay();
  const vaccinationSummary = vaccinationRows.reduce(
    (summary, vaccination) => {
      const reminder = getVaccinationReminderState(vaccination, today);
      summary.total += 1;
      if (reminder.calculatedStatus === "upcoming") summary.upcoming += 1;
      if (reminder.calculatedStatus === "overdue") summary.overdue += 1;
      if (reminder.canSendReminder) summary.remindersDue += 1;
      return summary;
    },
    { total: 0, upcoming: 0, overdue: 0, remindersDue: 0 }
  );

  const paymentActivity = {
    paid: await Order.countDocuments({ paymentStatus: { $in: ["Paid", "paid"] } }),
    pending: await Order.countDocuments({ paymentStatus: { $in: ["Pending", "pending"] } }),
    failed: await Order.countDocuments({ paymentStatus: { $in: ["Failed", "failed"] } }),
    refunded: await Order.countDocuments({ paymentStatus: { $in: ["Refunded", "refunded"] } }),
  };

  res.json({
    success: true,
    dashboard: {
      users: { total: totalUsers, active: activeUsers, owners: totalOwners },
      vets: { total: totalVets, pendingApproval: pendingVets },
      groomers: totalGroomers,
      pets: totalPets,
      appointments: totalAppointments,
      groomingBookings: totalBookings,
      products: totalProducts,
      orders: totalOrders,
      revenue: revenue[0]?.total || 0,
      recentUsers,
      recentAppointments,
      recentGroomingBookings,
      recentOrders,
      paymentActivity,
      lowStockProducts,
      vaccinationSummary,
      recentNotifications,
      complaintSummary: null,
    },
  });
});

export const getPets = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const filter = { isActive: true };

  if (req.query.species) filter.species = req.query.species;
  if (req.query.vaccinationStatus) {
    filter.vaccinationStatus = req.query.vaccinationStatus;
  }
  if (req.query.search?.trim()) {
    const search = new RegExp(escapeRegex(req.query.search.trim()), "i");
    filter.$or = [{ petName: search }, { species: search }, { breed: search }];
  }

  const [pets, total] = await Promise.all([
    Pet.find(filter)
      .populate("ownerId", "name email phone")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Pet.countDocuments(filter),
  ]);

  res.json({ success: true, pets, pagination: pagination(page, limit, total) });
});

export const getPetById = asyncHandler(async (req, res) => {
  assertObjectId(req.params.id, "pet");

  const pet = await Pet.findOne({ _id: req.params.id, isActive: true }).populate(
    "ownerId",
    "name email phone"
  );
  if (!pet) throw new ApiError(404, "Pet not found");

  const [medicalHistory, vaccinations] = await Promise.all([
    Appointment.find({ petId: pet._id, isActive: true })
      .populate({ path: "vetId", populate: { path: "userId", select: "name email" } })
      .sort({ appointmentDate: -1 })
      .limit(20),
    Vaccination.find({ petId: pet._id, isActive: true })
      .sort({ nextDueDate: 1 })
      .limit(20),
  ]);

  res.json({ success: true, pet, medicalHistory, vaccinations });
});

export const getVaccinations = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const filter = { isActive: true };
  const andFilters = [];
  const today = startOfDay();

  if (req.query.status === "upcoming") {
    filter.nextDueDate = { $gte: today };
  } else if (req.query.status === "overdue") {
    filter.nextDueDate = { $lt: today };
  } else if (req.query.status === "completed") {
    andFilters.push({
      $or: [{ nextDueDate: { $exists: false } }, { nextDueDate: null }],
    });
  } else if (req.query.status) {
    filter.status = req.query.status;
  }

  if (req.query.search?.trim()) {
    const search = new RegExp(escapeRegex(req.query.search.trim()), "i");
    const [matchingPets, matchingOwners] = await Promise.all([
      Pet.find({ petName: search }).select("_id").lean(),
      User.find({ name: search }).select("_id").lean(),
    ]);

    andFilters.push({
      $or: [
        { vaccineName: search },
        { petId: { $in: matchingPets.map((pet) => pet._id) } },
        { ownerId: { $in: matchingOwners.map((owner) => owner._id) } },
      ],
    });
  }

  if (andFilters.length) {
    filter.$and = andFilters;
  }

  const [vaccinations, total] = await Promise.all([
    Vaccination.find(filter)
      .populate("ownerId", "name email phone")
      .populate("petId", "petName species breed profileImage")
      .sort({ nextDueDate: 1 })
      .skip(skip)
      .limit(limit),
    Vaccination.countDocuments(filter),
  ]);

  res.json({
    success: true,
    vaccinations: vaccinations.map((item) => {
      const reminder = getVaccinationReminderState(item, today);
      return {
        ...item.toObject(),
        vaccinationCompleted: Boolean(item.vaccinationDate),
        ...reminder,
      };
    }),
    pagination: pagination(page, limit, total),
  });
});

export const sendVaccinationReminder = asyncHandler(async (req, res) => {
  assertObjectId(req.params.id, "vaccination");

  const vaccination = await Vaccination.findOne({
    _id: req.params.id,
    isActive: true,
  })
    .populate("ownerId", "name email")
    .populate("petId", "petName")
    .lean();

  if (!vaccination) {
    throw new ApiError(404, "Vaccination record not found");
  }

  const reminder = getVaccinationReminderState(vaccination);

  if (!reminder.canSendReminder) {
    throw new ApiError(400, "Reminder is not due yet");
  }

  await Notification.create({
    userId: vaccination.ownerId._id || vaccination.ownerId,
    title: "Vaccination Reminder",
    message: `${vaccination.petId?.petName || "Your pet"} needs ${vaccination.vaccineName}. ${reminder.dueLabel}.`,
    type: "Vaccination",
    referenceId: vaccination._id,
    referenceModel: "Vaccination",
  });

  res.json({
    success: true,
    message: "Vaccination reminder sent successfully",
    reminder,
  });
});

export const getUsers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const filter = {};
  const requestedStatus = req.query.status;

  if (req.query.role) filter.role = req.query.role;
  if (req.query.search?.trim()) {
    const search = new RegExp(escapeRegex(req.query.search.trim()), "i");
    filter.$or = [{ name: search }, { email: search }, { phone: search }];
  }

  const users = await User.find(filter).lean().sort({ createdAt: -1 });

  const vetUserIds = users
    .filter((user) => user.role === "vet")
    .map((user) => user._id);

  const vetProfiles = vetUserIds.length
    ? await VetProfile.find({ userId: { $in: vetUserIds } })
        .select("_id userId status isActive")
        .lean()
    : [];

  const vetProfileByUserId = new Map(
    vetProfiles.map((profile) => [profile.userId.toString(), profile])
  );

  const usersWithVetStatus = users.map((user) => {
    if (user.role !== "vet") return user;

    const vetProfile = vetProfileByUserId.get(user._id.toString());

    return {
      ...user,
      accountStatus: user.status,
      vetProfileId: vetProfile?._id || null,
      vetApprovalStatus: vetProfile?.status || user.status,
      vetIsActive: vetProfile?.isActive || false,
    };
  });

  const filteredUsers = requestedStatus
    ? usersWithVetStatus.filter((user) => {
        const visibleStatus =
          user.role === "vet"
            ? user.vetApprovalStatus || user.status
            : user.status;

        return String(visibleStatus).toLowerCase() === String(requestedStatus).toLowerCase();
      })
    : usersWithVetStatus;

  const pagedUsers = filteredUsers.slice(skip, skip + limit);

  res.json({
    success: true,
    users: pagedUsers,
    pagination: pagination(page, limit, filteredUsers.length),
  });
});

export const getUserById = asyncHandler(async (req, res) => {
  assertObjectId(req.params.id, "user");
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, "User not found");

  const vetProfile =
    user.role === "vet"
      ? await VetProfile.findOne({ userId: user._id })
      : null;

  const appointmentFilter = {
    $or: [
      { ownerId: user._id },
      ...(vetProfile ? [{ vetId: vetProfile._id }] : []),
    ],
  };

  const groomingBookingFilter = {
    $or: [{ ownerId: user._id }, { groomerId: user._id }],
  };

  const [
    pets,
    appointments,
    groomingBookings,
    orders,
    petCount,
    appointmentCount,
    groomingBookingCount,
    orderCount,
  ] = await Promise.all([
    Pet.find({ ownerId: user._id, isActive: true })
      .select("petName species breed createdAt")
      .sort({ createdAt: -1 })
      .limit(5),
    Appointment.find(appointmentFilter)
      .populate("petId", "petName species")
      .populate({
        path: "vetId",
        select: "userId clinicName",
        populate: { path: "userId", select: "name email" },
      })
      .sort({ appointmentDate: -1, createdAt: -1 })
      .limit(5),
    GroomingBooking.find(groomingBookingFilter)
      .populate("petId", "petName species")
      .populate("serviceId", "serviceName")
      .populate("groomerId", "name email")
      .sort({ bookingDate: -1, createdAt: -1 })
      .limit(5),
    Order.find({ userId: user._id })
      .select("totalAmount totalItems orderStatus paymentStatus createdAt")
      .sort({ createdAt: -1 })
      .limit(5),
    Pet.countDocuments({ ownerId: user._id, isActive: true }),
    Appointment.countDocuments(appointmentFilter),
    GroomingBooking.countDocuments(groomingBookingFilter),
    Order.countDocuments({ userId: user._id }),
  ]);

  res.json({
    success: true,
    user,
    vetProfile,
    activity: {
      counts: {
        pets: petCount,
        appointments: appointmentCount,
        groomingBookings: groomingBookingCount,
        orders: orderCount,
      },
      pets,
      appointments,
      groomingBookings,
      orders,
    },
  });
});

export const updateUserStatus = asyncHandler(async (req, res) => {
  assertObjectId(req.params.id, "user");
  const allowedStatuses = ["pending", "active", "inactive", "blocked", "rejected"];
  const { status } = req.body;

  if (!allowedStatuses.includes(status)) {
    throw new ApiError(400, `Status must be one of: ${allowedStatuses.join(", ")}`);
  }
  if (req.user._id.toString() === req.params.id && status !== "active") {
    throw new ApiError(400, "You cannot disable your own admin account");
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { status },
    { returnDocument: "after", runValidators: true }
  );
  if (!user) throw new ApiError(404, "User not found");

  res.json({ success: true, message: "User status updated", user });
});

export const deleteUser = asyncHandler(async (req, res) => {
  assertObjectId(req.params.id, "user");
  if (req.user._id.toString() === req.params.id) {
    throw new ApiError(400, "You cannot delete your own admin account");
  }

  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, "User not found");

  await deleteAccountData(user);

  res.json({ success: true, message: "User deleted successfully" });
});

export const getVets = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const filter = {};
  if (req.query.status) filter.status = req.query.status;

  const [vets, total] = await Promise.all([
    VetProfile.find(filter)
      .populate("userId", "name email phone status profileImage createdAt")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    VetProfile.countDocuments(filter),
  ]);

  res.json({ success: true, vets, pagination: pagination(page, limit, total) });
});

export const getVetByIdAdmin = asyncHandler(async (req, res) => {
  assertObjectId(req.params.id, "veterinarian");

  const vet = await VetProfile.findById(req.params.id).populate(
    "userId",
    "name email phone role status isVerified profileImage address createdAt"
  );

  if (!vet) throw new ApiError(404, "Veterinarian not found");

  res.json({ success: true, vet });
});

const setVetApproval = (profileStatus, userStatus, message) =>
  asyncHandler(async (req, res) => {
    assertObjectId(req.params.id, "veterinarian");
    const vet = await VetProfile.findById(req.params.id);
    if (!vet) throw new ApiError(404, "Veterinarian not found");
    const vetUser = await User.findById(vet.userId);
    if (!vetUser) throw new ApiError(404, "Veterinarian user account not found");
    // Email verification before login temporarily disabled.
    // if (profileStatus === "approved" && !vetUser.isVerified) {
    //   throw new ApiError(400, "Veterinarian must verify their email before approval");
    // }

    vet.status = profileStatus;
    vet.isActive = profileStatus === "approved";
    await Promise.all([
      vet.save(),
      User.findByIdAndUpdate(vet.userId, {
        status: userStatus,
      }),
    ]);

    await Notification.create({
      userId: vet.userId,
      title: profileStatus === "approved" ? "Vet Profile Approved" : "Vet Profile Rejected",
      message:
        profileStatus === "approved"
          ? "Your veterinarian profile is approved and visible to owners."
          : "Your veterinarian profile application was rejected by admin.",
      type: "System",
    });

    await vet.populate("userId", "name email phone status isVerified");
    res.json({ success: true, message, vet });
  });

export const approveVet = setVetApproval("approved", "active", "Veterinarian approved");
export const rejectVet = setVetApproval("rejected", "rejected", "Veterinarian rejected");

export const getGroomers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const filter = { role: "groomer" };
  if (req.query.status) filter.status = req.query.status;
  if (req.query.search?.trim()) {
    const search = new RegExp(escapeRegex(req.query.search.trim()), "i");
    filter.$or = [{ name: search }, { email: search }, { phone: search }];
  }

  const [groomers, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  res.json({ success: true, groomers, pagination: pagination(page, limit, total) });
});

export const createGroomer = asyncHandler(async (req, res) => {
  const { name, email, phone, password } = req.body;
  if (!name || !email || !phone || !password) {
    throw new ApiError(400, "Name, email, phone and password are required");
  }
  if (password.length < 8) {
    throw new ApiError(400, "Password must contain at least 8 characters");
  }

  const normalizedEmail = email.toLowerCase().trim();
  if (await User.exists({ email: normalizedEmail })) {
    throw new ApiError(409, "User with this email already exists");
  }

  const groomer = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    phone,
    password: await bcrypt.hash(password, 10),
    role: "groomer",
    status: req.body.status || "active",
    isVerified: true,
    address: req.body.address,
  });

  try {
    const profile = await GroomerProfile.create({
      userId: groomer._id,
      bio: req.body.bio,
      experience: req.body.experience,
      skills: req.body.skills,
      serviceAreas: req.body.serviceAreas,
      availability: req.body.availability,
    });
    res.status(201).json({ success: true, message: "Groomer created", groomer, profile });
  } catch (error) {
    await User.findByIdAndDelete(groomer._id);
    throw error;
  }
});

export const updateGroomerStatus = asyncHandler(async (req, res) => {
  assertObjectId(req.params.id, "groomer");
  const allowedStatuses = ["active", "inactive", "blocked"];
  if (!allowedStatuses.includes(req.body.status)) {
    throw new ApiError(400, `Status must be one of: ${allowedStatuses.join(", ")}`);
  }

  const groomer = await User.findOneAndUpdate(
    { _id: req.params.id, role: "groomer" },
    { status: req.body.status },
    { returnDocument: "after", runValidators: true }
  );
  if (!groomer) throw new ApiError(404, "Groomer not found");

  await Notification.create({
    userId: groomer._id,
    title: "Groomer Account Status Updated",
    message: `Your groomer account status is now ${groomer.status}.`,
    type: "System",
  });

  res.json({ success: true, message: "Groomer status updated", groomer });
});

export const getAppointments = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const filter = { ...dateRange(req.query) };
  if (req.query.status) filter.status = req.query.status;
  // Payment code temporarily disabled.
  // if (req.query.paymentStatus) filter.paymentStatus = req.query.paymentStatus;

  const [appointments, total] = await Promise.all([
    Appointment.find(filter)
      .populate("ownerId", "name email phone")
      .populate("petId", "name species breed")
      .populate({ path: "vetId", populate: { path: "userId", select: "name email" } })
      .sort({ appointmentDate: -1 })
      .skip(skip)
      .limit(limit),
    Appointment.countDocuments(filter),
  ]);

  res.json({
    success: true,
    appointments,
    pagination: pagination(page, limit, total),
  });
});

export const updateAppointmentAdmin = asyncHandler(async (req, res) => {
  assertObjectId(req.params.id, "appointment");
  const allowedStatuses = ["pending", "accepted", "rejected", "cancelled", "completed"];
  const updates = {};

  if (req.body.status !== undefined) {
    if (!allowedStatuses.includes(req.body.status)) {
      throw new ApiError(400, `Status must be one of: ${allowedStatuses.join(", ")}`);
    }
    updates.status = req.body.status;
    if (req.body.status === "completed") updates.completedAt = new Date();
  }

  if (req.body.appointmentDate !== undefined) {
    const appointmentDate = new Date(req.body.appointmentDate);
    if (Number.isNaN(appointmentDate.getTime())) {
      throw new ApiError(400, "Invalid appointment date");
    }
    updates.appointmentDate = appointmentDate;
  }

  if (req.body.appointmentTime !== undefined) {
    updates.appointmentTime = req.body.appointmentTime;
  }

  if (req.body.rejectionReason !== undefined) {
    updates.rejectionReason = req.body.rejectionReason;
  }

  if (!Object.keys(updates).length) {
    throw new ApiError(400, "No appointment updates provided");
  }

  const appointment = await Appointment.findByIdAndUpdate(req.params.id, updates, {
    returnDocument: "after",
    runValidators: true,
  })
    .populate("ownerId", "name email phone")
    .populate("petId", "petName species breed")
    .populate({ path: "vetId", populate: { path: "userId", select: "name email" } });

  if (!appointment) throw new ApiError(404, "Appointment not found");

  res.json({ success: true, message: "Appointment updated", appointment });
});

export const updateGroomingBookingAdmin = asyncHandler(async (req, res) => {
  assertObjectId(req.params.id, "grooming booking");
  const allowedStatuses = ["pending", "accepted", "rejected", "cancelled", "completed"];

  if (!allowedStatuses.includes(req.body.status)) {
    throw new ApiError(400, `Status must be one of: ${allowedStatuses.join(", ")}`);
  }

  const updates = { status: req.body.status };
  if (req.body.status === "cancelled") {
    updates.cancellationReason = req.body.cancellationReason || "Cancelled by admin";
    updates.cancelledAt = new Date();
  }
  if (req.body.status === "completed") {
    updates.completedAt = new Date();
  }

  const booking = await GroomingBooking.findOneAndUpdate(
    { _id: req.params.id, isActive: true },
    updates,
    { returnDocument: "after", runValidators: true }
  )
    .populate("ownerId", "name email phone")
    .populate("petId", "petName species breed")
    .populate("serviceId", "serviceName category duration price")
    .populate("groomerId", "name email phone");

  if (!booking) throw new ApiError(404, "Grooming booking not found");

  res.json({ success: true, message: "Grooming booking updated", booking });
});

// Payment code temporarily disabled.
// export const getPayments = asyncHandler(async (req, res) => {
//   const { page, limit, skip } = parsePagination(req.query);
//   const filter = { ...dateRange(req.query) };
//   if (req.query.status) filter.paymentStatus = req.query.status;
//   if (req.query.method) filter.paymentMethod = req.query.method;
//
//   const [payments, total, summary] = await Promise.all([
//     Order.find(filter)
//       .select("userId totalAmount paymentMethod paymentStatus razorpayOrderId razorpayPaymentId paidAt createdAt")
//       .populate("userId", "name email")
//       .sort({ createdAt: -1 })
//       .skip(skip)
//       .limit(limit),
//     Order.countDocuments(filter),
//     Order.aggregate([
//       { $match: filter },
//       {
//         $group: {
//           _id: "$paymentStatus",
//           count: { $sum: 1 },
//           amount: { $sum: "$totalAmount" },
//         },
//       },
//     ]),
//   ]);
//
//   res.json({
//     success: true,
//     payments,
//     summary,
//     pagination: pagination(page, limit, total),
//   });
// });

export const getReports = asyncHandler(async (req, res) => {
  const range = dateRange(req.query);
  // Payment code temporarily disabled.
  // const paidOrders = { ...range, paymentStatus: "Paid" };

  const [
    orderStatuses,
    appointmentStatuses,
    userGrowth,
    popularProducts,
  ] = await Promise.all([
    // Payment code temporarily disabled.
    // Order.aggregate([
    //   { $match: paidOrders },
    //   {
    //     $group: {
    //       _id: null,
    //       revenue: { $sum: "$totalAmount" },
    //       orders: { $sum: 1 },
    //       averageOrderValue: { $avg: "$totalAmount" },
    //     },
    //   },
    // ]),
    Order.aggregate([
      { $match: range },
      { $group: { _id: "$orderStatus", count: { $sum: 1 }, amount: { $sum: "$totalAmount" } } },
    ]),
    // Payment code temporarily disabled.
    // Order.aggregate([
    //   { $match: range },
    //   { $group: { _id: "$paymentStatus", count: { $sum: 1 }, amount: { $sum: "$totalAmount" } } },
    // ]),
    Appointment.aggregate([
      { $match: range },
      { $group: { _id: "$status", count: { $sum: 1 }, fees: { $sum: "$consultationFee" } } },
    ]),
    User.aggregate([
      { $match: range },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Order.aggregate([
      { $match: range },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.productId",
          name: { $first: "$items.productName" },
          unitsSold: { $sum: "$items.quantity" },
          sales: { $sum: "$items.totalPrice" },
        },
      },
      { $sort: { unitsSold: -1 } },
      { $limit: 10 },
    ]),
    // Payment code temporarily disabled.
    // GroomingBooking.aggregate([
    //   { $match: { ...range, paymentStatus: "paid" } },
    //   { $group: { _id: null, revenue: { $sum: "$price" }, bookings: { $sum: 1 } } },
    // ]),
  ]);

  res.json({
    success: true,
    filters: { startDate: req.query.startDate || null, endDate: req.query.endDate || null },
    // Payment code temporarily disabled.
    // revenue: {
    //   orders: revenue[0] || { revenue: 0, orders: 0, averageOrderValue: 0 },
    //   grooming: groomingRevenue[0] || { revenue: 0, bookings: 0 },
    // },
    sales: { orderStatuses, popularProducts },
    // Payment code temporarily disabled.
    // payments: paymentStatuses,
    appointments: appointmentStatuses,
    userGrowth,
  });
});
