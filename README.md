# Serviço de Notificações

Microserviço RESTful para envio de notificações via Firebase Cloud Messaging (FCM), com integração RabbitMQ.

## Características

- API RESTful com HATEOAS (Hypermedia as the Engine of Application State)
- Documentação Swagger interativa
- Integração com Firebase Cloud Messaging (FCM)
- Processamento individual e em massa de notificações push
- Consumidor RabbitMQ para processamento assíncrono
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
