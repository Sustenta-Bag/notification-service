import config from './config/index.js';
import logger from './utils/logger.js';
import firebaseService from './services/firebase.service.js';
import { startNotificationService } from './notification-service.js';

logger.banner("NOTIFICATION SERVICE STARTED");

process.on("uncaughtException", (error) => {
  logger.error("Uncaught exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled rejection:", reason);
  process.exit(1);
});

try {
  config.displayInfo();

  logger.warning("Initializing Firebase Admin SDK...");
  const firebaseInitialized = firebaseService.initialize();

  if (!firebaseInitialized) {
    logger.error("Failed to initialize Firebase. Check your environment variables.");
    process.exit(1);
  }

  startNotificationService()
    .then(() => {
      logger.success("Notification service started successfully!");
      logger.success("Ready to process messages via RabbitMQ");
    })
    .catch(error => {
      logger.error("Failed to start notification service:", error);
      process.exit(1);
    });

} catch (error) {
  logger.error("Failed to start service:", error);
  process.exit(1);
}

process.on("uncaughtException", (error) => {
  console.error(colors.red("Uncaught exception:"), error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error(colors.red("Unhandled rejection:"), reason);
  process.exit(1);
});
