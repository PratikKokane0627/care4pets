import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import uploadToCloudinary from "../utils/uploadToCloudinary.js";
import deleteUploadedImage from "../utils/deleteUploadedImage.js";
import User from "../models/User.js";
import VetProfile from "../models/VetProfile.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";

const normalizeAvailability = (availability = []) => {
  if (!Array.isArray(availability)) {
    throw new ApiError(400, "Availability must be an array");
  }

  const allowedDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const seen = new Set();
  const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

  return availability.map((slot) => {
    if (!allowedDays.includes(slot.day)) {
      throw new ApiError(400, "Invalid availability day");
    }
    if (seen.has(slot.day)) {
      throw new ApiError(400, "Duplicate availability days are not allowed");
    }
    seen.add(slot.day);
    if (!timePattern.test(slot.startTime) || !timePattern.test(slot.endTime)) {
      throw new ApiError(400, "Availability times must use HH:mm format");
    }
    if (slot.isAvailable !== false && slot.endTime <= slot.startTime) {
      throw new ApiError(400, "Availability end time must be later than start time");
    }

    return {
      day: slot.day,
      startTime: slot.startTime,
      endTime: slot.endTime,
      isAvailable: slot.isAvailable ?? true,
    };
  });
};

const populateVet = (query) =>
  query.populate("userId", "name email phone role status profileImage address createdAt");

const getOwnVetProfileOrThrow = async (userId) => {
  const vet = await VetProfile.findOne({ userId }).populate(
    "userId",
    "name email phone role status profileImage address createdAt"
  );
  if (!vet) throw new ApiError(404, "Veterinarian profile not found");
  return vet;
};

const assignEditableVetFields = async (vet, user, body) => {
  const stringFields = ["qualification", "specialization", "clinicName", "about"];
  stringFields.forEach((field) => {
    if (body[field] !== undefined) vet[field] = String(body[field]).trim();
  });

  if (body.experience !== undefined) {
    const experience = Number(body.experience);
    if (!Number.isFinite(experience) || experience < 0) {
      throw new ApiError(400, "Experience must be greater than or equal to 0");
    }
    vet.experience = experience;
  }

  if (body.consultationFee !== undefined) {
    const consultationFee = Number(body.consultationFee);
    if (!Number.isFinite(consultationFee) || consultationFee < 0) {
      throw new ApiError(400, "Consultation fee must be greater than or equal to 0");
    }
    vet.consultationFee = consultationFee;
  }

  if (body.clinicAddress) {
    vet.clinicAddress = {
      ...vet.clinicAddress.toObject(),
      ...body.clinicAddress,
    };
  }

  if (body.availability !== undefined) {
    vet.availability = normalizeAvailability(body.availability);
  }

  if (body.name !== undefined) user.name = String(body.name).trim();
  if (body.phone !== undefined) user.phone = String(body.phone).trim();
  if (body.email !== undefined) {
    const email = String(body.email).toLowerCase().trim();
    const exists = await User.exists({ email, _id: { $ne: user._id } });
    if (exists) throw new ApiError(409, "User with this email already exists");
    user.email = email;
    user.isVerified = true;
  }
};

export const applyAsVet = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    phone,
    password,
    qualification,
    specialization,
    experience,
    registrationNumber,
    clinicName,
    clinicAddress,
    consultationFee,
    about,
    availability,
  } = req.body;

  if (
    !name || !email || !phone || !password || !qualification ||
    !specialization || experience === undefined || !registrationNumber ||
    !clinicName || !clinicAddress?.city || !clinicAddress?.state ||
    consultationFee === undefined
  ) {
    throw new ApiError(400, "All required veterinarian fields must be provided");
  }
  if (password.length < 8) {
    throw new ApiError(400, "Password must contain at least 8 characters");
  }

  const normalizedEmail = email.toLowerCase().trim();
  if (await User.exists({ email: normalizedEmail })) {
    throw new ApiError(409, "User with this email already exists");
  }
  if (await VetProfile.exists({ registrationNumber: registrationNumber.trim() })) {
    throw new ApiError(409, "Veterinarian registration number already exists");
  }

  const vetUser = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    phone,
    password: await bcrypt.hash(password, 10),
    role: "vet",
    status: "pending",
    // Email verification before login temporarily disabled.
    // isVerified: false,
    isVerified: true,
  });

  try {
    const vet = await VetProfile.create({
      userId: vetUser._id,
      qualification,
      specialization,
      experience,
      registrationNumber: registrationNumber.trim(),
      clinicName,
      clinicAddress,
      consultationFee,
      about,
      availability: normalizeAvailability(availability),
      status: "pending",
      isActive: false,
    });

    res.status(201).json({
      success: true,
      message: "Veterinarian application submitted. Await administrator approval",
      application: {
        id: vet._id,
        email: vetUser.email,
        status: vet.status,
      },
    });
  } catch (error) {
    await User.findByIdAndDelete(vetUser._id);
    throw error;
  }
});

