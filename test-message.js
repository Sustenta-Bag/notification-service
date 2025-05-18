// test-message.js
import amqp from "amqplib";
import dotenv from "dotenv";

dotenv.config();

async function sendTestMessage() {
  try {
    // Use the same RabbitMQ URI as in your application
    const connection = await amqp.connect(process.env.RABBITMQ);
    const channel = await connection.createChannel();
    
    // Use the same exchange, queue and routing key names
    const exchange = "process_notification_exchange";
    const routingKey = "notification";
    
    await channel.assertExchange(exchange, "direct", { durable: true });
    
    // Sample FCM token from the Flutter app
    // Replace this with a real token from your testing device
    const testToken = "c0_upvfUQr62sCIQOfCfrl:APA91bFeSvek2u6kYpegzTkzMmJXyedpjmxvSqQZ_V1jlc_8ZTyRxVxookc5ZGpQ8SSN4qNeL6ZsdqNEPhbSv6GpiSrM464GLaRLg7lWhKue0i85wS9KQlI";
    
    // Create a test notification message
    const message = {
      to: testToken,
      notification: {
        title: "Test Notification",
        body: "This is a test notification from the microservice",
      },
      data: {
        type: "single",
        payload: {
          action: "openApp",
          screen: "home",
        }
      }
    };
    
    // Publish the message
    channel.publish(
      exchange,
      routingKey,
      Buffer.from(JSON.stringify(message)),
      { persistent: true }
    );
    
    console.log("Test message sent to RabbitMQ");
    
    // Close the connection
    setTimeout(() => {
      connection.close();
      console.log("Connection closed");
    }, 500);
  } catch (error) {
    console.error("Error sending test message:", error);
  }
}

sendTestMessage();
