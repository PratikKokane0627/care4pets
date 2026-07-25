import mongoose from "mongoose";

const availabilitySchema = new mongoose.Schema(
  {
    day: {
      type: String,
      enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      required: true,
    },
    startTime: { type: String, required: true, match: /^([01]\d|2[0-3]):[0-5]\d$/ },
    endTime: { type: String, required: true, match: /^([01]\d|2[0-3]):[0-5]\d$/ },
    isAvailable: { type: Boolean, default: true },
  },
  { _id: false }
);

const groomerProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    bio: { type: String, trim: true, maxlength: 1000, default: "" },
    experience: { type: Number, min: 0, default: 0 },
    skills: [{ type: String, trim: true }],
    serviceAreas: [{ type: String, trim: true }],
    availability: [availabilitySchema],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("GroomerProfile", groomerProfileSchema);
