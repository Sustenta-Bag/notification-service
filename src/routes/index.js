// src/routes/index.js
import { Router } from "express";
import path from 'path';
import { fileURLToPath } from 'url';
import notificationRoutes from "./notification.routes.js";

// Configuração para usar __dirname em módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = Router();

// Mount routes
router.use('/notifications', notificationRoutes);

// Root endpoint with HATEOAS links
/**
 * @swagger
 * /api:
 *   get:
 *     summary: API Root Endpoint
 *     description: Ponto de entrada principal da API que contém links para todos os recursos disponíveis
 *     tags: [API]
 *     responses:
 *       200:
 *         description: Links para recursos disponíveis na API
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Notification Service API
 *                 links:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       rel:
 *                         type: string
 *                       href:
 *                         type: string
 *                       method:
 *                         type: string
 *                       description:
 *                         type: string
 */
router.get('/', (req, res) => {
  // Verifica o tipo de conteúdo esperado pelo cliente
  const acceptHeader = req.headers.accept || '';
  
  // Considera HTML se o cabeçalho Accept incluir text/html ou */*
  // Ou se não houver cabeçalho Accept explícito e o cliente for um navegador
  const wantsHTML = acceptHeader.includes('text/html') || 
                    acceptHeader.includes('*/*') || 
                    (acceptHeader === '' && req.get('User-Agent')?.includes('Mozilla'));
  
  // Dados da API com links HATEOAS
  const apiData = {
    message: "Notification Service API",
    links: [
      {
        rel: "notifications",
        href: "/api/notifications",
        method: "GET",
        description: "Access notification endpoints"
      },
      {
        rel: "docs",
        href: "/api-docs",
        method: "GET",
        description: "API Documentation (Swagger)"
      },
      {
        rel: "health",
        href: "/api/notifications/health",
        method: "GET",
        description: "Check API health status"
      }
    ]
  };
  
  if (wantsHTML) {
    // Se o cliente for um navegador, retorna página HTML formatada
    console.log('Serving HTML content for /api route');
    res.sendFile(path.join(__dirname, '..', 'public', 'api.html'));
  } else {
    // Para clientes que esperam JSON (outros serviços, ferramentas API, etc.)
    console.log('Serving JSON content for /api route');
    res.status(200).json(apiData);
  }
});

export default router;
