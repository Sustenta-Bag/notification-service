import colors from "colors";
import amqp from "amqplib";
import admin from "firebase-admin";
import dotenv from "dotenv";

dotenv.config();

// Firebase initialization
let firebaseInitialized = false;

const initializeFirebase = () => {
  if (firebaseInitialized) return true;

  try {
    console.log(colors.cyan("Initializing Firebase Admin SDK..."));

    const requiredEnvVars = {
      FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
      FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY,
      FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL
    };

    const missingVars = Object.entries(requiredEnvVars)
      .filter(([key, value]) => !value)
      .map(([key]) => key);

    if (missingVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }

    const serviceAccount = {
      type: "service_account",
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
    };

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID,
    });

    firebaseInitialized = true;
    console.log(colors.green("Firebase Admin SDK initialized successfully"));
    return true;
  } catch (error) {
    console.error(colors.red("Error initializing Firebase:"), error);
    return false;
  }
};

// Firebase messaging functions
const sendNotification = async (token, notification, data) => {
  if (!firebaseInitialized) {
    return { success: false, error: "Firebase not initialized" };
  }

  try {
    const message = {
      token,
      notification,
      data: data ? convertToStringValues(data) : undefined,
      android: { priority: "high" },
      apns: { headers: { "apns-priority": "10" } },
    };

    const response = await admin.messaging().send(message);
    console.log(colors.green(`Message sent successfully:`, response));
    return { success: true, messageId: response };
  } catch (error) {
    console.error(colors.red(`Error sending message:`, error));
    return { success: false, error: error.message };
  }
};

const sendBulkNotifications = async (tokens, notification, data) => {
  if (!firebaseInitialized) {
    return { success: false, error: "Firebase not initialized" };
  }

  let successCount = 0;
  let failureCount = 0;
  const stringData = data ? convertToStringValues(data) : undefined;

  for (const token of tokens) {
    const result = await sendNotification(token, notification, stringData);
    if (result.success) {
      successCount++;
    } else {
      failureCount++;
    }
  }

  console.log(colors.cyan(`Bulk notification complete. Success: ${successCount}, Failures: ${failureCount}`));
  return { success: true, successCount, failureCount };
};

const convertToStringValues = (data) => {
  const result = {};
  Object.entries(data).forEach(([key, value]) => {
    result[key] = typeof value === "object" ? JSON.stringify(value) : String(value);
  });
  return result;
};

const connectRabbitMQ = async (retryCount = 0, maxRetries = 5) => {
  try {
    console.log(colors.yellow(`Attempting to connect to RabbitMQ: ${process.env.RABBITMQ}`));
    const connection = await amqp.connect(process.env.RABBITMQ);
    console.log(colors.green("Successfully connected to RabbitMQ!"));
    return connection;
  } catch (err) {
    if (retryCount < maxRetries) {
      const delay = Math.pow(2, retryCount) * 1000;
      console.log(colors.red(`Failed to connect to RabbitMQ. Attempt ${retryCount + 1}/${maxRetries}`));
      console.log(colors.yellow(`Trying again in ${delay/1000} seconds...`));
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return connectRabbitMQ(retryCount + 1, maxRetries);
    } else {
      console.log(colors.red("Failed to connect to RabbitMQ after multiple attempts."));
      throw err;
    }
  }
};

// Message processing
const processNotification = async (task) => {
  console.log(colors.yellow("========================================"));
  try {
    console.log(colors.cyan("Processing notification:"), {
      to: typeof task.to === 'string' ? task.to.substring(0, 16) + '...' : Array.isArray(task.to) ? `${task.to.length} tokens` : 'INVALID',
      title: task.notification?.title,
      type: task.data?.type || "single",
    });

    if (!task.to || !task.notification) {
      throw new Error("Incomplete notification data");
    }

    const type = task.type || task.data?.type || "single";
    let result;

    if (type === "single") {
      result = await sendNotification(task.to, task.notification, task.data?.payload);
    } else if (type === "bulk") {
      if (!Array.isArray(task.to)) {
        throw new Error('For bulk notifications, "to" must be an array of tokens');
      }
      result = await sendBulkNotifications(task.to, task.notification, task.data?.payload);
    } else {
      throw new Error(`Unknown notification type: ${type}`);
    }

    console.log(colors.green(`Notification processed successfully!`));
    console.log(colors.blue(`Title: ${task.notification.title}`));
    console.log(colors.blue(`Type: ${type}`));
    
    return result;
  } catch (error) {
    console.error(colors.red("Error processing notification:"), error);
    throw error;
  }
};

// Main service setup
const startNotificationService = async () => {
  const MAX_RETRIES = parseInt(process.env.MAX_RETRIES) || 5;
  const queue = "process_notification";
  const exchange = "process_notification_exchange";
  const routingKey = "notification";

  try {
    const connection = await connectRabbitMQ();
    const channel = await connection.createChannel();

    // Setup graceful shutdown
    process.once("SIGINT", async () => {
      console.log(colors.yellow("Shutting down gracefully..."));
      await channel.close();
      await connection.close();
      process.exit(0);
    });

    // Setup queues and exchanges
    await channel.assertExchange(exchange, "direct", { durable: true });
    await channel.assertQueue(queue, { durable: true });
    await channel.assertQueue(`${queue}_dlq`, { durable: true });
    await channel.bindQueue(queue, exchange, routingKey);
    await channel.bindQueue(`${queue}_dlq`, exchange, "dlq");

    console.log(colors.green(`Consuming messages from queue: ${queue}`));
    
    // Message consumer
    await channel.consume(
      queue,
      async (message) => {
        const content = message.content.toString();
        const retries = message.properties.headers?.["x-retries"] || 0;
        
        try {
          console.log(colors.green("==> Message received:"), content);
          console.log(colors.green("===> Retry count:"), retries);

          await processNotification(JSON.parse(content));
          console.log(colors.green("====> Message processed successfully!"));
          
          channel.ack(message);
        } catch (err) {
          console.error(colors.red("Error processing message:"), err.message);
          
          if (retries < MAX_RETRIES) {
            console.log(colors.yellow("====> Retrying message..."));
            channel.sendToQueue(queue, Buffer.from(content), {
              headers: { "x-retries": retries + 1 },
              persistent: true,
            });
          } else {
            console.log(colors.red("====> Message sent to DLQ!"));
            channel.publish(exchange, "dlq", Buffer.from(content), {
              headers: { "x-retries": retries },
              persistent: true,
            });
          }
          
          channel.ack(message);
        }
      },
      { noAck: false }
    );
    
    return { connection, channel };
  } catch (err) {
    console.error(colors.red("Fatal error in service setup:"), err);
    throw err;
  }
};

export {
  initializeFirebase,
  startNotificationService,
  sendNotification,
  sendBulkNotifications,
  convertToStringValues,
  processNotification,
  connectRabbitMQ,
};
