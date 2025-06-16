import admin from "firebase-admin";
import config from '../config/index.js';
import logger from '../utils/logger.js';

/**
 * Firebase Service - handles Firebase initialization and messaging
 */
class FirebaseService {
  constructor() {
    this.initialized = false;
  }

  /**
   * Initialize Firebase Admin SDK
   */
  initialize() {
    if (this.initialized) return true;

    try {
      logger.info("Initializing Firebase Admin SDK...");

      const serviceAccount = {
        type: "service_account",
        project_id: config.firebase.projectId,
        private_key: config.firebase.privateKey,
        client_email: config.firebase.clientEmail,
      };

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: config.firebase.projectId,
      });

      this.initialized = true;
      logger.success("Firebase Admin SDK initialized successfully");
      return true;
    } catch (error) {
      logger.error("Error initializing Firebase:", error);
      return false;
    }
  }

  /**
   * Send notification to a single device
   */
  async sendNotification(token, notification, data) {
    if (!this.initialized) {
      return { success: false, error: "Firebase not initialized" };
    }

    try {
      const message = {
        token,
        notification,
        data: data ? this._convertToStringValues(data) : undefined,
        android: { priority: "high" },
        apns: { headers: { "apns-priority": "10" } },
      };

      const response = await admin.messaging().send(message);
      logger.success(`Message sent successfully:`, response);
      return { success: true, messageId: response };
    } catch (error) {
      logger.error(`Error sending message:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send notifications to multiple devices
   */
  async sendBulkNotifications(tokens, notification, data) {
    if (!this.initialized) {
      return { success: false, error: "Firebase not initialized" };
    }

    let successCount = 0;
    let failureCount = 0;
    const stringData = data ? this._convertToStringValues(data) : undefined;

    for (const token of tokens) {
      const result = await this.sendNotification(token, notification, stringData);
      if (result.success) {
        successCount++;
      } else {
        failureCount++;
      }
    }

    logger.bulkNotificationComplete(successCount, failureCount);
    return { success: true, successCount, failureCount };
  }

  /**
   * Convert data values to strings (FCM requirement)
   */
  _convertToStringValues(data) {
    const result = {};
    Object.entries(data).forEach(([key, value]) => {
      result[key] = typeof value === "object" ? JSON.stringify(value) : String(value);
    });
    return result;
  }

  /**
   * Check if Firebase is initialized
   */
  isInitialized() {
    return this.initialized;
  }
}

export default new FirebaseService();
