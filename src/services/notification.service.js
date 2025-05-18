// src/services/notification.service.js
import colors from "colors";
import { sendSingleNotification, sendBulkNotifications } from "./firebase.js";

export default class NotificationService {
  async processSingleNotification(token, notification, data) {
    try {
      console.log(colors.cyan("Processing single notification:"), {
        to: token.substring(0, 16) + '...',
        title: notification?.title,
        type: data?.type || "UNKNOWN",
      });

      if (!token || !notification) {
        throw new Error("Incomplete notification data");
      }

      const result = await sendSingleNotification(
        token,
        {
          title: notification.title,
          body: notification.body,
        },
        data?.payload
      );

      console.log(
        colors.green(`Notification successfully sent to Firebase`)
      );
      console.log(
        colors.blue(`Firebase response: ${JSON.stringify(result)}`)
      );

      console.log(colors.green(`Notification processed successfully`));
      console.log(colors.blue(`Title: ${notification.title}`));
      console.log(colors.blue(`Content: ${notification.body}`));
      
      return {
        success: result.success,
        messageId: result.messageId,
        links: [
          {
            rel: "self",
            href: `/api/notifications/${result.messageId}`,
            method: "GET"
          }
        ]
      };
    } catch (error) {
      console.error(colors.red("Error processing notification:"), error);
      throw error;
    }
  }

  async processBulkNotification(tokens, notification, data) {
    try {
      console.log(colors.cyan("Processing bulk notification:"), {
        to: `${tokens.length} tokens`,
        title: notification?.title,
        type: data?.type || "bulk",
      });

      if (!tokens || !tokens.length || !notification) {
        throw new Error("Incomplete notification data");
      }

      if (!Array.isArray(tokens)) {
        throw new Error(
          'For bulk notifications, "to" must be an array of tokens'
        );
      }

      const result = await sendBulkNotifications(
        tokens,
        {
          title: notification.title,
          body: notification.body,
        },
        data?.payload
      );

      console.log(
        colors.cyan(
          `Bulk notification complete. Success: ${result.successCount}, Failures: ${result.failureCount}`
        )
      );

      return {
        success: result.success,
        successCount: result.successCount,
        failureCount: result.failureCount,
        links: [
          {
            rel: "self",
            href: "/api/notifications/bulk",
            method: "GET"
          }
        ]
      };
    } catch (error) {
      console.error(colors.red("Error processing bulk notification:"), error);
      throw error;
    }
  }
}
