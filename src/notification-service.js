import rabbitmqService from './services/rabbitmq.service.js';
import notificationController from './controllers/notification.controller.js';
import logger from './utils/logger.js';

/**
 * Main notification service
 */
const startNotificationService = async () => {
  try {
    await rabbitmqService.connect();
    await rabbitmqService.setupChannel();

    rabbitmqService.setupGracefulShutdown();

    await rabbitmqService.consume(async (task) => {
      await notificationController.processNotification(task);
    });
    
    return rabbitmqService.getConnectionInfo();
  } catch (err) {
    logger.error("Fatal error in service setup:", err);
    throw err;
  }
};

export { startNotificationService };
