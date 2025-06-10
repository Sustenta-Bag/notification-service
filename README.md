# Serviço de Notificações

Microsserviço simples para envio de notificações push via Firebase Cloud Messaging (FCM) com integração RabbitMQ.

## Funcionalidades

- 🚀 Integração com Firebase Cloud Messaging (FCM)
- 📨 Suporte a notificações individuais e em massa
- 🐰 Processamento de filas com RabbitMQ
- 🔄 Mecanismo de retry automático com backoff exponencial
- 💀 Dead Letter Queue (DLQ) para mensagens falhadas
- 🐳 Suporte ao Docker

## Início Rápido

### 1. Configuração do Ambiente

Copie o arquivo de ambiente e configure suas variáveis:

```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas credenciais do Firebase e RabbitMQ.

### 2. Instalar Dependências

```bash
npm install
```

### 3. Executar o Serviço

```bash
# Desenvolvimento
npm run dev

# Produção
npm start
```

### 4. Docker (Opcional)

```bash
# Build
docker build -t notification-service .

# Executar
docker run --env-file .env notification-service
```

## Formato das Mensagens

Envie mensagens para a fila `process_notification` com este formato:

### Notificação Individual
```json
{
  "to": "token_dispositivo_firebase_aqui",
  "notification": {
    "title": "Título da Notificação",
    "body": "Corpo da mensagem de notificação"
  },
  "data": {
    "type": "single",
    "payload": {
      "campo_customizado": "valor_customizado"
    }
  }
}
```

### Notificação em Massa
```json
{
  "to": ["token1", "token2", "token3"],
  "notification": {
    "title": "Notificação em Massa",
    "body": "Mensagem para múltiplos dispositivos"
  },
  "data": {
    "type": "bulk",
    "payload": {
      "campaign_id": "123"
    }
  }
}
```

## Configuração

| Variável | Descrição | Obrigatório |
|----------|-----------|-------------|
| `RABBITMQ` | URL de conexão do RabbitMQ | ✅ |
| `MAX_RETRIES` | Número máximo de tentativas | ✅ |
| `FIREBASE_PROJECT_ID` | ID do projeto Firebase | ✅ |
| `FIREBASE_CLIENT_EMAIL` | Email da conta de serviço Firebase | ✅ |
| `FIREBASE_PRIVATE_KEY` | Chave privada da conta de serviço Firebase | ✅ |

## Estrutura do Projeto

```
src/
├── server.js              # Ponto de entrada principal da aplicação
└── notification-service.js # Lógica principal de notificações
```

## Tratamento de Erros

- **Lógica de Retry**: Mensagens são reprocessadas até `MAX_RETRIES` vezes com backoff exponencial
- **Dead Letter Queue**: Mensagens falhadas após máximo de tentativas são enviadas para `{queue}_dlq`
- **Shutdown Gracioso**: Limpeza adequada dos recursos em sinais SIGINT/SIGTERM

## Monitoramento

O serviço fornece logs coloridos no console para fácil monitoramento:
- 🟢 **Verde**: Operações bem-sucedidas
- 🟡 **Amarelo**: Avisos e tentativas de retry  
- 🔴 **Vermelho**: Erros e falhas
- 🔵 **Azul**: Informações e debugging

## Configuração do Firebase

1. Crie um projeto no [Firebase Console](https://console.firebase.google.com/)
2. Vá para Configurações do Projeto > Contas de Serviço
3. Clique em "Gerar nova chave privada" 
4. Baixe o arquivo JSON
5. Extraia os valores e preencha as variáveis no arquivo `.env`:
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY`

## Exemplos de Uso

### Enviando Notificação via RabbitMQ

```javascript
const message = {
  to: "c0_upvfUQr62sCIQOfCfrl:APA91bFgN19...",
  notification: {
    title: "Nova mensagem",
    body: "Você tem uma nova mensagem!"
  },
  data: {
    type: "single",
    payload: {
      messageId: "123",
      userId: "456"
    }
  }
};

// Publique na fila process_notification
channel.publish('process_notification_exchange', 'notification', Buffer.from(JSON.stringify(message)));
```

## Licença

MIT
