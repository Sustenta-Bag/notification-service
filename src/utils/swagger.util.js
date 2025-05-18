// src/utils/swagger.util.js
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import packageJson from '../../package.json' with { type: "json" };
import { swaggerDefinitions } from './swagger-definitions.js';

// Definição básica do Swagger
const options = {
  definition: {
    ...swaggerDefinitions,
    info: {
      ...swaggerDefinitions.info,
      version: packageJson.version
    }
  },
  apis: ['./src/routes/*.js', './src/models/*.js', './src/controllers/*.js'],
};

// Inicializa o Swagger
const specs = swaggerJSDoc(options);

// Configuração do middleware para Express
export const swaggerDocs = (app, port) => {
  // Opções personalizadas para o Swagger UI
  const swaggerUiOptions = {
    customCss: '.swagger-ui .topbar { background-color: #2c3e50; } .swagger-ui .info .title { color: #2c3e50; }',
    customSiteTitle: 'API de Notificações - Documentação',
    customfavIcon: '/notification-icon.svg',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      docExpansion: 'list',
      deepLinking: true,
      filter: true,
      showExtensions: true,
      showCommonExtensions: true
    }
  };

  // Rota para a documentação do Swagger
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, swaggerUiOptions));

  // Rota para o JSON da documentação
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });

  console.log(`Documentação Swagger disponível em http://localhost:${port}/api-docs`);
};

export default swaggerDocs;
