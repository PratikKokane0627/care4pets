import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    productName: {
      type: String,
      required: true,
      trim: true,
    },

    image: {
      type: String,
      default: "",
    },

    quantity: {
      type: Number,
      required: true,
      min: [1, "Quantity must be at least 1"],
    },

    price: {
      type: Number,
      required: true,
      min: [0, "Price cannot be negative"],
    },

    totalPrice: {
      type: Number,
      required: true,
      min: [0, "Total price cannot be negative"],
    },
  },
  {
    _id: false,
  }
);

const shippingAddressSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
    },

    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },

    address: {
      type: String,
      required: [true, "Address is required"],
      trim: true,
    },

    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
    },

    state: {
      type: String,
      required: [true, "State is required"],
      trim: true,
    },

    postalCode: {
      type: String,
      required: [true, "Postal code is required"],
      trim: true,
    },

    country: {
      type: String,
      required: true,
      trim: true,
      default: "India",
    },
  },
  {
    _id: false,
  }
);

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator(items) {
          return Array.isArray(items) && items.length > 0;
        },
        message: "Order must contain at least one item",
      },
    },

    shippingAddress: {
      type: shippingAddressSchema,
      required: true,
    },

    totalItems: {
      type: Number,
      required: true,
      min: [1, "Total items must be at least 1"],
    },

    subtotal: {
      type: Number,
      required: true,
      min: [0, "Subtotal cannot be negative"],
    },

    shippingCharge: {
      type: Number,
      default: 0,
      min: [0, "Shipping charge cannot be negative"],
    },

    tax: {
      type: Number,
      default: 0,
      min: [0, "Tax cannot be negative"],
    },

    totalAmount: {
      type: Number,
      required: true,
      min: [0, "Total amount cannot be negative"],
    },

    paymentMethod: {
      type: String,
      enum: ["COD", "ONLINE"],
      default: "COD",
    },

    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Failed", "Refunded"],
      default: "Pending",
    },

    razorpayOrderId: {
      type: String,
      default: null,
    },

    razorpayPaymentId: {
      type: String,
      default: null,
    },

    razorpaySignature: {
      type: String,
      default: null,
      select: false,
    },

    paidAt: {
      type: Date,
      default: null,
    },

    failedAt: {
      type: Date,
      default: null,
    },

    refundedAt: {
      type: Date,
      default: null,
    },

    refundId: {
      type: String,
      default: null,
    },

    refundAmount: {
      type: Number,
      default: 0,
      min: [0, "Refund amount cannot be negative"],
    },

    paymentFailureReason: {
      type: String,
      default: null,
      trim: true,
    },

    orderStatus: {
      type: String,
      enum: [
        "Pending",
        "Confirmed",
        "Packed",
        "Shipped",
        "Out for Delivery",
        "Delivered",
        "Cancelled",
      ],
      default: "Pending",
    },

    deliveredAt: {
      type: Date,
      default: null,
    },

    cancelledAt: {
      type: Date,
      default: null,
    },

    cancellationReason: {
      type: String,
      default: null,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

orderSchema.pre("validate", function () {
  if (!this.items || this.items.length === 0) {
    return;
  }

  this.totalItems = this.items.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  this.subtotal = this.items.reduce(
    (sum, item) => sum + item.totalPrice,
    0
  );

  this.totalAmount =
    this.subtotal +
    (this.shippingCharge || 0) +
    (this.tax || 0);
});

orderSchema.index({
  userId: 1,
  createdAt: -1,
});

orderSchema.index({
  orderStatus: 1,
  createdAt: -1,
});

orderSchema.index({
  paymentStatus: 1,
  paymentMethod: 1,
});

orderSchema.index(
  {
    razorpayOrderId: 1,
  },
  {
    unique: true,
    sparse: true,
  }
);

orderSchema.index(
  {
    razorpayPaymentId: 1,
  },
  {
    unique: true,
    sparse: true,
  }
);

const Order = mongoose.model("Order", orderSchema);

export default Order;