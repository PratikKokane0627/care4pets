import mongoose from "mongoose";

const vetProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    qualification: {
      type: String,
      required: [true, "Qualification is required"],
      trim: true,
    },

    specialization: {
      type: String,
      required: [true, "Specialization is required"],
      enum: [
        "General Veterinary",
        "Surgery",
        "Dermatology",
        "Dentistry",
        "Cardiology",
        "Orthopedics",
        "Emergency Care",
        "Other",
      ],
    },

    experience: {
      type: Number,
      required: [true, "Experience is required"],
      min: [0, "Experience cannot be negative"],
    },

    registrationNumber: {
      type: String,
      required: [true, "Registration number is required"],
      unique: true,
      trim: true,
    },

    clinicName: {
      type: String,
      required: [true, "Clinic name is required"],
      trim: true,
    },

    clinicAddress: {
      street: {
        type: String,
        default: "",
        trim: true,
      },
      city: {
        type: String,
        required: true,
        trim: true,
      },
      state: {
        type: String,
        required: true,
        trim: true,
      },
      postalCode: {
        type: String,
        default: "",
        trim: true,
      },
    },

    consultationFee: {
      type: Number,
      required: [true, "Consultation fee is required"],
      min: [0, "Consultation fee cannot be negative"],
    },

    about: {
      type: String,
      default: "",
      maxlength: [1000, "About section cannot exceed 1000 characters"],
    },

    profileImage: {
      url: {
        type: String,
        default: "",
      },
      publicId: {
        type: String,
        default: "",
      },
    },

  availability: [
  {
    day: {
      type: String,
      enum: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
      required: true,
    },

    startTime: {
      type: String,
      required: true,
    },

    endTime: {
      type: String,
      required: true,
    },

    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
],

    availableTime: {
      start: {
        type: String,
        default: "09:00",
      },
      end: {
        type: String,
        default: "17:00",
      },
    },

    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    totalReviews: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "suspended"],
      default: "pending",
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const VetProfile = mongoose.model("VetProfile", vetProfileSchema);

export default VetProfile;