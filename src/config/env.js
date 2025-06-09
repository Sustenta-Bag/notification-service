// src/config/env.js
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Required environment variables
const requiredEnvVars = [
  "RABBITMQ", 
  "MAX_RETRIES",
  "FIREBASE_API_KEY", 
  "FIREBASE_PROJECT_ID", 
  "FIREBASE_CLIENT_EMAIL", 
  "FIREBASE_PRIVATE_KEY",
  "FIREBASE_MESSAGING_SENDER_ID"
];

// Validate required environment variables
const validateEnv = () => {
  const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);
  
  if (missingEnvVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
  }
  
  return true;
};

export default {
  nodeEnv: process.env.NODE_ENV || 'development',
  rabbitmq: {
    url: process.env.RABBITMQ,
    maxRetries: parseInt(process.env.MAX_RETRIES, 10) || 5
  },
  validate: validateEnv
};
