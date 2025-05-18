// src/app.js
import express from 'express';
import colors from 'colors';
import path from 'path';
import { fileURLToPath } from 'url';
import routes from './routes/index.js';
import { initializeFirebase } from './services/firebase.js';
import { errorHandler, notFound } from './middlewares/error.middleware.js';
import { requestLogger } from './middlewares/logger.middleware.js';
import config from './config/env.js';
import swaggerDocs from './utils/swagger.util.js';

// Configuração para usar __dirname em módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Setup custom Swagger UI page
app.get('/api-docs', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'api-docs.html'));
});

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
// Middleware para garantir que os cabeçalhos Accept sejam processados corretamente
app.use('/api', (req, res, next) => {
  // Logging para depuração
  console.log(`${req.method} ${req.url}`);
  console.log('Accept header:', req.headers.accept);
  console.log('User-Agent:', req.get('User-Agent'));
  next();
});

// Montando as rotas no caminho /api
app.use('/api', routes);

// Setup Swagger
swaggerDocs(app, config.port || 9000);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

export default app;
