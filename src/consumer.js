import dotenv from "dotenv";
import connection from "./services/connection.js";
import colors from "colors";
import {
  initializeFirebase,
  sendSingleNotification,
  sendBulkNotifications,
} from "./services/firebase.js";

dotenv.config();
initializeFirebase();

const queue = "process_notification";
const exchange = "process_notification_exchange";
const routingKey = "notification";

const processNotification = async (task) => {
  console.log(colors.yellow("---------=----------"));
  try {
    console.log(colors.cyan("Processando notificação:"), {
      to: task.to,
      title: task.notification?.title,
      type: task.data?.type || "UNKNOWN",
    });

    // Verifica se temos dados suficientes para processar a notificação
    if (!task.to || !task.notification) {
      throw new Error("Dados de notificação incompletos");
    }

    // Implementação da lógica para enviar a notificação usando Firebase Cloud Messaging
    const type = task.data?.type || "single";
    let result;

    if (type === "single") {
      // Para notificações individuais, 'to' deve ser o token FCM do dispositivo
      result = await sendSingleNotification(
        task.to,
        {
          title: task.notification.title,
          body: task.notification.body,
        },
        task.data?.payload
      );

      // Após o envio da notificação
      console.log(
        colors.green(`Notificação enviada com sucesso para o Firebase`)
      );
      console.log(
        colors.blue(`Resposta do Firebase: ${JSON.stringify(result)}`)
      );
    } else if (type === "bulk") {
      // Para notificações em massa, 'to' deve ser um array de tokens FCM
      if (!Array.isArray(task.to)) {
        throw new Error(
          'Para notificações em massa (bulk), o campo "to" deve ser um array de tokens'
        );
      }

      result = await sendBulkNotifications(
        task.to,
        {
          title: task.notification.title,
          body: task.notification.body,
        },
        task.data?.payload
      );
    } else {
      throw new Error(`Tipo de notificação desconhecido: ${type}`);
    }

    // Logs para monitoramento
    console.log(colors.green(`Notificação processada com sucesso`));
    console.log(colors.blue(`Título: ${task.notification.title}`));
    console.log(colors.blue(`Conteúdo: ${task.notification.body}`));
    console.log(colors.blue(`Tipo: ${type}`));

    return result;
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

// Adicione os tratamentos de sinal que estão em health.js

// Tratamento de sinais para encerramento limpo
process.on("SIGTERM", () => {
  console.log(
    colors.yellow("Recebido sinal SIGTERM, encerrando graciosamente...")
  );
  // Aqui você pode adicionar lógica para encerrar conexões
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log(
    colors.yellow("Recebido sinal SIGINT, encerrando graciosamente...")
  );
  // Aqui você pode adicionar lógica para encerrar conexões
  process.exit(0);
});

process.on("uncaughtException", (error) => {
  console.error(colors.red("Exceção não tratada:"), error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error(colors.red("Promessa rejeitada não tratada:"), reason);
});
