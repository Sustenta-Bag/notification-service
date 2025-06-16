import dotenv from "dotenv";
import colors from "colors";

dotenv.config();

/**
 * Configuration module - centralizes all environment variables and validation
 */
class Config {
  constructor() {
    this.validateRequiredEnvVars();
  }

  // Firebase configuration
  get firebase() {
    return {
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    };
  }

  // RabbitMQ configuration
  get rabbitmq() {
    return {
      url: process.env.RABBITMQ,
      maxRetries: parseInt(process.env.MAX_RETRIES) || 5,
      queue: "process_notification",
      exchange: "process_notification_exchange",
      routingKey: "notification",
      dlqSuffix: "_dlq"
    };
  }

  // Application configuration
  get app() {
    return {
      nodeEnv: process.env.NODE_ENV || 'development',
      isDevelopment: process.env.NODE_ENV !== 'production',
      isProduction: process.env.NODE_ENV === 'production'
    };
  }

  // Validate required environment variables
  validateRequiredEnvVars() {
    const requiredEnvVars = [
      "RABBITMQ", 
      "MAX_RETRIES", 
      "FIREBASE_PROJECT_ID", 
      "FIREBASE_CLIENT_EMAIL", 
      "FIREBASE_PRIVATE_KEY"
    ];
    
    const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

    if (missingEnvVars.length > 0) {
      console.error(colors.red(`Missing required environment variables: ${missingEnvVars.join(', ')}`));
      throw new Error(`Missing environment variables: ${missingEnvVars.join(', ')}`);
    }
  }

  // Display configuration info (without sensitive data)
  displayInfo() {
    console.log(colors.blue("Environment information:"));
    console.log(colors.blue(`- NODE_ENV: ${this.app.nodeEnv}`));
    console.log(colors.blue(`- RABBITMQ: ${this.rabbitmq.url.replace(/:\/\/.*:.*@/, "://***:***@")}`));
    console.log(colors.blue(`- MAX_RETRIES: ${this.rabbitmq.maxRetries}`));
  }
}

export default new Config();
