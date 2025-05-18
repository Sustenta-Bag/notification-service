// src/services/rabbitmq/consumer.service.js
import colors from "colors";
import connect from "./connection.js";
import NotificationService from "../notification.service.js";

export default class ConsumerService {
  constructor() {
    this.notificationService = new NotificationService();
    this.queue = "process_notification";
    this.exchange = "process_notification_exchange";
    this.routingKey = "notification";
  }

  async processNotification(task) {
    console.log(colors.yellow("---------=----------"));
    try {
      console.log(colors.cyan("Processing notification:"), {
        to: typeof task.to === 'string' ? task.to.substring(0, 16) + '...' : Array.isArray(task.to) ? `${task.to.length} tokens` : 'INVALID',
        title: task.notification?.title,
        type: task.data?.type || "UNKNOWN",
      });

      // Verify that we have sufficient data to process the notification
      if (!task.to || !task.notification) {
        throw new Error("Incomplete notification data");
      }

      // Implementation of the logic to send the notification using Firebase Cloud Messaging
      const type = task.type || task.data?.type || "single";
      let result;

      if (type === "single") {
        // For individual notifications, 'to' should be the FCM device token
        result = await this.notificationService.processSingleNotification(
          task.to,
          task.notification,
          task.data
        );
      } else if (type === "bulk") {
        // For bulk notifications, 'to' should be an array of FCM tokens
        result = await this.notificationService.processBulkNotification(
          task.to,
          task.notification,
          task.data
        );
      } else {
        throw new Error(`Unknown notification type: ${type}`);
      }

      // Logs for monitoring
      console.log(colors.green(`Notification processed successfully`));
      console.log(colors.blue(`Title: ${task.notification.title}`));
      console.log(colors.blue(`Content: ${task.notification.body}`));
      console.log(colors.blue(`Type: ${type}`));

      return result;
    } catch (error) {
      console.error(colors.red("Error processing notification:"), error);
      throw error; // Propagate the error to be handled by the retry mechanism
    }
  }

  async startConsumer() {
    try {
      const { connection, channel } = await connect(
        this.queue, 
        this.exchange, 
        this.routingKey, 
        (task) => this.processNotification(task)
      );
      
      console.log(colors.green("Notification consumer successfully started!"));
      
      // Return connection and channel for potential cleanup
      return { connection, channel };
    } catch (error) {
      console.error(colors.red("Fatal error starting consumer:"), error);
      throw error;
    }
  }
}
