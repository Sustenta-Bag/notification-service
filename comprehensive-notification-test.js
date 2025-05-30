// comprehensive-notification-test.js
import { initializeFirebase, sendSingleNotification } from "./src/services/firebase.js";
import dotenv from "dotenv";
import colors from "colors";

dotenv.config();

async function runComprehensiveTest() {
  try {
    console.log(colors.cyan("=== Comprehensive Notification Test ==="));
    
    // Step 1: Verify environment variables
    console.log(colors.yellow("\nStep 1: Verifying Firebase Configuration"));
      const requiredEnvVars = [
      "FIREBASE_API_KEY", 
      "FIREBASE_PROJECT_ID", 
      "FIREBASE_CLIENT_EMAIL", 
      "FIREBASE_PRIVATE_KEY",
      "FIREBASE_MESSAGING_SENDER_ID"
    ];
    
    let missingVars = [];
    for (const variable of requiredEnvVars) {
      if (!process.env[variable]) {
        missingVars.push(variable);
      }
    }
    
    if (missingVars.length > 0) {
      console.error(colors.red(`Missing required environment variables: ${missingVars.join(', ')}`));
      process.exit(1);
    }
    
    console.log(colors.green("✓ All required environment variables are present"));    console.log(colors.green(`✓ Using Firebase Project ID: ${process.env.FIREBASE_PROJECT_ID}`));
    console.log(colors.green(`✓ Using Sender ID: ${process.env.FIREBASE_MESSAGING_SENDER_ID}`));
    
    // Step 2: Initialize Firebase
    console.log(colors.yellow("\nStep 2: Initializing Firebase Admin SDK"));
    const initResult = initializeFirebase();
    
    if (!initResult) {
      console.error(colors.red("Firebase initialization failed. Aborting test."));
      process.exit(1);
    }
    
    // Step 3: Get test FCM token
    console.log(colors.yellow("\nStep 3: Using test FCM token"));
    
    // Ask for token input or use a default test token
    const testToken = process.argv[2] || "fcm-token-test-123456789";
    console.log(colors.cyan(`Using FCM token: ${testToken}`));
    
    // Step 4: Send test notification
    console.log(colors.yellow("\nStep 4: Sending test notification"));
    
    const notification = {
      title: "Comprehensive Test Notification",
      body: `Test notification sent at ${new Date().toLocaleTimeString()}`,
    };
    
    const data = {
      type: "comprehensive_test",
      testId: `test-${Date.now()}`,
      timestamp: Date.now().toString(),
    };
    
    console.log(colors.cyan("Notification payload:"));
    console.log(colors.cyan(JSON.stringify({ notification, data }, null, 2)));
    
    // Send the notification
    const result = await sendSingleNotification(testToken, notification, data);
    
    // Step 5: Analyze result
    console.log(colors.yellow("\nStep 5: Analyzing notification result"));
    
    if (result.success) {
      console.log(colors.green("✓ Notification sent successfully!"));
      console.log(colors.green(`✓ Message ID: ${result.messageId}`));
    } else {
      console.error(colors.red(`✗ Notification failed: ${result.error}`));
      
      // Analyze error for common issues
      if (result.error.includes("sender")) {
        console.error(colors.red("This appears to be a SenderId mismatch issue."));
        console.error(colors.red("Check that the FIREBASE_MESSAGING_SENDER_ID matches the one in the Flutter app's firebase_options.dart file."));
      } else if (result.error.includes("token")) {
        console.error(colors.red("This appears to be an invalid token issue."));
        console.error(colors.red("Make sure you're using a valid FCM token from the correct Firebase project."));
      } else if (result.error.includes("credential")) {
        console.error(colors.red("This appears to be a credential issue."));
        console.error(colors.red("Check that your service account credentials are correct and from the same Firebase project."));
      }
    }
    
    console.log(colors.cyan("\n=== Test Complete ==="));
    
  } catch (error) {
    console.error(colors.red("Unhandled error during test:"), error);
  }
}

runComprehensiveTest();
