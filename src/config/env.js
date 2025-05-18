// src/config/env.js
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Required environment variables
const requiredEnvVars = [
  "RABBITMQ", 
  "MAX_RETRIES",
  "FCM_API_KEY", 
  "FCM_PROJECT_ID", 
  "FCM_CLIENT_EMAIL", 
  "FCM_PRIVATE_KEY",
  "FCM_SENDER_ID"
];

// Validate required environment variables
const validateEnv = () => {
  const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);
  
  if (missingEnvVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
  }
  
  return true;
};

// Export environment variables
export default {
  nodeEnv: process.env.NODE_ENV || 'development',
  rabbitmq: {
    url: process.env.RABBITMQ,
    maxRetries: parseInt(process.env.MAX_RETRIES, 10) || 5
  },
  firebase: {
    apiKey: process.env.FCM_API_KEY,
    projectId: process.env.FCM_PROJECT_ID,
    clientEmail: process.env.FCM_CLIENT_EMAIL,
    privateKey: process.env.FCM_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    senderId: process.env.FCM_SENDER_ID,
    serviceAccountPath: './service-account.json'
  },
  server: {
    port: parseInt(process.env.PORT, 10) || 3000
  },
  validate: validateEnv
};
