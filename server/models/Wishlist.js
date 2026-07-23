import mongoose from "mongoose";

const wishlistSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

wishlistSchema.index(
  {
    userId: 1,
    productId: 1,
  },
  {
    unique: true,
  }
);

wishlistSchema.index({
  userId: 1,
  createdAt: -1,
});

wishlistSchema.index({
  productId: 1,
});

export default mongoose.model(
  "Wishlist",
  wishlistSchema
);