export const createVet = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    phone,
    password,
    qualification,
    specialization,
    experience,
    registrationNumber,
    clinicName,
    clinicAddress,
    consultationFee,
    about,
    availability,
    availableTime,
  } = req.body;

  if (
    !name ||
    !email ||
    !phone ||
    !password ||
    !qualification ||
    !specialization ||
    experience === undefined ||
    !registrationNumber ||
    !clinicName ||
    !clinicAddress?.city ||
    !clinicAddress?.state ||
    consultationFee === undefined
  ) {
    throw new ApiError(400, "All required veterinarian fields must be provided");
  }

  if (password.length < 8) {
    throw new ApiError(
      400,
      "Password must contain at least 8 characters"
    );
  }

  const normalizedEmail = email.toLowerCase().trim();

  const existingUser = await User.findOne({
    email: normalizedEmail,
  });

  if (existingUser) {
    throw new ApiError(409, "User with this email already exists");
  }

  const existingRegistration = await VetProfile.findOne({
    registrationNumber: registrationNumber.trim(),
  });

  if (existingRegistration) {
    throw new ApiError(
      409,
      "Veterinarian registration number already exists"
    );
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const vetUser = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    phone,
    password: hashedPassword,
    role: "vet",
    status: "active",
    isVerified: true,
  });

  try {
    const vetProfile = await VetProfile.create({
      userId: vetUser._id,
      qualification,
      specialization,
      experience,
      registrationNumber: registrationNumber.trim(),
      clinicName,
      clinicAddress,
      consultationFee,
      about,
      availability: normalizeAvailability(availability),
      availableTime,
      status: "approved",
      isActive: true,
    });

    const populatedVet = await VetProfile.findById(vetProfile._id).populate(
      "userId",
      "name email phone role status profileImage"
    );

    res.status(201).json({
      success: true,
      message: "Veterinarian created successfully",
      vet: populatedVet,
    });
  } catch (error) {
    // Roll back the User document if VetProfile creation fails
    await User.findByIdAndDelete(vetUser._id);
    throw error;
  }
});



