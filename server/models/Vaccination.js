import mongoose from "mongoose";

const vaccinationSchema = new mongoose.Schema(
  {
    petId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pet",
      required: true,
    },

    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    vaccineName: {
      type: String,
      required: true,
      trim: true,
    },

    doseNumber: {
      type: Number,
      default: 1,
    },

    vaccinationDate: {
      type: Date,
      required: true,
    },

    nextDueDate: {
      type: Date,
      required: true,
    },

    veterinarian: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "VetProfile",
    },

    clinicName: {
      type: String,
      trim: true,
    },

    notes: {
      type: String,
      trim: true,
    },

    status: {
      type: String,
      enum: ["upcoming", "completed", "overdue"],
      default: "completed",
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

vaccinationSchema.index({
  petId: 1,
  vaccinationDate: -1,
});

export default mongoose.model("Vaccination", vaccinationSchema);