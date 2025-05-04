import amqp from "amqplib";
import colors from "colors";
import dotenv from "dotenv";

dotenv.config();

async function connectWithRetry(retryCount = 0, maxRetries = 5) {
  const RABBITMQ = process.env.RABBITMQ;
  
  try {
    console.log(colors.yellow(`Tentando conectar ao RabbitMQ: ${RABBITMQ}`));
    const connection = await amqp.connect(RABBITMQ);
    console.log(colors.green("Conectado com sucesso ao RabbitMQ!"));
    return connection;
  } catch (err) {
    if (retryCount < maxRetries) {
      const delay = Math.pow(2, retryCount) * 1000; // Backoff exponencial
      console.log(colors.red(`Falha ao conectar ao RabbitMQ. Tentativa ${retryCount + 1}/${maxRetries}`));
      console.log(colors.yellow(`Tentando novamente em ${delay/1000} segundos...`));
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return connectWithRetry(retryCount + 1, maxRetries);
    } else {
      console.log(colors.red("Falha ao conectar ao RabbitMQ após várias tentativas."));
      throw err;
    }
  }
}

export default async (queue, exchange, routingKey, callback) => {
  const MAX_RETRIES = parseInt(process.env.MAX_RETRIES);

  try {
    const connection = await connectWithRetry();
    const channel = await connection.createChannel();

    process.once("SIGINT", async () => {
      await channel.close();
      await connection.close();
    });

    await channel.assertExchange(exchange, "direct", { durable: true });
    await channel.assertQueue(queue, { durable: true });
    await channel.assertQueue(`${queue}_dlq`, { durable: true });

    await channel.bindQueue(queue, exchange, routingKey);
    await channel.bindQueue(`${queue}_dlq`, exchange, "dlq");

    console.log(colors.green(`Consumindo mensagens da fila: ${queue}`));
    
    await channel.consume(
      queue,
      (message) => {
        const content = message.content.toString();
        const retries = message.properties.headers?.["x-retries"] || 0;

        try {
          console.log(colors.green("==> Mensagem recebida:"), content);
          console.log(colors.green("===> Quantidade de tentativas:"), retries);

          callback(JSON.parse(content));
          console.log(colors.green("====> Mensagem processada!"));
        } catch (err) {
          console.error(colors.red("Erro ao processar mensagem:"), err.message);
          
          if (retries < MAX_RETRIES) {
            console.log(colors.yellow("====> Realizando outra tentativa!"));
            channel.sendToQueue(queue, Buffer.from(content), {
              headers: { "x-retries": retries + 1},
              persistent: true,
            });
          } else {
            console.log(colors.red("====> Mensagem enviada para DLQ!"));
            channel.publish(exchange, "dlq", Buffer.from(content), {
              headers: { "x-retries": retries },
              persistent: true,
            });
          }
        } finally {
          channel.ack(message);
        }
      },
      { noAck: false }
    );
  } catch (err) {
    console.error(colors.red("Erro fatal na configuração do consumidor:"), err);
    process.exit(1);
  }
};