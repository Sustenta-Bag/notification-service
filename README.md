# Serviço de Notificações

Microserviço RESTful para envio de notificações via Firebase Cloud Messaging (FCM), com integração RabbitMQ.

## Características

- API RESTful com HATEOAS (Hypermedia as the Engine of Application State)
- Documentação Swagger interativa
- Integração com Firebase Cloud Messaging
- Consumidor RabbitMQ para processamento assíncrono
- Suporte para notificações individuais e em massa

## Estrutura do Projeto

```
├── src/
│   ├── config/               # Configurações do serviço
│   ├── controllers/          # Controladores da API
│   ├── middlewares/          # Middlewares Express
│   ├── models/               # Modelos de dados
│   ├── services/             # Lógica de negócios
│   │   └── rabbitmq/         # Integração com RabbitMQ
│   ├── routes/               # Rotas da API
│   ├── utils/                # Utilidades
│   ├── public/               # Arquivos estáticos
│   ├── app.js                # Aplicação Express
│   └── server.js             # Ponto de entrada
```

## Documentação da API

A documentação interativa da API está disponível via Swagger:

- **Swagger UI**: `/api-docs`
- **Swagger JSON**: `/api-docs.json`

![Documentação Swagger](https://raw.githubusercontent.com/swagger-api/swagger-ui/master/docs/images/swagger-ui.png)

Para acessar facilmente a documentação:

```powershell
# Windows (PowerShell)
.\Verify-Swagger.ps1

# Ou simplesmente
npm run docs
```

### Endpoints Principais

- `GET /api`: Retorna endpoints disponíveis
- `GET /api/notifications`: Retorna endpoints de notificações
- `POST /api/notifications`: Enviar notificação individual
- `POST /api/notifications/bulk`: Enviar notificações em massa
- `GET /api/notifications/health`: Verificar estado de saúde do serviço
