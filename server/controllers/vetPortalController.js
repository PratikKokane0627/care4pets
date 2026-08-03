import mongoose from "mongoose";

import Appointment from "../models/Appointment.js";
import Pet from "../models/Pet.js";
import Review from "../models/Review.js";
import VetProfile from "../models/VetProfile.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

const allowedStatuses = ["pending", "accepted", "rejected", "cancelled", "completed"];

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const parsePagination = (query) => {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 10, 1), 50);
  return { page, limit, skip: (page - 1) * limit };
};

const getMyVetProfile = async (userId) => {
  const vet = await VetProfile.findOne({ userId, isActive: true }).populate(
    "userId",
    "name email phone role status profileImage address createdAt"
  );
  if (!vet) throw new ApiError(404, "Veterinarian profile not found");
  return vet;
};

const dayRange = (date = new Date()) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
};

const appointmentPopulate = (query) =>
  query
    .populate("ownerId", "name email phone profileImage")
    .populate(
      "petId",
      "petName species breed age gender weight color dateOfBirth profileImage medicalHistory vaccinationStatus"
    )
    .populate({
      path: "vetId",
      select: "qualification specialization clinicName consultationFee profileImage averageRating totalReviews userId",
      populate: { path: "userId", select: "name email phone profileImage" },
    });

export const getVetDashboard = asyncHandler(async (req, res) => {
  const vet = await getMyVetProfile(req.user._id);
  const { start: todayStart, end: todayEnd } = dayRange();
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() || 7) - 1));
  const nextWeek = new Date(weekStart);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const base = { vetId: vet._id, isActive: true };

  const [
    statusCounts,
    todaySchedule,
    upcomingAppointments,
    pendingRequests,
    recentCompletedAppointments,
    weeklyRows,
    patientRows,
    totalPatientRows,
    totalPrescriptions,
    paidRevenue,
  ] = await Promise.all([
    Appointment.aggregate([
      { $match: base },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    appointmentPopulate(
      Appointment.find({
        ...base,
        appointmentDate: { $gte: todayStart, $lt: todayEnd },
      })
    )
      .sort({ appointmentTime: 1 })
      .limit(8),
    appointmentPopulate(
      Appointment.find({
        ...base,
        status: { $in: ["pending", "accepted"] },
        appointmentDate: { $gte: todayStart },
      })
    )
      .sort({ appointmentDate: 1, appointmentTime: 1 })
      .limit(8),
    appointmentPopulate(Appointment.find({ ...base, status: "pending" }))
      .sort({ appointmentDate: 1, appointmentTime: 1 })
      .limit(8),
    appointmentPopulate(Appointment.find({ ...base, status: "completed" }))
      .sort({ completedAt: -1, appointmentDate: -1 })
      .limit(8),
    Appointment.aggregate([
      {
        $match: {
          ...base,
          appointmentDate: { $gte: weekStart, $lt: nextWeek },
        },
      },
      {
        $group: {
          _id: { $dayOfWeek: "$appointmentDate" },
          count: { $sum: 1 },
        },
      },
    ]),
    Appointment.aggregate([
      { $match: base },
      { $sort: { appointmentDate: -1, createdAt: -1 } },
      {
        $group: {
          _id: "$petId",
          lastConsultationDate: { $first: "$appointmentDate" },
          appointmentCount: { $sum: 1 },
          upcomingAppointmentDate: {
            $max: {
              $cond: [
                { $in: ["$status", ["pending", "accepted"]] },
                "$appointmentDate",
                null,
              ],
            },
          },
        },
      },
      { $sort: { lastConsultationDate: -1 } },
      { $limit: 6 },
      {
        $lookup: {
          from: "pets",
          localField: "_id",
          foreignField: "_id",
          as: "pet",
        },
      },
      { $unwind: "$pet" },
      {
        $lookup: {
          from: "users",
          localField: "pet.ownerId",
          foreignField: "_id",
          as: "owner",
        },
      },
      { $unwind: "$owner" },
      {
        $project: {
          pet: {
            _id: "$pet._id",
            petName: "$pet.petName",
            species: "$pet.species",
            breed: "$pet.breed",
            profileImage: "$pet.profileImage",
          },
          owner: { _id: "$owner._id", name: "$owner.name", email: "$owner.email" },
          lastConsultationDate: 1,
          appointmentCount: 1,
          upcomingAppointmentDate: 1,
        },
      },
    ]),
    Appointment.aggregate([
      { $match: base },
      { $group: { _id: "$petId" } },
      { $count: "total" },
    ]),
    Appointment.countDocuments({
      ...base,
      status: "completed",
      prescription: { $exists: true, $ne: "" },
    }),
    Appointment.aggregate([
      { $match: { ...base, paymentStatus: "paid" } },
      { $group: { _id: null, total: { $sum: "$consultationFee" } } },
    ]),
  ]);

  const statsByStatus = statusCounts.reduce(
    (acc, item) => ({ ...acc, [item._id]: item.count }),
    {}
  );
  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const weeklyAppointments = dayLabels.map((day, index) => ({
    day,
    count: weeklyRows.find((row) => row._id === index + 1)?.count || 0,
  }));

  res.json({
    success: true,
    data: {
      vet,
      stats: {
        todayAppointments: todaySchedule.length,
        pendingAppointments: statsByStatus.pending || 0,
        acceptedAppointments: statsByStatus.accepted || 0,
        completedAppointments: statsByStatus.completed || 0,
        totalPatients: totalPatientRows[0]?.total || 0,
        totalPrescriptions,
        averageRating: vet.averageRating || 0,
        totalReviews: vet.totalReviews || 0,
        paidRevenue: paidRevenue[0]?.total || 0,
      },
      todaySchedule,
      upcomingAppointments,
      pendingRequests,
      recentPatients: patientRows,
      recentCompletedAppointments,
      weeklyAppointments,
      recentReviews: [],
      unreadNotifications: 0,
    },
  });
});

