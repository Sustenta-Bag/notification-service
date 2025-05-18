// src/utils/swagger-examples.js

/**
 * Exemplos de requisições e respostas para a documentação Swagger
 */

// Exemplo de requisição de notificação individual
export const singleNotificationExample = {
  token: "fcm-device-token-example-12345",
  notification: {
    title: "Nova mensagem",
    body: "Você recebeu uma nova mensagem de João"
  },
  data: {
    type: "message",
    messageId: "msg-12345",
    sender: "João Silva",
    timestamp: "2025-05-18T10:30:00Z"
  }
};

// Exemplo de requisição de notificação em massa
export const bulkNotificationExample = {
  tokens: [
    "fcm-device-token-example-12345",
    "fcm-device-token-example-67890",
    "fcm-device-token-example-54321"
  ],
  notification: {
    title: "Atualização importante",
    body: "Nova versão do app disponível"
  },
  data: {
    type: "update",
    version: "2.0.1",
    requiredUpdate: false,
    releaseNotes: "Melhorias de performance e correções de bugs"
  }
};

// Exemplo de resposta bem-sucedida de notificação individual
export const singleNotificationResponseExample = {
  success: true,
  data: {
    messageId: "projects/notification-service/messages/1234567890",
    success: true
  },
  links: [
    {
      rel: "self",
      href: "/api/notifications/1234567890",
      method: "GET"
    },
    {
      rel: "send-notification",
      href: "/api/notifications",
      method: "POST"
    }
  ]
};

// Exemplo de resposta bem-sucedida de notificação em massa
export const bulkNotificationResponseExample = {
  success: true,
  data: {
    successCount: 2,
    failureCount: 1,
    success: true
  },
  links: [
    {
      rel: "self",
      href: "/api/notifications/bulk",
      method: "GET"
    },
    {
      rel: "send-notification",
      href: "/api/notifications",
      method: "POST"
    }
  ]
};

// Exemplo de resposta de erro
export const errorResponseExample = {
  success: false,
  error: "Token FCM inválido ou expirado",
  links: [
    {
      rel: "self",
      href: "/api/notifications",
      method: "POST"
    },
    {
      rel: "documentation",
      href: "/api-docs",
      method: "GET"
    }
  ]
};

// Exemplo de resposta de verificação de saúde
export const healthResponseExample = {
  success: true,
  message: "Notification service is up and running",
  version: "1.0.0",
  timestamp: "2025-05-18T12:34:56Z",
  links: [
    {
      rel: "self",
      href: "/api/notifications/health",
      method: "GET"
    },
    {
      rel: "api-root",
      href: "/api",
      method: "GET"
    }
  ]
};
