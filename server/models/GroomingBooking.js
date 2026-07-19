import mongoose from "mongoose";

const groomingBookingSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    petId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pet",
      required: true,
      index: true,
    },

    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GroomingService",
      required: true,
      index: true,
    },

    groomerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    bookingDate: {
      type: Date,
      required: true,
      index: true,
    },

    bookingTime: {
      type: String,
      required: true,
      trim: true,
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
      index: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    duration: {
      type: Number,
      required: true,
      min: 1,
    },

    specialInstructions: {
      type: String,
      trim: true,
      default: "",
    },

    rejectionReason: {
      type: String,
      trim: true,
      default: "",
    },

    groomerNotes: {
      type: String,
      trim: true,
      default: "",
    },

    completedAt: {
      type: Date,
      default: null,
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

groomingBookingSchema.index({
  ownerId: 1,
  bookingDate: -1,
});

groomingBookingSchema.index({
  groomerId: 1,
  bookingDate: 1,
  bookingTime: 1,
});

export default mongoose.model(
  "GroomingBooking",
  groomingBookingSchema
);