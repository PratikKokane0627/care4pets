import express from "express";

import {
  getMyNotifications,
  getUnreadNotificationCount,
  getNotificationById,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  deleteAllNotifications,
} from "../controllers/notificationController.js";

import {
  protect,
} from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

// GET /api/notifications
router.get("/", getMyNotifications);

// GET /api/notifications/unread-count
router.get(
  "/unread-count",
  getUnreadNotificationCount
);

// PATCH /api/notifications/read-all
router.patch(
  "/read-all",
  markAllNotificationsAsRead
);

// GET /api/notifications/:notificationId
router.get(
  "/:notificationId",
  getNotificationById
);

// PATCH /api/notifications/:notificationId/read
router.patch(
  "/:notificationId/read",
  markNotificationAsRead
);

// DELETE /api/notifications
router.delete(
  "/",
  deleteAllNotifications
);

// DELETE /api/notifications/:notificationId
router.delete(
  "/:notificationId",
  deleteNotification
);

export default router;