export const getAllVets = asyncHandler(async (req, res) => {
  const {
    search,
    specialization,
    city,
    minExperience,
    maxFee,
    minRating,
    availableDay,
    sort = "newest",
    page = 1,
    limit = 10,
  } = req.query;

  const pageNumber = Math.max(Number(page) || 1, 1);
  const limitNumber = Math.min(Math.max(Number(limit) || 10, 1), 50);
  const skip = (pageNumber - 1) * limitNumber;

  const profileFilter = {
    status: "approved",
    isActive: true,
  };

  if (specialization) {
    profileFilter.specialization = specialization;
  }

  if (city) {
    profileFilter["clinicAddress.city"] = {
      $regex: city.trim(),
      $options: "i",
    };
  }

  if (minExperience !== undefined) {
    const experienceValue = Number(minExperience);

    if (Number.isNaN(experienceValue) || experienceValue < 0) {
      throw new ApiError(400, "Minimum experience must be a valid number");
    }

    profileFilter.experience = {
      $gte: experienceValue,
    };
  }

  if (maxFee !== undefined) {
    const feeValue = Number(maxFee);

    if (Number.isNaN(feeValue) || feeValue < 0) {
      throw new ApiError(400, "Maximum fee must be a valid number");
    }

    profileFilter.consultationFee = {
      $lte: feeValue,
    };
  }

  if (minRating !== undefined) {
    const ratingValue = Number(minRating);

    if (
      Number.isNaN(ratingValue) ||
      ratingValue < 0 ||
      ratingValue > 5
    ) {
      throw new ApiError(
        400,
        "Minimum rating must be between 0 and 5"
      );
    }

    profileFilter.averageRating = {
      $gte: ratingValue,
    };
  }

  if (availableDay) {
    profileFilter.availability = {
      $elemMatch: { day: availableDay, isAvailable: true },
    };
  }

  const userFilter = {
    role: "vet",
    status: "active",
  };

  if (search?.trim()) {
    const searchRegex = {
      $regex: search.trim(),
      $options: "i",
    };

    const matchingUsers = await User.find({
      ...userFilter,
      name: searchRegex,
    }).select("_id");

    const matchingUserIds = matchingUsers.map((user) => user._id);

    profileFilter.$or = [
      {
        userId: {
          $in: matchingUserIds,
        },
      },
      {
        clinicName: searchRegex,
      },
      {
        qualification: searchRegex,
      },
      {
        specialization: searchRegex,
      },
    ];
  }

  const sortOptions = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    rating: { averageRating: -1 },
    experience: { experience: -1 },
    feeLowToHigh: { consultationFee: 1 },
    feeHighToLow: { consultationFee: -1 },
  };

  const selectedSort = sortOptions[sort] || sortOptions.newest;

  const vets = await VetProfile.find(profileFilter)
    .populate({
      path: "userId",
      select: "name email phone role status profileImage address",
      match: userFilter,
    })
    .sort(selectedSort)
    .skip(skip)
    .limit(limitNumber);

  const filteredVets = vets.filter((vet) => vet.userId);

  const total = await VetProfile.countDocuments(profileFilter);

  res.status(200).json({
    success: true,
    message: "Veterinarians fetched successfully",
    count: filteredVets.length,
    pagination: {
      currentPage: pageNumber,
      totalPages: Math.ceil(total / limitNumber),
      totalVets: total,
      limit: limitNumber,
    },
    vets: filteredVets,
  });
});


export const getVetById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid veterinarian ID");
  }

  const vet = await VetProfile.findOne({
    _id: id,
    status: "approved",
    isActive: true,
  }).populate({
    path: "userId",
    select: "name email phone role status profileImage address",
    match: {
      role: "vet",
      status: "active",
    },
  });

  if (!vet || !vet.userId) {
    throw new ApiError(404, "Veterinarian not found");
  }

  res.status(200).json({
    success: true,
    message: "Veterinarian fetched successfully",
    vet,
  });
});

export const getMyVetProfile = asyncHandler(async (req, res) => {
  const vet = await getOwnVetProfileOrThrow(req.user._id);
  res.json({ success: true, message: "Veterinarian profile fetched successfully", vet });
});

export const updateMyVetProfile = asyncHandler(async (req, res) => {
  const vet = await VetProfile.findOne({ userId: req.user._id });
  if (!vet) throw new ApiError(404, "Veterinarian profile not found");

  const user = await User.findById(req.user._id);
  await assignEditableVetFields(vet, user, req.body || {});
  await Promise.all([vet.save(), user.save()]);

  const updatedVet = await populateVet(VetProfile.findById(vet._id));
  res.json({ success: true, message: "Veterinarian profile updated successfully", vet: updatedVet });
});

export const updateMyVetAvailability = asyncHandler(async (req, res) => {
  const vet = await VetProfile.findOne({ userId: req.user._id });
  if (!vet) throw new ApiError(404, "Veterinarian profile not found");

  vet.availability = normalizeAvailability(req.body.availability);
  await vet.save();

  res.json({ success: true, message: "Availability updated", availability: vet.availability });
});

export const uploadMyVetImage = asyncHandler(async (req, res) => {
  const vet = await VetProfile.findOne({ userId: req.user._id });
  if (!vet) throw new ApiError(404, "Veterinarian profile not found");
  if (!req.file) throw new ApiError(400, "Please upload an image");

  const oldPublicId = vet.profileImage?.publicId;
  const result = await uploadToCloudinary(
    req.file.buffer,
    "care4pets/vets",
    req.file.mimetype
  );

  try {
    vet.profileImage = { url: result.secure_url, publicId: result.public_id };
    await vet.save();
  } catch (error) {
    await deleteUploadedImage(result.public_id);
    throw error;
  }

  if (oldPublicId) await deleteUploadedImage(oldPublicId);

  res.json({
    success: true,
    message: "Veterinarian image uploaded successfully",
    image: vet.profileImage,
    vet,
  });
});

