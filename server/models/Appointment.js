import mongoose from "mongoose";


const appointmentSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    petId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pet",
      required: true,
    },

    vetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "VetProfile",
      required: true,
    },

    appointmentDate: {
      type: Date,
      required: true,
    },

    appointmentTime: {
      type: String,
      required: true,
    },

    reason: {
      type: String,
      required: true,
      trim: true,
    },

    symptoms: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: [
        "pending",
        "accepted",
        "rejected",
        "cancelled",
        "completed",
      ],
      default: "pending",
    },

    diagnosis: {
      type: String,
      default: "",
    },

    prescription: {
      type: String,
      default: "",
    },

    notes: {
      type: String,
      default: "",
    },

    consultationFee: {
      type: Number,
      required: true,
    },

    paymentStatus: {
      type: String,
      enum: [
        "pending",
        "paid",
        "failed",
      ],
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
// Add index only after appointmentSchema is created
appointmentSchema.index({
  vetId: 1,
  appointmentDate: 1,
  appointmentTime: 1,
});


const Appointment = mongoose.model(
  "Appointment",
  appointmentSchema
);

export default Appointment;