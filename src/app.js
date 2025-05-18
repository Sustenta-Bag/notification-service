// src/app.js
import express from 'express';
import colors from 'colors';
import routes from './routes/index.js';
import { initializeFirebase } from './services/firebase.js';
import { errorHandler, notFound } from './middlewares/error.middleware.js';
import { requestLogger } from './middlewares/logger.middleware.js';
import config from './config/env.js';

// Initialize Express app
const app = express();

// Initialize Firebase
console.log(colors.yellow("Initializing Firebase Admin SDK..."));
const firebaseInitialized = initializeFirebase();

if (!firebaseInitialized) {
  console.error(colors.red("Failed to initialize Firebase. Please check your service account configuration."));
  console.error(colors.red("Make sure you have a valid service-account.json file in the root directory."));
  process.exit(1);
}

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Welcome message
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the Notification Service API',
    version: '1.0.0',
    links: [
      {
        rel: 'api',
        href: '/api',
        method: 'GET',
        description: 'API root endpoint'
      }
    ]
  });
});

// Routes
app.use('/api', routes);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

export default app;
