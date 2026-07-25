import GroomerProfile from "../models/GroomerProfile.js";
import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

const validateAvailability = (availability) => {
  if (!Array.isArray(availability)) {
    throw new ApiError(400, "Availability must be an array");
  }
  for (const slot of availability) {
    if (!slot.day || !slot.startTime || !slot.endTime) {
      throw new ApiError(400, "Each availability entry requires day, startTime and endTime");
    }
    if (slot.startTime >= slot.endTime) {
      throw new ApiError(400, "Availability start time must be before end time");
    }
  }
};

export const getMyGroomerProfile = asyncHandler(async (req, res) => {
  const profile = await GroomerProfile.findOne({ userId: req.user._id }).populate(
    "userId",
    "name email phone status profileImage address"
  );
  if (!profile) throw new ApiError(404, "Groomer profile not found");
  res.json({ success: true, profile });
});

export const updateMyGroomerProfile = asyncHandler(async (req, res) => {
  const profile = await GroomerProfile.findOne({ userId: req.user._id });
  if (!profile) throw new ApiError(404, "Groomer profile not found");

  for (const field of ["bio", "experience", "skills", "serviceAreas"]) {
    if (req.body[field] !== undefined) profile[field] = req.body[field];
  }
  await profile.save();
  res.json({ success: true, message: "Groomer profile updated", profile });
});

export const updateMyAvailability = asyncHandler(async (req, res) => {
  validateAvailability(req.body.availability);
  const profile = await GroomerProfile.findOne({ userId: req.user._id });
  if (!profile) throw new ApiError(404, "Groomer profile not found");

  profile.availability = req.body.availability;
  await profile.save();
  res.json({ success: true, message: "Availability updated", availability: profile.availability });
});

export const getAvailableGroomers = asyncHandler(async (req, res) => {
  const filter = { isActive: true };
  if (req.query.day) {
    filter.availability = { $elemMatch: { day: req.query.day, isAvailable: true } };
  }
  if (req.query.area) filter.serviceAreas = new RegExp(req.query.area, "i");

  const profiles = await GroomerProfile.find(filter).populate({
    path: "userId",
    match: { role: "groomer", status: "active", isVerified: true },
    select: "name phone profileImage",
  });

  res.json({ success: true, groomers: profiles.filter((profile) => profile.userId) });
});

export const ensureGroomerProfile = async (userId, data = {}) => {
  const user = await User.findOne({ _id: userId, role: "groomer" });
  if (!user) throw new ApiError(404, "Groomer not found");
  return GroomerProfile.findOneAndUpdate(
    { userId },
    {
      $setOnInsert: { userId },
      $set: {
        ...(data.bio !== undefined && { bio: data.bio }),
        ...(data.experience !== undefined && { experience: data.experience }),
        ...(data.skills !== undefined && { skills: data.skills }),
        ...(data.serviceAreas !== undefined && { serviceAreas: data.serviceAreas }),
        ...(data.availability !== undefined && { availability: data.availability }),
      },
    },
    { upsert: true, returnDocument: "after", runValidators: true }
  );
};
