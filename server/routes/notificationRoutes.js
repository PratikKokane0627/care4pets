import express from "express";

import {
  deleteAllNotifications,
  deleteNotification,
  getMyNotifications,
  getNotificationById,
  getUnreadNotificationCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../controllers/notificationController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/", getMyNotifications);
router.get("/unread-count", getUnreadNotificationCount);
router.patch("/read-all", markAllNotificationsAsRead);
router.get("/:notificationId", getNotificationById);
router.patch("/:notificationId/read", markNotificationAsRead);
router.delete("/", deleteAllNotifications);
router.delete("/:notificationId", deleteNotification);

export default router;
