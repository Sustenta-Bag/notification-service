// src/models/notification.model.js
/**
 * @swagger
 * components:
 *   schemas:
 *     Notification:
 *       type: object
 *       required:
 *         - title
 *       properties:
 *         title:
 *           type: string
 *           description: Título da notificação
 *         body:
 *           type: string
 *           description: Corpo ou conteúdo da notificação
 *         data:
 *           type: object
 *           description: Dados adicionais da notificação
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: Data e hora da criação da notificação
 *       example:
 *         title: Notificação Importante
 *         body: Este é o conteúdo da notificação
 *         timestamp: 2025-05-18T12:00:00Z
 */
export class Notification {
  constructor(title, body, data) {
    this.title = title;
    this.body = body;
    this.data = data;
    this.timestamp = new Date().toISOString();
  }

  validate() {
    if (!this.title) {
      throw new Error('Notification must have a title');
    }
    return true;
  }

  toJSON() {
    return {
      title: this.title,
      body: this.body,
      data: this.data,
      timestamp: this.timestamp
    };
  }
}

/**
 * @swagger
 * components:
 *   schemas:
 *     SingleNotificationRequest:
 *       type: object
 *       required:
 *         - token
 *         - notification
 *       properties:
 *         token:
 *           type: string
 *           description: Token FCM do dispositivo destinatário
 *         notification:
 *           $ref: '#/components/schemas/Notification'
 *         data:
 *           type: object
 *           description: Dados adicionais para serem enviados com a notificação
 *       example:
 *         token: fcm-token-example-123456789
 *         notification:
 *           title: Nova mensagem
 *           body: Você recebeu uma nova mensagem
 *         data:
 *           type: message
 *           messageId: msg123
 */
export class SingleNotificationRequest {
  constructor(token, notification, data) {
    this.token = token;
    this.notification = notification;
    this.data = data || {};
    this.type = "single";
  }

  validate() {
    if (!this.token) {
      throw new Error('Single notification must have a token');
    }
    if (!this.notification || !this.notification.title) {
      throw new Error('Notification must have a title');
    }
    return true;
  }

  toJSON() {
    return {
      to: this.token,
      notification: this.notification,
      data: this.data,
      type: this.type
    };  }
}

/**
 * @swagger
 * components:
 *   schemas:
 *     BulkNotificationRequest:
 *       type: object
 *       required:
 *         - tokens
 *         - notification
 *       properties:
 *         tokens:
 *           type: array
 *           items:
 *             type: string
 *           description: Lista de tokens FCM dos dispositivos destinatários
 *         notification:
 *           $ref: '#/components/schemas/Notification'
 *         data:
 *           type: object
 *           description: Dados adicionais para serem enviados com as notificações
 *       example:
 *         tokens: 
 *           - fcm-token-example-123456789
 *           - fcm-token-example-987654321
 *         notification:
 *           title: Anúncio Importante
 *           body: Atualização do sistema disponível
 *         data:
 *           type: announcement
 *           id: announce123
 */
export class BulkNotificationRequest {
  constructor(tokens, notification, data) {
    this.tokens = tokens;
    this.notification = notification;
    this.data = data || {};
    this.type = "bulk";
  }

  validate() {
    if (!this.tokens || !Array.isArray(this.tokens) || this.tokens.length === 0) {
      throw new Error('Bulk notification must have an array of tokens');
    }
    if (!this.notification || !this.notification.title) {
      throw new Error('Notification must have a title');
    }
    return true;
  }

  toJSON() {
    return {
      to: this.tokens,
      notification: this.notification,
      data: this.data,
      type: this.type
    };
  }
}
