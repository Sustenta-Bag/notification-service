// src/routes/notification.routes.js
import { Router } from "express";
import NotificationController from "../controllers/notification.controller.js";

const router = Router();
const notificationController = new NotificationController();

// Health check endpoint
router.get('/health', (req, res) => notificationController.testConnection(req, res));

// Single notification endpoint
router.post('/', (req, res) => notificationController.sendSingleNotification(req, res));

// Bulk notification endpoint
router.post('/bulk', (req, res) => notificationController.sendBulkNotification(req, res));

// Root endpoint with HATEOAS links
router.get('/', (req, res) => {
  res.status(200).json({
    message: "Notification Service API",
    links: [
      {
        rel: "health",
        href: "/api/notifications/health",
        method: "GET",
        description: "Check service health"
      },
      {
        rel: "send-notification",
        href: "/api/notifications",
        method: "POST",
        description: "Send a single notification"
      },
      {
        rel: "send-bulk-notification",
        href: "/api/notifications/bulk",
        method: "POST",
        description: "Send bulk notifications"
      }
    ]
  });
});

export default router;
