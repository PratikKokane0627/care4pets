import Notification from "../models/notificationModel.js";
import User from "../models/User.js";

export const notifyAdmins = async ({
  title,
  message,
  type = "System",
  referenceId = null,
  referenceModel = null,
}) => {
  const admins = await User.find({
    role: "admin",
    status: "active",
  }).select("_id").lean();

  if (!admins.length) return;

  await Notification.insertMany(
    admins.map((admin) => ({
      userId: admin._id,
      title,
      message,
      type,
      referenceId,
      referenceModel,
    })),
    { ordered: false }
  );
};
