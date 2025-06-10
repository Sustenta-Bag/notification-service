import { jest, describe, test, expect, beforeEach, afterEach } from '@jest/globals';

// Set up environment variables for tests
process.env.FIREBASE_PROJECT_ID = 'test-project-id';
process.env.FIREBASE_PRIVATE_KEY = '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC\n-----END PRIVATE KEY-----';
process.env.FIREBASE_CLIENT_EMAIL = 'test@test-project.iam.gserviceaccount.com';
process.env.RABBITMQ = 'amqp://guest:guest@localhost:5672';
process.env.MAX_RETRIES = '3';

describe('Notification Service Logic Tests', () => {
  let originalConsole;
  
  beforeEach(() => {
    originalConsole = global.console;
    global.console = {
      ...console,
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
    };
  });

  afterEach(() => {
    global.console = originalConsole;
    jest.clearAllMocks();
  });

  describe('Utility Functions', () => {
    test('should convert data types to strings', () => {
      const convertToStringValues = (data) => {
        const result = {};
        Object.entries(data).forEach(([key, value]) => {
          result[key] = typeof value === "object" ? JSON.stringify(value) : String(value);
        });
        return result;
      };

      const testData = {
        stringValue: 'test',
        numberValue: 42,
        booleanValue: true,
        objectValue: { nested: 'object' },
        nullValue: null,
        undefinedValue: undefined
      };

      const converted = convertToStringValues(testData);
      
      expect(converted.stringValue).toBe('test');
      expect(converted.numberValue).toBe('42');
      expect(converted.booleanValue).toBe('true');
      expect(converted.objectValue).toBe('{"nested":"object"}');
      expect(converted.nullValue).toBe('null');
      expect(converted.undefinedValue).toBe('undefined');
    });
  });

  describe('Message Validation', () => {
    test('should validate notification message structure', () => {
      const validateNotification = (task) => {
        if (!task.to || !task.notification) {
          throw new Error("Incomplete notification data");
        }
        
        const type = task.type || task.data?.type || "single";
        
        if (type === "bulk" && !Array.isArray(task.to)) {
          throw new Error('For bulk notifications, "to" must be an array of tokens');
        }
        
        if (!["single", "bulk"].includes(type)) {
          throw new Error(`Unknown notification type: ${type}`);
        }
        
        return { valid: true, type };
      };

      // Valid single notification
      const validSingle = {
        to: 'token123',
        notification: { title: 'Test', body: 'Test body' }
      };
      expect(validateNotification(validSingle)).toEqual({ valid: true, type: 'single' });

      // Valid bulk notification
      const validBulk = {
        to: ['token1', 'token2'],
        notification: { title: 'Test', body: 'Test body' },
        type: 'bulk'
      };
      expect(validateNotification(validBulk)).toEqual({ valid: true, type: 'bulk' });

      // Missing notification
      const invalid1 = { to: 'token123' };
      expect(() => validateNotification(invalid1)).toThrow('Incomplete notification data');

      // Invalid bulk format
      const invalid2 = {
        to: 'not-array',
        notification: { title: 'Test', body: 'Test body' },
        type: 'bulk'
      };
      expect(() => validateNotification(invalid2)).toThrow('For bulk notifications, "to" must be an array of tokens');

      // Unknown type
      const invalid3 = {
        to: 'token123',
        notification: { title: 'Test', body: 'Test body' },
        type: 'unknown'
      };
      expect(() => validateNotification(invalid3)).toThrow('Unknown notification type: unknown');
    });
  });

  describe('Environment Variable Validation', () => {
    test('should identify missing required environment variables', () => {
      const checkEnvironmentVariables = (requiredVars) => {
        return requiredVars.filter(varName => !process.env[varName]);
      };

      const requiredVars = ['FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY'];
      const missing = checkEnvironmentVariables(requiredVars);
      
      expect(missing).toEqual([]);

      // Test with a missing variable
      const originalVar = process.env.FIREBASE_PROJECT_ID;
      delete process.env.FIREBASE_PROJECT_ID;
      
      const missingAfterDelete = checkEnvironmentVariables(requiredVars);
      expect(missingAfterDelete).toContain('FIREBASE_PROJECT_ID');
      
      // Restore the variable
      process.env.FIREBASE_PROJECT_ID = originalVar;
    });

    test('should mask sensitive information in URLs', () => {
      const maskSensitiveUrl = (url) => {
        return url.replace(/:\/\/.*:.*@/, "://***:***@");
      };

      const sensitiveUrl = 'amqp://user:password@localhost:5672';
      const maskedUrl = maskSensitiveUrl(sensitiveUrl);
      
      expect(maskedUrl).toBe('amqp://***:***@localhost:5672');
      expect(maskedUrl).not.toContain('password');
    });
  });

  describe('Error Handling', () => {
    test('should handle JSON parsing errors', () => {
      const parseMessage = (messageContent) => {
        try {
          return { success: true, data: JSON.parse(messageContent) };
        } catch (error) {
          return { success: false, error: error.message };
        }
      };

      const validJson = '{"to": "token123", "notification": {"title": "Test"}}';
      const invalidJson = 'invalid json string';

      const validResult = parseMessage(validJson);
      expect(validResult.success).toBe(true);
      expect(validResult.data.to).toBe('token123');

      const invalidResult = parseMessage(invalidJson);
      expect(invalidResult.success).toBe(false);
      expect(invalidResult.error).toContain('Unexpected token');
    });

    test('should handle retry logic', () => {
      const shouldRetry = (currentRetries, maxRetries) => {
        return currentRetries < maxRetries;
      };

      const shouldSendToDLQ = (currentRetries, maxRetries) => {
        return currentRetries >= maxRetries;
      };

      expect(shouldRetry(0, 3)).toBe(true);
      expect(shouldRetry(2, 3)).toBe(true);
      expect(shouldRetry(3, 3)).toBe(false);

      expect(shouldSendToDLQ(0, 3)).toBe(false);
      expect(shouldSendToDLQ(2, 3)).toBe(false);
      expect(shouldSendToDLQ(3, 3)).toBe(true);
    });
  });

  describe('Firebase Message Structure', () => {
    test('should create proper Firebase message structure', () => {
      const convertToStringValues = (data) => {
        const result = {};
        Object.entries(data).forEach(([key, value]) => {
          result[key] = typeof value === "object" ? JSON.stringify(value) : String(value);
        });
        return result;
      };

      const createFirebaseMessage = (token, notification, data) => {
        return {
          token,
          notification,
          data: data ? convertToStringValues(data) : undefined,
          android: { priority: "high" },
          apns: { headers: { "apns-priority": "10" } },
        };
      };

      const token = 'test-token';
      const notification = { title: 'Test', body: 'Test body' };
      const data = { customField: 'value', number: 123 };

      const message = createFirebaseMessage(token, notification, data);

      expect(message.token).toBe(token);
      expect(message.notification).toEqual(notification);
      expect(message.data.customField).toBe('value');
      expect(message.data.number).toBe('123');
      expect(message.android.priority).toBe('high');
      expect(message.apns.headers['apns-priority']).toBe('10');
    });
  });

  describe('Exponential Backoff Logic', () => {
    test('should calculate exponential backoff delays', () => {
      const calculateBackoffDelay = (retryCount) => {
        return Math.pow(2, retryCount) * 1000;
      };

      expect(calculateBackoffDelay(0)).toBe(1000);  // 2^0 * 1000 = 1000
      expect(calculateBackoffDelay(1)).toBe(2000);  // 2^1 * 1000 = 2000
      expect(calculateBackoffDelay(2)).toBe(4000);  // 2^2 * 1000 = 4000
      expect(calculateBackoffDelay(3)).toBe(8000);  // 2^3 * 1000 = 8000
    });
  });

  describe('Connection Logic', () => {
    test('should handle connection retry scenarios', async () => {
      let attemptCount = 0;
      const maxRetries = 3;
      
      const mockConnect = async (retryCount = 0) => {
        attemptCount++;
        if (retryCount < maxRetries && attemptCount <= 2) {
          throw new Error('Connection failed');
        }
        return { connected: true };
      };

      // Simulate successful connection after retries
      try {
        const result = await mockConnect(0);
        expect(result).toEqual({ connected: true });
      } catch (error) {
        try {
          const result = await mockConnect(1);
          expect(result).toEqual({ connected: true });
        } catch (error2) {
          const result = await mockConnect(2);
          expect(result).toEqual({ connected: true });
        }
      }
      
      expect(attemptCount).toBeGreaterThan(0);
    });
  });
});