export const getVetPatients = asyncHandler(async (req, res) => {
  const vet = await getMyVetProfile(req.user._id);
  const { page, limit, skip } = parsePagination(req.query);
  const search = req.query.search?.trim();
  const species = req.query.species;

  if (search && search.length > 80) throw new ApiError(400, "Search is too long");

  const pipeline = [
    { $match: { vetId: vet._id, isActive: true } },
    { $sort: { appointmentDate: -1, createdAt: -1 } },
    {
      $group: {
        _id: "$petId",
        lastConsultationDate: { $first: "$appointmentDate" },
        appointmentCount: { $sum: 1 },
        upcomingAppointmentDate: {
          $max: {
            $cond: [
              { $in: ["$status", ["pending", "accepted"]] },
              "$appointmentDate",
              null,
            ],
          },
        },
      },
    },
    { $lookup: { from: "pets", localField: "_id", foreignField: "_id", as: "pet" } },
    { $unwind: "$pet" },
    { $match: { "pet.isActive": true, ...(species ? { "pet.species": species } : {}) } },
    { $lookup: { from: "users", localField: "pet.ownerId", foreignField: "_id", as: "owner" } },
    { $unwind: "$owner" },
  ];

  if (search) {
    const searchRegex = new RegExp(escapeRegex(search), "i");
    pipeline.push({
      $match: {
        $or: [
          { "pet.petName": searchRegex },
          { "pet.species": searchRegex },
          { "pet.breed": searchRegex },
          { "owner.name": searchRegex },
        ],
      },
    });
  }

  const [rows, totalRows] = await Promise.all([
    Appointment.aggregate([
      ...pipeline,
      { $sort: { lastConsultationDate: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          pet: {
            _id: "$pet._id",
            petName: "$pet.petName",
            species: "$pet.species",
            breed: "$pet.breed",
            age: "$pet.age",
            gender: "$pet.gender",
            weight: "$pet.weight",
            color: "$pet.color",
            profileImage: "$pet.profileImage",
            vaccinationStatus: "$pet.vaccinationStatus",
          },
          owner: { _id: "$owner._id", name: "$owner.name", email: "$owner.email", phone: "$owner.phone" },
          lastConsultationDate: 1,
          appointmentCount: 1,
          upcomingAppointmentDate: 1,
        },
      },
    ]),
    Appointment.aggregate([...pipeline, { $count: "total" }]),
  ]);

  const total = totalRows[0]?.total || 0;
  res.json({
    success: true,
    patients: rows,
    pagination: { currentPage: page, totalPages: Math.ceil(total / limit), total, limit },
  });
});

