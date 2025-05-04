import admin from "firebase-admin";
import dotenv from "dotenv";
import colors from "colors";

dotenv.config();

let initialized = false;

// Initialize Firebase Admin SDK
export const initializeFirebase = () => {
  if (initialized) return;

  try {
    // Check for required Firebase configuration
    if (!process.env.FCM_API_KEY) {
      console.warn(
        colors.yellow(
          "Firebase Cloud Messaging API key not found in environment variables"
        )
      );
      return false;
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FCM_PROJECT_ID,
        clientEmail: process.env.FCM_CLIENT_EMAIL,
        privateKey: process.env.FCM_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
    });

    initialized = true;
    console.log(colors.green("Firebase Admin SDK initialized successfully"));
    return true;
  } catch (error) {
    console.error(colors.red("Error initializing Firebase:"), error);
    return false;
  }
};

// Send notification to a single device
export const sendSingleNotification = async (token, notification, data) => {
  if (!initialized) {
    console.warn(
      colors.yellow("Firebase not initialized. Skipping notification.")
    );
    return false;
  }

  const message = {
    token,
    notification,
    data: data ? convertToStringValues(data) : undefined,
    android: {
      priority: "high",
    },
    apns: {
      headers: {
        "apns-priority": "10",
      },
    },
  };

  try {
    const response = await admin.messaging().send(message);
    console.log(
      colors.green(`Successfully sent message to ${token.substring(0, 8)}...`),
      response
    );
    return true;
  } catch (error) {
    console.error(
      colors.red(`Error sending message to ${token.substring(0, 8)}...`),
      error
    );
    throw error;
  }
};

// Send notifications to multiple devices (up to 500 at once)
export const sendBulkNotifications = async (tokens, notification, data) => {
  if (!initialized) {
    console.warn(
      colors.yellow("Firebase not initialized. Skipping notifications.")
    );
    return false;
  }

  if (!tokens || tokens.length === 0) {
    console.warn(colors.yellow("No tokens provided for bulk notification."));
    return false;
  }

  const stringData = data ? convertToStringValues(data) : undefined;

  // FCM allows a maximum of 500 tokens per request
  const maxTokensPerRequest = 500;
  let successCount = 0;
  let failureCount = 0;

  // Process tokens in batches
  for (let i = 0; i < tokens.length; i += maxTokensPerRequest) {
    const batch = tokens.slice(i, i + maxTokensPerRequest);

    const messages = batch.map((token) => ({
      token,
      notification,
      data: stringData,
      android: {
        priority: "high",
      },
      apns: {
        headers: {
          "apns-priority": "10",
        },
      },
    }));

    try {
      const response = await admin.messaging().sendAll(messages);
      successCount += response.successCount;
      failureCount += response.failureCount;

      console.log(
        colors.green(
          `Batch ${Math.floor(i / maxTokensPerRequest) + 1} results:`
        ),
        `Success: ${response.successCount}, Failures: ${response.failureCount}`
      );
    } catch (error) {
      console.error(
        colors.red(
          `Error sending batch ${Math.floor(i / maxTokensPerRequest) + 1}:`
        ),
        error
      );
      failureCount += batch.length;
    }
  }

  console.log(
    colors.cyan(
      `Bulk notification complete. Success: ${successCount}, Failures: ${failureCount}`
    )
  );
  return { successCount, failureCount };
};

// FCM requires all data values to be strings
const convertToStringValues = (data) => {
  const result = {};
  Object.entries(data).forEach(([key, value]) => {
    result[key] =
      typeof value === "object" ? JSON.stringify(value) : String(value);
  });
  return result;
};
