// src/services/firebase.js
import admin from "firebase-admin";
import colors from "colors";

let initialized = false;

export const initializeFirebase = () => {
  if (initialized) return true;

  try {
    console.log(
      colors.cyan(
        `Initializing Firebase Admin SDK`
      )
    );

    // Validate required environment variables
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

    console.log(colors.cyan(`Environment variables loaded successfully`));
    console.log(colors.cyan(`Project ID: ${process.env.FIREBASE_PROJECT_ID}`));
    console.log(colors.cyan(`Client Email: ${process.env.FIREBASE_CLIENT_EMAIL}`));

    const serviceAccount = {
      type: "service_account",
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: "",
      private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: "",
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    };

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID,
    });

    initialized = true;
    console.log(colors.green("Firebase Admin SDK initialized successfully"));
    return true;
  } catch (error) {
    console.error(colors.red("Error initializing Firebase:"), error);
    return false;
  }
};

export const sendSingleNotification = async (token, notification, data) => {
  if (!initialized) {
    console.warn(
      colors.yellow("Firebase not initialized. Skipping notification.")
    );
    return { success: false, error: "Firebase not initialized" };
  }

  try {
    if (!token) {
      console.warn(
        colors.yellow("No device token provided. Skipping notification.")
      );
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
      details: error.toString(),
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
            console.error(
              colors.red(`Error sending to token ${token.substring(0, 8)}...`),
              err
            );
            return { success: false, error: err };
          }
        })
      );

      const batchSuccessCount = messageResponses.filter(
        (r) => r.success
      ).length;
      const batchFailureCount = messageResponses.filter(
        (r) => !r.success
      ).length;

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
