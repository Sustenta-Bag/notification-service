import colors from "colors";
import app from './app.js';
import ConsumerService from './services/rabbitmq/consumer.service.js';
import config from './config/env.js';

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

const consumerService = new ConsumerService();
consumerService.startConsumer()
  .then(() => {
    console.log(colors.green("RabbitMQ consumer started successfully!"));
  })
  .catch(error => {
    console.error(colors.red("Failed to start RabbitMQ consumer:"), error);
    process.exit(1);
  });

const PORT = config.server.port;
const server = app.listen(PORT, () => {
  console.log(colors.green(`RESTful API server running on port ${PORT}`));
  console.log(colors.green(`API documentation available at http://localhost:${PORT}/api`));
  console.log(colors.green(`Swagger documentation available at http://localhost:${PORT}/api-docs`));
});

const gracefulShutdown = async (signal) => {
  console.log(
    colors.yellow(`Received ${signal}, gracefully shutting down...`)
  );
  
  server.close(() => {
    console.log(colors.green('HTTP server closed.'));
    process.exit(0);
  });
  
  setTimeout(() => {
    console.log(colors.red('Could not close connections in time, forcefully shutting down'));
    process.exit(1);
  }, 10000);
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
