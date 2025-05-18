// src/services/firebase.js
import admin from "firebase-admin";
import colors from "colors";
import config from "../config/env.js";

let initialized = false;

export const initializeFirebase = () => {
  if (initialized) return true;

  try {
    const serviceAccountPath = config.firebase.serviceAccountPath;
    
    console.log(colors.cyan(`Initializing Firebase Admin SDK using service account: ${serviceAccountPath}`));
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccountPath)
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
    return { success: false, error: "Firebase not initialized" };
  }

  try {
    if (!token) {
      console.warn(colors.yellow("No device token provided. Skipping notification."));
      return { success: false, error: "No device token provided" };
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

    const response = await admin.messaging().send(message);
    console.log(
      colors.green(`Successfully sent message to ${token.substring(0, 8)}...`),
      response
    );
    return { success: true, messageId: response };
  } catch (error) {
    console.error(
      colors.red(`Error sending message to ${token.substring(0, 8)}...`),
      error
    );
    const errorMessage = error.message || "Unknown error";
    const errorCode = error.code || "unknown";
    return { 
      success: false, 
      error: errorMessage,
      code: errorCode,
      details: error.toString()
    };
  }
};

export const sendBulkNotifications = async (tokens, notification, data) => {
  if (!initialized) {
    console.warn(
      colors.yellow("Firebase not initialized. Skipping notifications.")
    );
    return { success: false, error: "Firebase not initialized" };
  }

  if (!tokens || tokens.length === 0) {
    console.warn(colors.yellow("No tokens provided for bulk notification."));
    return { success: false, error: "No tokens provided" };
  }

  const stringData = data ? convertToStringValues(data) : undefined;

  const maxTokensPerRequest = 500;
  let successCount = 0;
  let failureCount = 0;

  for (let i = 0; i < tokens.length; i += maxTokensPerRequest) {
    const batch = tokens.slice(i, i + maxTokensPerRequest);

    try {
      // Since sendMulticast is not available, we'll send messages individually
      const messageResponses = await Promise.all(
        batch.map(async (token) => {
          try {
            const message = {
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
            };

            const response = await admin.messaging().send(message);
            return { success: true, messageId: response };
          } catch (err) {
            console.error(colors.red(`Error sending to token ${token.substring(0, 8)}...`), err);
            return { success: false, error: err };
          }
        })
      );
      
      // Count successes and failures
      const batchSuccessCount = messageResponses.filter(r => r.success).length;
      const batchFailureCount = messageResponses.filter(r => !r.success).length;
      
      successCount += batchSuccessCount;
      failureCount += batchFailureCount;

      console.log(
        colors.green(
          `Batch ${Math.floor(i / maxTokensPerRequest) + 1} results:`
        ),
        `Success: ${batchSuccessCount}, Failures: ${batchFailureCount}`
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
  return { success: true, successCount, failureCount };
};

const convertToStringValues = (data) => {
  const result = {};
  Object.entries(data).forEach(([key, value]) => {
    result[key] =
      typeof value === "object" ? JSON.stringify(value) : String(value);
  });
  return result;
};
