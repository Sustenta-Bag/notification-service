# Arquitetura do Notification Service

## Visão Geral

O microserviço foi refatorado para usar uma **arquitetura em camadas simples** que mantém a simplicidade original mas melhora significativamente a organização e manutenibilidade do código.

## Estrutura de Camadas

```
src/
├── config/           # Configurações e variáveis de ambiente
├── utils/           # Utilitários (logger, helpers)
├── services/        # Serviços de integração (Firebase, RabbitMQ)
├── controllers/     # Lógica de processamento de negócio
├── server.js        # Entry point da aplicação
└── notification-service.js  # Orquestração principal
```

## Responsabilidades das Camadas

### 1. **Config Layer** (`src/config/`)
- **Responsabilidade**: Centralizar configurações e validação de variáveis de ambiente
- **Benefícios**: 
  - Um lugar único para todas as configurações
  - Validação automática no startup
  - Fácil de testar e mockar

### 2. **Utils Layer** (`src/utils/`)
- **Responsabilidade**: Utilitários reutilizáveis (logging, helpers)
- **Benefícios**:
  - Logging consistente em todo o aplicativo
  - Fácil de personalizar e estender
  - Melhor debugging

### 3. **Services Layer** (`src/services/`)
- **Responsabilidade**: Integração com serviços externos (Firebase, RabbitMQ)
- **Benefícios**:
  - Encapsulamento da lógica de integração
  - Fácil de testar com mocks
  - Reutilização de código

### 4. **Controllers Layer** (`src/controllers/`)
- **Responsabilidade**: Lógica de processamento de negócio
- **Benefícios**:
  - Separação clara entre integração e negócio
  - Fácil de testar unitariamente
  - Fácil de adicionar novos tipos de notificação