import bcrypt from "bcryptjs";
import mongoose from "mongoose";

import Appointment from "../models/Appointment.js";
// Payment code temporarily disabled.
// import GroomingBooking from "../models/GroomingBooking.js";
import Order from "../models/Order.js";
import User from "../models/User.js";
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
    pendingVets,
    totalVets,
    totalGroomers,
    totalAppointments,
    totalOrders,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ status: "active" }),
    VetProfile.countDocuments({ status: "pending" }),
    User.countDocuments({ role: "vet" }),
    User.countDocuments({ role: "groomer" }),
    Appointment.countDocuments(),
    Order.countDocuments(),
  ]);

  res.json({
    success: true,
    dashboard: {
      users: { total: totalUsers, active: activeUsers },
      vets: { total: totalVets, pendingApproval: pendingVets },
      groomers: totalGroomers,
      appointments: totalAppointments,
      orders: totalOrders,
      // Payment code temporarily disabled.
      // paidOrderRevenue: revenue[0]?.total || 0,
    },
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
