// src/server.js
import colors from "colors";
import app from './app.js';
import ConsumerService from './services/rabbitmq/consumer.service.js';
import config from './config/env.js';

// Banner message for easy identification in logs
console.log(colors.rainbow("========================================"));
console.log(colors.bold.green("  NOTIFICATION SERVICE STARTED"));
console.log(colors.rainbow("========================================"));

// Validate environment variables
try {
  config.validate();
  
  console.log(colors.blue("Environment information:"));
  console.log(colors.blue(`- NODE_ENV: ${config.nodeEnv}`));
  console.log(
    colors.blue(
      `- RABBITMQ: ${config.rabbitmq.url.replace(/:\/\/.*:.*@/, "://***:***@")}`
    )
  ); // Hide credentials in logs
  console.log(colors.blue(`- MAX_RETRIES: ${config.rabbitmq.maxRetries}`));
  console.log(colors.blue(`- FCM Project ID: ${config.firebase.projectId}`));
} catch (error) {
  console.error(colors.red(error.message));
  process.exit(1);
}

// Start RabbitMQ consumer
const consumerService = new ConsumerService();
consumerService.startConsumer()
  .then(() => {
    console.log(colors.green("RabbitMQ consumer started successfully!"));
  })
  .catch(error => {
    console.error(colors.red("Failed to start RabbitMQ consumer:"), error);
    process.exit(1);
  });

// Start Express server
const PORT = config.server.port;
const server = app.listen(PORT, () => {
  console.log(colors.green(`RESTful API server running on port ${PORT}`));
  console.log(colors.green(`API documentation available at http://localhost:${PORT}/api`));
});

// Handle graceful shutdown
const gracefulShutdown = async (signal) => {
  console.log(
    colors.yellow(`Received ${signal}, gracefully shutting down...`)
  );
  
  server.close(() => {
    console.log(colors.green('HTTP server closed.'));
    process.exit(0);
  });
  
  // Allow server to process remaining requests
  setTimeout(() => {
    console.log(colors.red('Could not close connections in time, forcefully shutting down'));
    process.exit(1);
  }, 10000);
};

// Signal handlers
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Unhandled errors
process.on("uncaughtException", (error) => {
  console.error(colors.red("Uncaught exception:"), error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error(colors.red("Unhandled rejection at:"), promise, "reason:", reason);
});
