import Appointment from "../models/Appointment.js";
import Cart from "../models/Cart.js";
import GroomerProfile from "../models/GroomerProfile.js";
import GroomingBooking from "../models/GroomingBooking.js";
// Notification code temporarily disabled.
// import Notification from "../models/notificationModel.js";
import Order from "../models/Order.js";
import Pet from "../models/Pet.js";
import Product from "../models/Product.js";
import Review from "../models/Review.js";
import User from "../models/User.js";
import Vaccination from "../models/Vaccination.js";
import VetProfile from "../models/VetProfile.js";
import Wishlist from "../models/Wishlist.js";

export const deleteAccountData = async (user) => {
  const vetProfile =
    user.role === "vet" ? await VetProfile.findOne({ userId: user._id }) : null;
  const reviewedProductIds = await Review.distinct("productId", { userId: user._id });

  await Promise.all([
    Cart.deleteMany({ userId: user._id }),
    Wishlist.deleteMany({ userId: user._id }),
    Review.deleteMany({ userId: user._id }),
    // Notification code temporarily disabled.
    // Notification.deleteMany({ userId: user._id }),
    Order.deleteMany({ userId: user._id }),
    Vaccination.deleteMany({
      $or: [
        { ownerId: user._id },
        ...(vetProfile ? [{ veterinarian: vetProfile._id }] : []),
      ],
    }),
    Appointment.deleteMany({
      $or: [
        { ownerId: user._id },
        ...(vetProfile ? [{ vetId: vetProfile._id }] : []),
      ],
    }),
    GroomingBooking.deleteMany({ ownerId: user._id }),
    GroomingBooking.updateMany(
      { groomerId: user._id },
      { $set: { groomerId: null, status: "pending" } }
    ),
    Pet.deleteMany({ ownerId: user._id }),
    VetProfile.deleteMany({ userId: user._id }),
    GroomerProfile.deleteMany({ userId: user._id }),
  ]);

  await Promise.all(
    reviewedProductIds.map(async (productId) => {
      const stats = await Review.aggregate([
        { $match: { productId, isActive: true } },
        { $group: { _id: null, averageRating: { $avg: "$rating" }, totalReviews: { $sum: 1 } } },
      ]);
      await Product.updateOne(
        { _id: productId },
        {
          averageRating: stats[0] ? Number(stats[0].averageRating.toFixed(1)) : 0,
          totalReviews: stats[0]?.totalReviews || 0,
        }
      );
    })
  );

  await User.deleteOne({ _id: user._id });
};

export default deleteAccountData;
