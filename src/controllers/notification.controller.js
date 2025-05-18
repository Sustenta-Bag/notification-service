// src/controllers/notification.controller.js
import NotificationService from "../services/notification.service.js";

export default class NotificationController {
  constructor() {
    this.notificationService = new NotificationService();
  }

  async sendSingleNotification(req, res) {
    try {
      const { token, notification, data } = req.body;

      if (!token || !notification || !notification.title) {
        return res.status(400).json({
          success: false, 
          error: "Missing required fields",
          links: [
            {
              rel: "self",
              href: "/api/notifications",
              method: "POST"
            }
          ]
        });
      }

      const result = await this.notificationService.processSingleNotification(
        token,
        notification,
        data
      );

      return res.status(200).json({
        success: true,
        data: result,
        links: [
          {
            rel: "self",
            href: `/api/notifications/${result.messageId}`,
            method: "GET"
          },
          {
            rel: "send-notification",
            href: "/api/notifications",
            method: "POST"
          },
          {
            rel: "send-bulk-notification",
            href: "/api/notifications/bulk",
            method: "POST"
          }
        ]
      });
    } catch (error) {
      return res.status(500).json({
        success: false, 
        error: error.message,
        links: [
          {
            rel: "self",
            href: "/api/notifications",
            method: "POST"
          }
        ]
      });
    }
  }

  async sendBulkNotification(req, res) {
    try {
      const { tokens, notification, data } = req.body;

      if (!tokens || !Array.isArray(tokens) || tokens.length === 0 || !notification || !notification.title) {
        return res.status(400).json({
          success: false, 
          error: "Missing required fields or invalid tokens array",
          links: [
            {
              rel: "self",
              href: "/api/notifications/bulk",
              method: "POST"
            }
          ]
        });
      }

      const result = await this.notificationService.processBulkNotification(
        tokens,
        notification,
        data
      );

      return res.status(200).json({
        success: true,
        data: result,
        links: [
          {
            rel: "self",
            href: "/api/notifications/bulk",
            method: "GET"
          },
          {
            rel: "send-notification",
            href: "/api/notifications",
            method: "POST"
          }
        ]
      });
    } catch (error) {
      return res.status(500).json({
        success: false, 
        error: error.message,
        links: [
          {
            rel: "self",
            href: "/api/notifications/bulk",
            method: "POST"
          }
        ]
      });
    }
  }

  async testConnection(req, res) {
    try {
      return res.status(200).json({
        success: true,
        message: "Notification service is up and running",
        links: [
          {
            rel: "self",
            href: "/api/notifications/health",
            method: "GET"
          },
          {
            rel: "send-notification",
            href: "/api/notifications",
            method: "POST"
          },
          {
            rel: "send-bulk-notification",
            href: "/api/notifications/bulk",
            method: "POST"
          }
        ]
      });
    } catch (error) {
      return res.status(500).json({
        success: false, 
        error: error.message,
        links: [
          {
            rel: "self",
            href: "/api/notifications/health",
            method: "GET"
          }
        ]
      });
    }
  }
}
