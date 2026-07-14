import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must contain at least 2 characters"],
      maxlength: [50, "Name cannot exceed 50 characters"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please enter a valid email address",
      ],
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must contain at least 8 characters"],
      select: false,
    },

    phone: {
      type: String,
      trim: true,
      default: "",
    },

    role: {
      type: String,
      enum: ["owner", "vet", "groomer", "admin"],
      default: "owner",
    },

    profileImage: {
      type: String,
      default: "",
    },

    address: {
      street: {
        type: String,
        default: "",
        trim: true,
      },
      city: {
        type: String,
        default: "",
        trim: true,
      },
      state: {
        type: String,
        default: "",
        trim: true,
      },
      postalCode: {
        type: String,
        default: "",
        trim: true,
      },
      country: {
        type: String,
        default: "India",
        trim: true,
      },
    },

    status: {
      type: String,
      enum: ["pending", "active", "inactive", "blocked", "rejected"],
      default: "active",
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    resetPasswordToken: {
      type: String,
      select: false,
    },

    resetPasswordExpire: {
      type: Date,
      select: false,
    },

    lastLogin: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

export default User;