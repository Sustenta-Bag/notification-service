import colors from "colors";
import dotenv from "dotenv";
import { initializeFirebase, startNotificationService } from './notification-service.js';

dotenv.config();

console.log(colors.rainbow("========================================"));
console.log(colors.bold.green("  NOTIFICATION SERVICE STARTED"));
console.log(colors.rainbow("========================================"));

// Validate required environment variables
const requiredEnvVars = ["RABBITMQ", "MAX_RETRIES", "FIREBASE_PROJECT_ID", "FIREBASE_CLIENT_EMAIL", "FIREBASE_PRIVATE_KEY"];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error(colors.red(`Missing required environment variables: ${missingEnvVars.join(', ')}`));
  process.exit(1);
}

console.log(colors.blue("Environment information:"));
console.log(colors.blue(`- NODE_ENV: ${process.env.NODE_ENV || 'development'}`));
console.log(colors.blue(`- RABBITMQ: ${process.env.RABBITMQ.replace(/:\/\/.*:.*@/, "://***:***@")}`));
console.log(colors.blue(`- MAX_RETRIES: ${process.env.MAX_RETRIES}`));

// Initialize Firebase
console.log(colors.yellow("Initializing Firebase Admin SDK..."));
const firebaseInitialized = initializeFirebase();

if (!firebaseInitialized) {
  console.error(colors.red("Failed to initialize Firebase. Check your environment variables."));
  process.exit(1);
}

// Start notification service
startNotificationService()
  .then(() => {
    console.log(colors.green("Notification service started successfully!"));
    console.log(colors.green("Ready to process messages via RabbitMQ"));
  })
  .catch(error => {
    console.error(colors.red("Failed to start notification service:"), error);
    process.exit(1);
  });

// Error handling
process.on("uncaughtException", (error) => {
  console.error(colors.red("Uncaught exception:"), error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error(colors.red("Unhandled rejection:"), reason);
  process.exit(1);
});
