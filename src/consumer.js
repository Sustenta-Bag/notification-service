import dotenv from "dotenv";
import connection from "./services/connection.js";

dotenv.config();

const queue = "process_notification";
const exchange = "process_notification_exchange";
const routingKey = "notification";

connection(queue, exchange, routingKey, (task) => {
  fetch(task.data.callback.href, {
    method: task.data.callback.method,
  });
});