import dotenv from "dotenv";
import connection from "./services/connection.js";
import colors from "colors";
import './health.js'; // Importa o servidor de health check

// Mensagem de banner para fácil identificação nos logs
console.log(colors.rainbow('========================================'));
console.log(colors.bold.green('  SERVIÇO DE NOTIFICAÇÃO INICIADO'));
console.log(colors.rainbow('========================================'));

// Carregar variáveis de ambiente
dotenv.config();

// Verificar se as variáveis essenciais estão definidas
const requiredEnvVars = ['RABBITMQ', 'MAX_RETRIES'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error(colors.red(`ERRO: Variáveis de ambiente obrigatórias não definidas: ${missingEnvVars.join(', ')}`));
  process.exit(1);
}

console.log(colors.blue('Informações de ambiente:'));
console.log(colors.blue(`- NODE_ENV: ${process.env.NODE_ENV}`));
console.log(colors.blue(`- RABBITMQ: ${process.env.RABBITMQ.replace(/:\/\/.*:.*@/, '://***:***@')}`)); // Esconde credenciais nos logs
console.log(colors.blue(`- MAX_RETRIES: ${process.env.MAX_RETRIES}`));

// Configuração da fila
const queue = "process_notification";
const exchange = "process_notification_exchange";
const routingKey = "notification";

// Função que processa notificações
const processNotification = async (task) => {
  try {
    console.log(colors.cyan("Processando notificação:"), {
      to: task.to,
      title: task.notification.title,
      type: task.data.type
    });
    
    // Se houver um callback definido, chama o endpoint
    if (task.data?.callback?.href) {
      console.log(colors.yellow(`Chamando callback: ${task.data.callback.href}`));
      
      const response = await fetch(task.data.callback.href, {
        method: task.data.callback.method || 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'delivered',
          notificationId: task.data.payload?.correlationId,
          timestamp: new Date()
        })
      });
      
      if (!response.ok) {
        throw new Error(`Erro ao chamar callback: ${response.status} ${response.statusText}`);
      }
      
      console.log(colors.green("Callback processado com sucesso"));
    } else {
      console.log(colors.yellow("Nenhum callback definido para esta notificação"));
    }
    
    // Aqui você implementaria a lógica para enviar a notificação ao destinatário
    // Por exemplo, usando Firebase Cloud Messaging, SendGrid, etc.
    console.log(colors.green("Notificação enviada com sucesso!"));
  } catch (error) {
    console.error(colors.red("Erro ao processar notificação:"), error);
    throw error; // Propaga o erro para ser tratado pelo mecanismo de retry
  }
};

// Inicia o consumidor
try {
  connection(queue, exchange, routingKey, processNotification);
  console.log(colors.green("Consumidor de notificações iniciado com sucesso!"));
} catch (error) {
  console.error(colors.red("Erro fatal ao iniciar o consumidor:"), error);
  process.exit(1);
}

// Tratamento de sinais para encerramento limpo
process.on('SIGTERM', () => {
  console.log(colors.yellow('Recebido sinal SIGTERM, encerrando graciosamente...'));
  // Aqui você pode adicionar lógica para encerrar conexões
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log(colors.yellow('Recebido sinal SIGINT, encerrando graciosamente...'));
  // Aqui você pode adicionar lógica para encerrar conexões
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  console.error(colors.red('Exceção não tratada:'), error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(colors.red('Promessa rejeitada não tratada:'), reason);
});