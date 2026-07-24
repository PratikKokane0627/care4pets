import mongoose from "mongoose";
import Notification from "../models/notificationModel.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";

/*
--------------------------------------------------
GET MY NOTIFICATIONS
GET /api/notifications
--------------------------------------------------
*/
export const getMyNotifications = asyncHandler(
  async (req, res) => {
    const page = Math.max(
      Number.parseInt(req.query.page) || 1,
      1
    );

    const limit = Math.min(
      Math.max(
        Number.parseInt(req.query.limit) || 10,
        1
      ),
      50
    );

    const skip = (page - 1) * limit;

    const filter = {
      userId: req.user._id,
    };

    if (req.query.isRead === "true") {
      filter.isRead = true;
    }

    if (req.query.isRead === "false") {
      filter.isRead = false;
    }

    if (req.query.type) {
      filter.type = req.query.type;
    }

    const [
      notifications,
      totalNotifications,
      unreadCount,
    ] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      Notification.countDocuments(filter),

      Notification.countDocuments({
        userId: req.user._id,
        isRead: false,
      }),
    ]);

    res.status(200).json({
      success: true,
      currentPage: page,
      totalPages: Math.ceil(
        totalNotifications / limit
      ),
      totalNotifications,
      unreadCount,
      notifications,
    });
  }
);

/*
--------------------------------------------------
GET UNREAD NOTIFICATION COUNT
GET /api/notifications/unread-count
--------------------------------------------------
*/
export const getUnreadNotificationCount =
  asyncHandler(async (req, res) => {
    const unreadCount =
      await Notification.countDocuments({
        userId: req.user._id,
        isRead: false,
      });

    res.status(200).json({
      success: true,
      unreadCount,
    });
  });

/*
--------------------------------------------------
GET SINGLE NOTIFICATION
GET /api/notifications/:notificationId
--------------------------------------------------
*/
export const getNotificationById = asyncHandler(
  async (req, res) => {
    const { notificationId } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(notificationId)
    ) {
      throw new ApiError(400, "Invalid notification ID");
    }

    const notification =
      await Notification.findOne({
        _id: notificationId,
        userId: req.user._id,
      });

    if (!notification) {
      throw new ApiError(404, "Notification not found");
    }

    res.status(200).json({
      success: true,
      notification,
    });
  }
);

/*
--------------------------------------------------
MARK ONE NOTIFICATION AS READ
PATCH /api/notifications/:notificationId/read
--------------------------------------------------
*/
export const markNotificationAsRead =
  asyncHandler(async (req, res) => {
    const { notificationId } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(notificationId)
    ) {
      throw new ApiError(400, "Invalid notification ID");
    }

    const notification =
      await Notification.findOne({
        _id: notificationId,
        userId: req.user._id,
      });

    if (!notification) {
      throw new ApiError(404, "Notification not found");
    }

    if (!notification.isRead) {
      notification.isRead = true;
      notification.readAt = new Date();

      await notification.save();
    }

    res.status(200).json({
      success: true,
      message: "Notification marked as read",
      notification,
    });
  });

/*
--------------------------------------------------
MARK ALL NOTIFICATIONS AS READ
PATCH /api/notifications/read-all
--------------------------------------------------
*/
export const markAllNotificationsAsRead =
  asyncHandler(async (req, res) => {
    const result = await Notification.updateMany(
      {
        userId: req.user._id,
        isRead: false,
      },
      {
        $set: {
          isRead: true,
          readAt: new Date(),
        },
      }
    );

    res.status(200).json({
      success: true,
      message: "All notifications marked as read",
      modifiedCount: result.modifiedCount,
    });
  });

/*
--------------------------------------------------
DELETE ONE NOTIFICATION
DELETE /api/notifications/:notificationId
--------------------------------------------------
*/
export const deleteNotification = asyncHandler(
  async (req, res) => {
    const { notificationId } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(notificationId)
    ) {
      throw new ApiError(400, "Invalid notification ID");
    }

    const notification =
      await Notification.findOneAndDelete({
        _id: notificationId,
        userId: req.user._id,
      });

    if (!notification) {
      throw new ApiError(404, "Notification not found");
    }

    res.status(200).json({
      success: true,
      message: "Notification deleted successfully",
    });
  }
);

/*
--------------------------------------------------
DELETE ALL NOTIFICATIONS
DELETE /api/notifications
--------------------------------------------------
*/
export const deleteAllNotifications =
  asyncHandler(async (req, res) => {
    const result = await Notification.deleteMany({
      userId: req.user._id,
    });

    res.status(200).json({
      success: true,
      message: "All notifications deleted successfully",
      deletedCount: result.deletedCount,
    });
  });