export const getVetPatientById = asyncHandler(async (req, res) => {
  const vet = await getMyVetProfile(req.user._id);
  const { petId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(petId)) throw new ApiError(400, "Invalid pet ID");

  const hasAccess = await Appointment.exists({ vetId: vet._id, petId, isActive: true });
  if (!hasAccess) throw new ApiError(404, "Patient not found");

  const [pet, consultations, upcomingAppointments] = await Promise.all([
    Pet.findOne({ _id: petId, isActive: true })
      .populate("ownerId", "name email phone profileImage")
      .lean(),
    appointmentPopulate(
      Appointment.find({ vetId: vet._id, petId, status: "completed", isActive: true })
    )
      .sort({ completedAt: -1, appointmentDate: -1 })
      .lean(),
    appointmentPopulate(
      Appointment.find({
        vetId: vet._id,
        petId,
        status: { $in: ["pending", "accepted"] },
        isActive: true,
      })
    )
      .sort({ appointmentDate: 1, appointmentTime: 1 })
      .lean(),
  ]);

  if (!pet) throw new ApiError(404, "Patient not found");
  res.json({ success: true, patient: pet, consultations, upcomingAppointments });
});

export const getVetPrescriptions = asyncHandler(async (req, res) => {
  const vet = await getMyVetProfile(req.user._id);
  const { page, limit, skip } = parsePagination(req.query);
  const filter = {
    vetId: vet._id,
    isActive: true,
    status: "completed",
    prescription: { $exists: true, $ne: "" },
  };

  if (req.query.date) {
    const { start, end } = dayRange(new Date(req.query.date));
    if (Number.isNaN(start.getTime())) throw new ApiError(400, "Invalid date");
    filter.appointmentDate = { $gte: start, $lt: end };
  }

  const [prescriptions, total] = await Promise.all([
    appointmentPopulate(Appointment.find(filter))
      .sort({ completedAt: -1, appointmentDate: -1 })
      .skip(skip)
      .limit(limit),
    Appointment.countDocuments(filter),
  ]);

  res.json({
    success: true,
    prescriptions,
    pagination: { currentPage: page, totalPages: Math.ceil(total / limit), total, limit },
  });
});

export const getVetReviews = asyncHandler(async (req, res) => {
  const vet = await getMyVetProfile(req.user._id);
  const { page, limit, skip } = parsePagination(req.query);
  const [reviews, total] = await Promise.all([
    Review.find({
      reviewType: "vet",
      vetId: vet._id,
      isActive: true,
    })
      .populate("userId", "name email profileImage")
      .populate({
        path: "appointmentId",
        select: "appointmentDate appointmentTime petId",
        populate: { path: "petId", select: "petName species profileImage" },
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Review.countDocuments({
      reviewType: "vet",
      vetId: vet._id,
      isActive: true,
    }),
  ]);

  res.json({
    success: true,
    reviews,
    pagination: { currentPage: page, totalPages: Math.ceil(total / limit), total, limit },
  });
});

export const getVetReviewSummary = asyncHandler(async (req, res) => {
  const vet = await getMyVetProfile(req.user._id);
  const ratingRows = await Review.aggregate([
    {
      $match: {
        reviewType: "vet",
        vetId: vet._id,
        isActive: true,
      },
    },
    {
      $group: {
        _id: "$rating",
        count: { $sum: 1 },
      },
    },
  ]);

  const ratingCounts = ratingRows.reduce(
    (current, row) => ({ ...current, [row._id]: row.count }),
    {}
  );

  res.json({
    success: true,
    summary: {
      averageRating: vet.averageRating || 0,
      totalReviews: vet.totalReviews || 0,
      distribution: [5, 4, 3, 2, 1].map((rating) => ({
        rating,
        count: ratingCounts[rating] || 0,
      })),
    },
  });
});