export const deleteMyVetImage = asyncHandler(async (req, res) => {
  const vet = await VetProfile.findOne({ userId: req.user._id });
  if (!vet) throw new ApiError(404, "Veterinarian profile not found");

  if (vet.profileImage?.publicId) {
    await deleteUploadedImage(vet.profileImage.publicId);
  }

  vet.profileImage = { url: "", publicId: "" };
  await vet.save();

  res.json({
    success: true,
    message: "Veterinarian image deleted successfully",
    image: vet.profileImage,
    vet,
  });
});
export const updateVet = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid veterinarian ID");
  }

  const vet = await VetProfile.findOne({
    _id: id,
    isActive: true,
  });

  if (!vet) {
    throw new ApiError(404, "Veterinarian not found");
  }

  const isAdmin = req.user.role === "admin";

  const isProfileOwner =
    req.user.role === "vet" &&
    vet.userId.toString() === req.user._id.toString();

  if (!isAdmin && !isProfileOwner) {
    throw new ApiError(
      403,
      "You are not authorized to update this veterinarian profile"
    );
  }

  const allowedFields = [
    "qualification",
    "specialization",
    "experience",
    "clinicName",
    "consultationFee",
    "about",
    "availability",
  ];

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      vet[field] = req.body[field];
    }
  });

  if (req.body.clinicAddress) {
    vet.clinicAddress = {
      ...vet.clinicAddress.toObject(),
      ...req.body.clinicAddress,
    };
  }

  if (req.body.availableTime) {
    vet.availableTime = {
      ...vet.availableTime.toObject(),
      ...req.body.availableTime,
    };
  }

  // Only admin can change status fields
  if (isAdmin) {
    if (req.body.status !== undefined) {
      vet.status = req.body.status;
    }

    if (req.body.isActive !== undefined) {
      vet.isActive = req.body.isActive;
    }
  }

  await vet.save();

  const updatedVet = await VetProfile.findById(vet._id).populate(
    "userId",
    "name email phone role status profileImage address"
  );

  res.status(200).json({
    success: true,
    message: "Veterinarian profile updated successfully",
    vet: updatedVet,
  });
});


export const uploadVetImage = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid veterinarian ID");
  }

  const vet = await VetProfile.findOne({
    _id: id,
    isActive: true,
  });

  if (!vet) {
    throw new ApiError(404, "Veterinarian not found");
  }

  const isAdmin = req.user.role === "admin";

  const isProfileOwner =
    req.user.role === "vet" &&
    vet.userId.toString() === req.user._id.toString();

  if (!isAdmin && !isProfileOwner) {
    throw new ApiError(
      403,
      "You are not authorized to update this veterinarian image"
    );
  }

  if (!req.file) {
    throw new ApiError(400, "Please upload an image");
  }

  const oldPublicId = vet.profileImage?.publicId;

  const result = await uploadToCloudinary(
    req.file.buffer,
    "care4pets/vets",
    req.file.mimetype
  );

  try {
    vet.profileImage = {
      url: result.secure_url,
      publicId: result.public_id,
    };

    await vet.save();
  } catch (error) {
    await deleteUploadedImage(result.public_id);
    throw error;
  }

  if (oldPublicId) {
    await deleteUploadedImage(oldPublicId);
  }

  res.status(200).json({
    success: true,
    message: "Veterinarian image uploaded successfully",
    image: vet.profileImage,
    vet,
  });
});


export const updateAvailability = asyncHandler(async (req, res) => {

  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid veterinarian ID");
  }

  const vet = await VetProfile.findById(id);

  if (!vet) {
    throw new ApiError(404, "Veterinarian not found");
  }

  const isAdmin = req.user.role === "admin";

  const isOwner =
    req.user.role === "vet" &&
    vet.userId.toString() === req.user._id.toString();

  if (!isAdmin && !isOwner) {
    throw new ApiError(
      403,
      "Unauthorized"
    );
  }

  vet.availability = normalizeAvailability(req.body.availability);

  await vet.save();

  res.json({
    success:true,
    message:"Availability updated",
    availability:vet.availability
  });

});

export const getAvailability = asyncHandler(async(req,res)=>{

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        throw new ApiError(400, "Invalid veterinarian ID");
    }

    const vet=await VetProfile.findById(req.params.id)
    .select("availability");

    if(!vet){
        throw new ApiError(
            404,
            "Veterinarian not found"
        );
    }

    res.json({

        success:true,

        availability:vet.availability

    });

});
