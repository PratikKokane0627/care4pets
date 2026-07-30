import bcrypt from "bcryptjs";
import mongoose from "mongoose";

import Appointment from "../models/Appointment.js";
import GroomingBooking from "../models/GroomingBooking.js";
import Order from "../models/Order.js";
import Pet from "../models/Pet.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import Vaccination from "../models/Vaccination.js";
import VetProfile from "../models/VetProfile.js";
import GroomerProfile from "../models/GroomerProfile.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import deleteAccountData from "../services/accountCleanupService.js";

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

export const getDashboard = asyncHandler(async (req, res) => {
  const [
    totalUsers,
    activeUsers,
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
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ status: "active" }),
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
  ]);

  res.json({
    success: true,
    dashboard: {
      users: { total: totalUsers, active: activeUsers },
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
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (req.query.status === "upcoming") {
    filter.nextDueDate = { $gte: today };
    filter.status = { $ne: "completed" };
  } else if (req.query.status === "overdue") {
    filter.nextDueDate = { $lt: today };
    filter.status = { $ne: "completed" };
  } else if (req.query.status) {
    filter.status = req.query.status;
  }

  if (req.query.search?.trim()) {
    const search = new RegExp(escapeRegex(req.query.search.trim()), "i");
    filter.vaccineName = search;
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
      const due = new Date(item.nextDueDate);
      const days = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
      return {
        ...item.toObject(),
        calculatedStatus:
          item.status === "completed" ? "completed" : days < 0 ? "overdue" : "upcoming",
        daysRemaining: days >= 0 ? days : undefined,
        overdueDays: days < 0 ? Math.abs(days) : undefined,
      };
    }),
    pagination: pagination(page, limit, total),
  });
});

export const getUsers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const filter = {};

  if (req.query.role) filter.role = req.query.role;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.search?.trim()) {
    const search = new RegExp(escapeRegex(req.query.search.trim()), "i");
    filter.$or = [{ name: search }, { email: search }, { phone: search }];
  }

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  res.json({ success: true, users, pagination: pagination(page, limit, total) });
});

export const getUserById = asyncHandler(async (req, res) => {
  assertObjectId(req.params.id, "user");
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, "User not found");

  const vetProfile =
    user.role === "vet"
      ? await VetProfile.findOne({ userId: user._id })
      : null;

  res.json({ success: true, user, vetProfile });
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
