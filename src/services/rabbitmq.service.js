import amqp from "amqplib";
import config from "../config/index.js";
import logger from "../utils/logger.js";

/**
 * RabbitMQ Service - handles RabbitMQ connections and queue management
 */
class RabbitMQService {
  constructor() {
    this.connection = null;
    this.channel = null;
  }

  /**
   * Connect to RabbitMQ with retry logic
   */
  async connect(retryCount = 0) {
    try {
      logger.warning(
        `Attempting to connect to RabbitMQ: ${config.rabbitmq.url}`
      );
      this.connection = await amqp.connect(config.rabbitmq.url);
      logger.success("Successfully connected to RabbitMQ!");
      return this.connection;
    } catch (err) {
      if (retryCount < config.rabbitmq.maxRetries) {
        const delay = Math.pow(2, retryCount) * 1000;
        logger.error(
          `Failed to connect to RabbitMQ. Attempt ${retryCount + 1}/${
            config.rabbitmq.maxRetries
          }`
        );
        logger.warning(`Trying again in ${delay / 1000} seconds...`);

        await this._delay(delay);
        return this.connect(retryCount + 1);
      } else {
        logger.error("Failed to connect to RabbitMQ after multiple attempts.");
        throw err;
      }
    }
  }
  /**
   * Create channel and setup queues/exchanges
   */
  async setupChannel() {
    if (!this.connection) {
      throw new Error("No RabbitMQ connection available");
    }

    this.channel = await this.connection.createChannel();

    await this.channel.assertExchange(config.rabbitmq.exchange, "direct", {
      durable: true,
    });
    await this.channel.assertQueue(config.rabbitmq.queue, { durable: true });
    await this.channel.assertQueue(
      `${config.rabbitmq.queue}${config.rabbitmq.dlqSuffix}`,
      { durable: true }
    );
    await this.channel.bindQueue(
      config.rabbitmq.queue,
      config.rabbitmq.exchange,
      config.rabbitmq.routingKey
    );
    await this.channel.bindQueue(
      `${config.rabbitmq.queue}${config.rabbitmq.dlqSuffix}`,
      config.rabbitmq.exchange,
      "dlq"
    );

    return this.channel;
  }
  /**
   * Setup graceful shutdown
   */
  setupGracefulShutdown() {
    process.once("SIGINT", async () => {
      logger.warning("Shutting down gracefully...");
      if (this.channel) await this.channel.close();
      if (this.connection) await this.connection.close();
      process.exit(0);
    });
  }

  /**
   * Consume messages from queue
   */ async consume(messageHandler) {
    if (!this.channel) {
      throw new Error("No channel available");
    }

    logger.success(`Consuming messages from queue: ${config.rabbitmq.queue}`);

    await this.channel.consume(
      config.rabbitmq.queue,
      async (message) => {
        const content = message.content.toString();
        const retries = message.properties.headers?.["x-retries"] || 0;

        try {
          logger.messageReceived(content, retries);

          const parsedMessage = JSON.parse(content);

          let notificationData;
          if (
            parsedMessage.eventType === "NotificationRequested" &&
            parsedMessage.data
          ) {
            notificationData = {
              to: parsedMessage.data.to,
              notification: parsedMessage.data.notification,
              data: parsedMessage.data.data,
              userId: parsedMessage.data.userId,
              timestamp: parsedMessage.data.timestamp,
              metadata: {
                eventType: parsedMessage.eventType,
                version: parsedMessage.version,
                producer: parsedMessage.producer,
                correlationId: parsedMessage.correlationId,
                timestamp: parsedMessage.timestamp,
              },
            };
          } else {
            notificationData = parsedMessage;
          }

          await messageHandler(notificationData);
          logger.messageProcessed();

          this.channel.ack(message);
        } catch (err) {
          logger.error("Error processing message:", err.message);

          if (retries < config.rabbitmq.maxRetries) {
            logger.messageRetrying();
            this.channel.sendToQueue(
              config.rabbitmq.queue,
              Buffer.from(content),
              {
                headers: { "x-retries": retries + 1 },
                persistent: true,
              }
            );
          } else {
            logger.messageToDLQ();
            this.channel.publish(
              config.rabbitmq.exchange,
              "dlq",
              Buffer.from(content),
              {
                headers: { "x-retries": retries },
                persistent: true,
              }
            );
          }

          this.channel.ack(message);
        }
      },
      { noAck: false }
    );
  }

  /**
   * Get connection and channel objects
   */
  getConnectionInfo() {
    return {
      connection: this.connection,
      channel: this.channel,
    };
  }

  /**
   * Utility method for delays
   */
  _delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export default new RabbitMQService();
