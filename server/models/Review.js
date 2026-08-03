import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    reviewType: {
      type: String,
      enum: ["product", "vet", "groomer"],
      default: "product",
      required: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required() {
        return this.reviewType === "product";
      },
      default: null,
    },

    vetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "VetProfile",
      required() {
        return this.reviewType === "vet";
      },
      default: null,
    },

    groomerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required() {
        return this.reviewType === "groomer";
      },
      default: null,
    },

    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required() {
        return this.reviewType === "product";
      },
      default: null,
    },

    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      required() {
        return this.reviewType === "vet";
      },
      default: null,
    },

    groomingBookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GroomingBooking",
      required() {
        return this.reviewType === "groomer";
      },
      default: null,
    },

    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    comment: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 1000,
    },

    isVerifiedPurchase: {
      type: Boolean,
      default: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

reviewSchema.index(
  {
    userId: 1,
    productId: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      reviewType: "product",
      productId: { $type: "objectId" },
    },
  }
);

reviewSchema.index(
  {
    userId: 1,
    vetId: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      reviewType: "vet",
      vetId: { $type: "objectId" },
    },
  }
);

reviewSchema.index(
  {
    userId: 1,
    groomerId: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      reviewType: "groomer",
      groomerId: { $type: "objectId" },
    },
  }
);

reviewSchema.index({
  productId: 1,
  createdAt: -1,
});

reviewSchema.index({
  vetId: 1,
  createdAt: -1,
});

reviewSchema.index({
  groomerId: 1,
  createdAt: -1,
});

reviewSchema.index({
  rating: 1,
});

reviewSchema.index({
  isActive: 1,
});

export default mongoose.model("Review", reviewSchema);
