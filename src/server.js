import colors from "colors";
import ConsumerService from './services/rabbitmq/consumer.service.js';
import config from './config/env.js';
import { initializeFirebase } from './services/firebase.js';

console.log(colors.rainbow("========================================"));
console.log(colors.bold.green("  NOTIFICATION SERVICE STARTED"));
console.log(colors.rainbow("========================================"));

try {
  config.validate();
  
  console.log(colors.blue("Environment information:"));
  console.log(colors.blue(`- NODE_ENV: ${config.nodeEnv}`));
  console.log(
    colors.blue(
      `- RABBITMQ: ${config.rabbitmq.url.replace(/:\/\/.*:.*@/, "://***:***@")}`
    )
  );
  console.log(colors.blue(`- MAX_RETRIES: ${config.rabbitmq.maxRetries}`));
} catch (error) {
  console.error(colors.red(error.message));
  process.exit(1);
}

// Initialize Firebase
console.log(colors.yellow("Initializing Firebase Admin SDK..."));
const firebaseInitialized = initializeFirebase();

if (!firebaseInitialized) {
  console.error(colors.red("Failed to initialize Firebase. Please check your service account configuration."));
  console.error(colors.red("Make sure you have a valid service-account.json file in the root directory."));
  process.exit(1);
}

const consumerService = new ConsumerService();
consumerService.startConsumer()
  .then(() => {
    console.log(colors.green("RabbitMQ consumer started successfully!"));
    console.log(colors.green("Notification service is ready to process messages via RabbitMQ"));
  })
  .catch(error => {
    console.error(colors.red("Failed to start RabbitMQ consumer:"), error);
    process.exit(1);
  });

const gracefulShutdown = async (signal) => {
  console.log(
    colors.yellow(`Received ${signal}, gracefully shutting down...`)
  );
  
  console.log(colors.green('RabbitMQ consumer stopped.'));
  process.exit(0);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

process.on("uncaughtException", (error) => {
  console.error(colors.red("Uncaught exception:"), error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error(colors.red("Unhandled rejection at:"), promise, "reason:", reason);
});
