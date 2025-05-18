// src/utils/swagger-definitions.js
/**
 * Definições de esquemas para documentação Swagger
 */

export const swaggerDefinitions = {
  openapi: '3.0.0',
  info: {
    title: 'Serviço de Notificações API',
    version: '1.0.0',
    description: 'API RESTful para envio de notificações push através do Firebase Cloud Messaging (FCM)',
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
    contact: {
      name: 'Suporte ao Desenvolvedor',
      email: 'suporte@exemplo.com',
    },
  },
  servers: [
    {
      url: 'http://localhost:4409',
      description: 'Servidor de Desenvolvimento',
    },
    {
      url: 'https://api.notifications.exemplo.com',
      description: 'Servidor de Produção',
    },
  ],
  tags: [
    {
      name: 'API',
      description: 'Endpoints principais da API'
    },
    {
      name: 'Notifications',
      description: 'Operações relacionadas a notificações'
    },
    {
      name: 'Health',
      description: 'Verificação de saúde do serviço'
    }
  ],
  components: {
    schemas: {
      Notification: {
        type: 'object',
        required: ['title'],
        properties: {
          title: {
            type: 'string',
            description: 'Título da notificação',
          },
          body: {
            type: 'string',
            description: 'Corpo da mensagem de notificação',
          },
          imageUrl: {
            type: 'string',
            description: 'URL opcional para uma imagem a ser exibida na notificação',
          },
        },
      },
      Data: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            description: 'Tipo da notificação (para categorização no cliente)',
          },
          payload: {
            type: 'object',
            description: 'Dados adicionais para serem enviados com a notificação',
          },
        },
      },
      SingleNotificationRequest: {
        type: 'object',
        required: ['token', 'notification'],
        properties: {
          token: {
            type: 'string',
            description: 'Token FCM do dispositivo destinatário',
          },
          notification: {
            $ref: '#/components/schemas/Notification',
          },
          data: {
            $ref: '#/components/schemas/Data',
          },
        },
      },
      BulkNotificationRequest: {
        type: 'object',
        required: ['tokens', 'notification'],
        properties: {
          tokens: {
            type: 'array',
            items: {
              type: 'string',
            },
            description: 'Lista de tokens FCM dos dispositivos destinatários',
          },
          notification: {
            $ref: '#/components/schemas/Notification',
          },
          data: {
            $ref: '#/components/schemas/Data',
          },
        },
      },
      NotificationResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
          },
          data: {
            type: 'object',
            properties: {
              messageId: {
                type: 'string',
                description: 'ID da mensagem enviada (apenas para notificações individuais)',
              },
              successCount: {
                type: 'integer',
                description: 'Número de notificações enviadas com sucesso (apenas para envio em massa)',
              },
              failureCount: {
                type: 'integer',
                description: 'Número de falhas no envio (apenas para envio em massa)',
              },
            },
          },
          links: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                rel: {
                  type: 'string',
                },
                href: {
                  type: 'string',
                },
                method: {
                  type: 'string',
                },
                description: {
                  type: 'string',
                },
              },
            },
          },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false,
          },
          error: {
            type: 'string',
          },
          links: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                rel: {
                  type: 'string',
                },
                href: {
                  type: 'string',
                },
                method: {
                  type: 'string',
                },
                description: {
                  type: 'string',
                },
              },
            },
          },
        },
      },
    },
    securitySchemes: {
      ApiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-KEY',
        description: 'Chave de API para autenticação de requisições'
      }
    }
  }
};
