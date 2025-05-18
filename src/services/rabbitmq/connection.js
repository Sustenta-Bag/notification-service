// src/services/rabbitmq/connection.js
import amqp from "amqplib";
import colors from "colors";
import config from "../../config/env.js";

async function connectWithRetry(retryCount = 0, maxRetries = 5) {
  const RABBITMQ = config.rabbitmq.url;
  
  try {
    console.log(colors.yellow(`Attempting to connect to RabbitMQ: ${RABBITMQ}`));
    const connection = await amqp.connect(RABBITMQ);
    console.log(colors.green("Successfully connected to RabbitMQ!"));
    return connection;
  } catch (err) {
    if (retryCount < maxRetries) {
      const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
      console.log(colors.red(`Failed to connect to RabbitMQ. Attempt ${retryCount + 1}/${maxRetries}`));
      console.log(colors.yellow(`Trying again in ${delay/1000} seconds...`));
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return connectWithRetry(retryCount + 1, maxRetries);
    } else {
      console.log(colors.red("Failed to connect to RabbitMQ after multiple attempts."));
      throw err;
    }
  }
}

export default async (queue, exchange, routingKey, callback) => {
  const MAX_RETRIES = config.rabbitmq.maxRetries;

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

    console.log(colors.green(`Consuming messages from queue: ${queue}`));
    
    await channel.consume(
      queue,
      (message) => {
        const content = message.content.toString();
        const retries = message.properties.headers?.["x-retries"] || 0;
        try {
          console.log(colors.green("==> Message received:"), content);
          console.log(colors.green("===> Retry count:"), retries);

          callback(JSON.parse(content));
          console.log(colors.green("====> Message processed!"));
        } catch (err) {
          console.error(colors.red("Error processing message:"), err.message);
          
          if (retries < MAX_RETRIES) {
            console.log(colors.yellow("====> Attempting another retry!"));
            channel.sendToQueue(queue, Buffer.from(content), {
              headers: { "x-retries": retries + 1},
              persistent: true,
            });
          } else {
            console.log(colors.red("====> Message sent to DLQ!"));
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
    
    return { connection, channel };
  } catch (err) {
    console.error(colors.red("Fatal error in consumer setup:"), err);
    throw err;
  }
};
