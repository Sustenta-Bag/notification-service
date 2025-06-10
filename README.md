# Notification Service

A simple microservice for sending push notifications via Firebase Cloud Messaging (FCM) with RabbitMQ integration.

## Features

- 🚀 Firebase Cloud Messaging (FCM) integration
- 📨 Single and bulk notification support
- 🐰 RabbitMQ message queue processing
- 🔄 Automatic retry mechanism with exponential backoff
- 💀 Dead Letter Queue (DLQ) for failed messages
- 🐳 Docker support

## Quick Start

### 1. Environment Setup

Copy the environment file and configure your variables:

```bash
cp .env.example .env
```

Edit `.env` with your Firebase and RabbitMQ credentials.

### 2. Install Dependencies

```bash
npm install
```

### 3. Run the Service

```bash
# Development
npm run dev

# Production
npm start
```

### 4. Docker (Optional)

```bash
# Build
docker build -t notification-service .

# Run
docker run --env-file .env notification-service
```

## Message Format

Send messages to the `process_notification` queue with this format:

### Single Notification
```json
{
  "to": "firebase_device_token_here",
  "notification": {
    "title": "Notification Title",
    "body": "Notification message body"
  },
  "data": {
    "type": "single",
    "payload": {
      "custom_field": "custom_value"
    }
  }
}
```

### Bulk Notification
```json
{
  "to": ["token1", "token2", "token3"],
  "notification": {
    "title": "Bulk Notification",
    "body": "Message for multiple devices"
  },
  "data": {
    "type": "bulk",
    "payload": {
      "campaign_id": "123"
    }
  }
}
```

## Configuration

| Variable | Description | Required |
|----------|-------------|----------|
| `RABBITMQ` | RabbitMQ connection URL | ✅ |
| `MAX_RETRIES` | Maximum retry attempts | ✅ |
| `FIREBASE_PROJECT_ID` | Firebase project ID | ✅ |
| `FIREBASE_CLIENT_EMAIL` | Firebase service account email | ✅ |
| `FIREBASE_PRIVATE_KEY` | Firebase service account private key | ✅ |

## Project Structure

```
src/
├── server.js              # Main application entry point
└── notification-service.js # Core notification logic
```

## Error Handling

- **Retry Logic**: Messages are retried up to `MAX_RETRIES` times with exponential backoff
- **Dead Letter Queue**: Failed messages after max retries are sent to `{queue}_dlq`
- **Graceful Shutdown**: Proper cleanup on SIGINT/SIGTERM signals

## Monitoring

The service provides colored console logging for easy monitoring:
- 🟢 **Green**: Successful operations
- 🟡 **Yellow**: Warnings and retry attempts  
- 🔴 **Red**: Errors and failures
- 🔵 **Blue**: Information and debugging

## License

MIT
- Tratamento de falhas e retentativas automáticas

## Instalação

```powershell
# Clonar o repositório
git clone https://github.com/Sustenta-Bag/notification-service.git
cd notification-service

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Edite o arquivo .env com suas configurações
```

## Configuração Firebase

1. Crie um projeto no [Firebase Console](https://console.firebase.google.com/)
2. Gere uma nova chave privada do Firebase Admin SDK
3. Salve o arquivo JSON de credenciais como `service-account.json` na raiz do projeto
4. Configure as variáveis de ambiente relevantes no arquivo `.env`

## Uso

```powershell
# Iniciar o serviço em modo de desenvolvimento
npm run dev

# Iniciar o serviço em modo de produção
npm run start

# Visualizar a documentação
npm run docs
```

## Estrutura do Projeto

```
├── src/
│   ├── config/               # Configurações do serviço
│   ├── controllers/          # Controladores da API
│   ├── middlewares/          # Middlewares Express
│   ├── models/               # Modelos de dados
│   ├── services/             # Lógica de negócios
│   │   ├── firebase.js       # Serviço de integração com Firebase
│   │   ├── notification.service.js # Processamento de notificações
│   │   └── rabbitmq/         # Integração com RabbitMQ
│   ├── routes/               # Rotas da API
│   ├── utils/                # Utilidades
│   ├── public/               # Arquivos estáticos
│   ├── app.js                # Aplicação Express
│   └── server.js             # Ponto de entrada
├── service-account.json      # Credenciais do Firebase (não incluído no repo)
└── .env                      # Variáveis de ambiente (não incluído no repo)
```

## Documentação da API

A documentação interativa da API está disponível via Swagger:

- **Swagger UI**: `/api-docs`
- **Swagger JSON**: `/api-docs.json`
- **Doc Styled**: `/api`

Para acessar facilmente a documentação:

```powershell
npm run docs
```

### Endpoints Principais

- `GET /api/notifications`: Retorna links para todos os endpoints disponíveis
- `POST /api/notifications`: Enviar notificação individual
- `POST /api/notifications/bulk`: Enviar notificações em massa
- `GET /api/notifications/health`: Verificar estado de saúde do serviço

## Formatos das Mensagens

### Notificação Individual

```json
{
  "token": "c0_upvfUQr62sCIQOfCfrl:APA91bFgN19CkI73zEpcoeY1VjbB2ZbSZrK2xHDPBU3oTMY-0Uet1JVbf1tOAzrEtP08uJrliS2KVd-Vp80_YW2pA_RyKs_YQPz58WZhwJ0xaqJ1Ag4msRE",
  "notification": {
    "title": "Nova mensagem",
    "body": "Você recebeu uma nova mensagem de suporte"
  },
  "data": {
    "type": "message",
    "payload": {
      "messageId": "msg12345",
      "sender": "Suporte Técnico",
      "timestamp": "2025-05-18T15:00:00Z"
    }
  }
}
```

### Notificação em Massa

```json
{
  "tokens": [
    "c0_upvfUQr62sCIQOfCfrl:APA91bFgN19CkI73zEpcoeY1VjbB2ZbSZrK2xHDPBU3oTMY-0Uet1JVbf1tOAzrEtP08uJrliS2KVd-Vp80_YW2pA_RyKs_YQPz58WZhwJ0xaqJ1Ag4msRE",
    "c0_upvfUQr62sCIQOfCfrl:APA91bFgN19CkI73zEpcoeY1VjbB2ZbSZrK2xHDPBU3oTMY-0Uet1JVbf1tOAzrEtP08uJrliS2KVd-Vp80_YW2pA_RyKs_YQPz58WZhwJ0xaqJ1Ag4msRE"
  ],
  "notification": {
    "title": "Anúncio Importante",
    "body": "Atualização do sistema disponível"
  },
  "data": {
    "type": "bulk",
    "payload": {
      "updateId": "update123",
      "priority": "high",
      "timestamp": "2025-05-18T12:00:00Z"
    }
  }
}
```
