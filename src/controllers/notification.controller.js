import firebaseService from '../services/firebase.service.js';
import logger from '../utils/logger.js';

/**
 * Notification Controller - handles notification processing logic
 */
class NotificationController {
  
  /**
   * Process notification based on type (single or bulk)
   */
  async processNotification(task) {
    logger.processingStart(task);
    
    try {
      this._validateTask(task);

      const type = task.type || task.data?.type || "single";
      let result;

      if (type === "single") {
        result = await this._processSingleNotification(task);
      } else if (type === "bulk") {
        result = await this._processBulkNotification(task);
      } else {
        throw new Error(`Unknown notification type: ${type}`);
      }

      logger.processingSuccess(task, type);
      return result;
    } catch (error) {
      logger.error("Error processing notification:", error);
      throw error;
    }
  }

  /**
   * Process single notification
   */
  async _processSingleNotification(task) {
    return await firebaseService.sendNotification(
      task.to, 
      task.notification, 
      task.data?.payload
    );
  }

  /**
   * Process bulk notification
   */
  async _processBulkNotification(task) {
    if (!Array.isArray(task.to)) {
      throw new Error('For bulk notifications, "to" must be an array of tokens');
    }
    
    return await firebaseService.sendBulkNotifications(
      task.to, 
      task.notification, 
      task.data?.payload
    );
  }

  /**
   * Validate notification task
   */
  _validateTask(task) {
    if (!task.to || !task.notification) {
      throw new Error("Incomplete notification data");
    }

    if (!task.notification.title) {
      throw new Error("Notification title is required");
    }
  }
}

export default new NotificationController();
