// src/routes/notification.routes.js
import { Router } from "express";
import NotificationController from "../controllers/notification.controller.js";

const router = Router();
const notificationController = new NotificationController();

/**
 * @swagger
 * /api/notifications/health:
 *   get:
 *     summary: Verifica o estado de saúde do serviço
 *     description: Retorna o status atual do serviço de notificações
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Serviço está funcionando corretamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Notification service is up and running
 *                 links:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/NotificationResponse/properties/links/items'
 *       500:
 *         description: Erro no servidor
 */
router.get('/health', (req, res) => notificationController.testConnection(req, res));

/**
 * @swagger
 * /api/notifications:
 *   post:
 *     summary: Envia uma notificação para um único dispositivo
 *     description: Envia uma notificação FCM para um dispositivo específico
 *     tags: [Notifications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SingleNotificationRequest'
 *     responses:
 *       200:
 *         description: Notificação enviada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NotificationResponse'
 *       400:
 *         description: Parâmetros inválidos
 *       500:
 *         description: Erro no servidor
 */
router.post('/', (req, res) => notificationController.sendSingleNotification(req, res));

// Bulk notification endpoint
/**
 * @swagger
 * /api/notifications/bulk:
 *   post:
 *     summary: Envia notificações para múltiplos dispositivos
 *     description: Envia uma notificação FCM para vários dispositivos de uma só vez
 *     tags: [Notifications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BulkNotificationRequest'
 *     responses:
 *       200:
 *         description: Notificações enviadas com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NotificationResponse'
 *       400:
 *         description: Parâmetros inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Erro no servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/bulk', (req, res) => notificationController.sendBulkNotification(req, res));

// Root endpoint with HATEOAS links
/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Endpoint raiz de notificações
 *     description: Retorna informações sobre a API de notificações e links HATEOAS
 *     tags: [Notifications]
 *     responses:
 *       200:
 *         description: Informações sobre a API e links disponíveis
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
 *                         example: health
 *                       href:
 *                         type: string
 *                         example: /api/notifications/health
 *                       method:
 *                         type: string
 *                         example: GET
 *                       description:
 *                         type: string
 *                         example: Check service health
 */
router.get('/', (req, res) => {
  res.status(200).json({
    message: "Notification Service API",
    links: [
      {
        rel: "health",
        href: "/api/notifications/health",
        method: "GET",
        description: "Check service health"
      },
      {
        rel: "send-notification",
        href: "/api/notifications",
        method: "POST",
        description: "Send a single notification"
      },
      {
        rel: "send-bulk-notification",
        href: "/api/notifications/bulk",
        method: "POST",
        description: "Send bulk notifications"
      }
    ]
  });
});

export default router;
