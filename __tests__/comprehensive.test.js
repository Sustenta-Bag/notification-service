import { jest, describe, test, expect, beforeEach, afterEach } from '@jest/globals';

// Set up environment variables first
process.env.FIREBASE_PROJECT_ID = 'test-project-id';
process.env.FIREBASE_PRIVATE_KEY = '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC\n-----END PRIVATE KEY-----';
process.env.FIREBASE_CLIENT_EMAIL = 'test@test-project.iam.gserviceaccount.com';
process.env.RABBITMQ = 'amqp://guest:guest@localhost:5672';
process.env.MAX_RETRIES = '3';

// Mock external dependencies with simpler approach
const mockSend = jest.fn().mockResolvedValue('message-id-123');

const mockFirebaseAdmin = {
  initializeApp: jest.fn(),
  credential: {
    cert: jest.fn(() => ({}))
  },
  messaging: jest.fn(() => ({
    send: mockSend
  }))
};

const mockAmqpChannel = {
  assertExchange: jest.fn().mockResolvedValue(true),
  assertQueue: jest.fn().mockResolvedValue(true),
  bindQueue: jest.fn().mockResolvedValue(true),
  consume: jest.fn().mockImplementation((queue, handler) => {
    // Store the handler for later testing
    mockAmqpChannel._messageHandler = handler;
    return Promise.resolve();
  }),
  sendToQueue: jest.fn(),
  publish: jest.fn(),
  ack: jest.fn(),
  close: jest.fn()
};

const mockAmqpConnection = {
  createChannel: jest.fn().mockResolvedValue(mockAmqpChannel),
  close: jest.fn()
};

const mockAmqp = {
  connect: jest.fn().mockResolvedValue(mockAmqpConnection)
};

const mockColors = {
  cyan: jest.fn(str => str),
  green: jest.fn(str => str),
  red: jest.fn(str => str),
  yellow: jest.fn(str => str),
  blue: jest.fn(str => str),
  rainbow: jest.fn(str => str),
  bold: { green: jest.fn(str => str) }
};

// Mock modules
jest.unstable_mockModule('firebase-admin', () => ({ default: mockFirebaseAdmin }));
jest.unstable_mockModule('amqplib', () => ({ default: mockAmqp }));
jest.unstable_mockModule('colors', () => ({ default: mockColors }));
jest.unstable_mockModule('dotenv', () => ({ default: { config: jest.fn() } }));

describe('Notification Service Full Coverage Tests', () => {
  let originalConsole;
  let notificationService;

  beforeEach(async () => {
    // Suppress console output
    originalConsole = global.console;
    global.console = {
      ...console,
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
    };

    jest.clearAllMocks();
    
    // Reset the mocks to default behavior
    mockFirebaseAdmin.initializeApp.mockImplementation(() => {});
    mockAmqp.connect.mockResolvedValue(mockAmqpConnection);
    
    // Import the module fresh
    notificationService = await import('../src/notification-service.js');
  });

  afterEach(() => {
    global.console = originalConsole;
    jest.resetModules();
  });

  describe('Firebase Initialization', () => {
    test('should initialize Firebase successfully with valid environment', () => {
      const result = notificationService.initializeFirebase();
      
      expect(result).toBe(true);
      expect(mockFirebaseAdmin.credential.cert).toHaveBeenCalledWith({
        type: "service_account",
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
      });
      expect(mockFirebaseAdmin.initializeApp).toHaveBeenCalled();
    });

    test('should return true if already initialized', () => {
      // First call
      notificationService.initializeFirebase();
      // Second call should return true without re-initializing
      const result = notificationService.initializeFirebase();
      
      expect(result).toBe(true);
      expect(mockFirebaseAdmin.initializeApp).toHaveBeenCalledTimes(1);
    });

    test('should handle missing FIREBASE_PROJECT_ID', () => {
      const original = process.env.FIREBASE_PROJECT_ID;
      delete process.env.FIREBASE_PROJECT_ID;
      
      const result = notificationService.initializeFirebase();
      expect(result).toBe(false);
      
      process.env.FIREBASE_PROJECT_ID = original;
    });

    test('should handle missing FIREBASE_PRIVATE_KEY', () => {
      const original = process.env.FIREBASE_PRIVATE_KEY;
      delete process.env.FIREBASE_PRIVATE_KEY;
      
      const result = notificationService.initializeFirebase();
      expect(result).toBe(false);
      
      process.env.FIREBASE_PRIVATE_KEY = original;
    });

    test('should handle missing FIREBASE_CLIENT_EMAIL', () => {
      const original = process.env.FIREBASE_CLIENT_EMAIL;
      delete process.env.FIREBASE_CLIENT_EMAIL;
      
      const result = notificationService.initializeFirebase();
      expect(result).toBe(false);
      
      process.env.FIREBASE_CLIENT_EMAIL = original;
    });

    test('should handle Firebase initialization error', () => {
      mockFirebaseAdmin.initializeApp.mockImplementationOnce(() => {
        throw new Error('Firebase init failed');
      });
      
      const result = notificationService.initializeFirebase();
      expect(result).toBe(false);
    });
  });

  describe('RabbitMQ Connection and Service Startup', () => {
    test('should start notification service successfully', async () => {
      // Initialize Firebase first
      notificationService.initializeFirebase();
      
      const result = await notificationService.startNotificationService();
      
      expect(mockAmqp.connect).toHaveBeenCalledWith(process.env.RABBITMQ);
      expect(mockAmqpConnection.createChannel).toHaveBeenCalled();
      expect(mockAmqpChannel.assertExchange).toHaveBeenCalledWith('process_notification_exchange', 'direct', { durable: true });
      expect(mockAmqpChannel.assertQueue).toHaveBeenCalledWith('process_notification', { durable: true });
      expect(mockAmqpChannel.assertQueue).toHaveBeenCalledWith('process_notification_dlq', { durable: true });
      expect(mockAmqpChannel.bindQueue).toHaveBeenCalledWith('process_notification', 'process_notification_exchange', 'notification');
      expect(mockAmqpChannel.bindQueue).toHaveBeenCalledWith('process_notification_dlq', 'process_notification_exchange', 'dlq');
      expect(mockAmqpChannel.consume).toHaveBeenCalled();
      
      expect(result).toHaveProperty('connection');
      expect(result).toHaveProperty('channel');
    });

    test('should retry connection with exponential backoff', async () => {
      const originalSetTimeout = global.setTimeout;
      global.setTimeout = jest.fn((fn) => fn());
      
      // Fail first time, succeed second time
      mockAmqp.connect
        .mockRejectedValueOnce(new Error('Connection failed'))
        .mockResolvedValueOnce(mockAmqpConnection);
      
      const result = await notificationService.startNotificationService();
      
      expect(mockAmqp.connect).toHaveBeenCalledTimes(2);
      expect(result).toHaveProperty('connection');
      
      global.setTimeout = originalSetTimeout;
    });

    test('should fail after maximum retries', async () => {
      const originalSetTimeout = global.setTimeout;
      global.setTimeout = jest.fn((fn) => fn());
      
      mockAmqp.connect.mockRejectedValue(new Error('Persistent failure'));
      
      await expect(notificationService.startNotificationService()).rejects.toThrow('Persistent failure');
      expect(mockAmqp.connect).toHaveBeenCalledTimes(6); // Initial + 5 retries
      
      global.setTimeout = originalSetTimeout;
    });
  });

  describe('Message Processing', () => {
    let messageHandler;

    beforeEach(async () => {
      // Initialize Firebase and start service
      notificationService.initializeFirebase();
      await notificationService.startNotificationService();
      
      // Get the message handler
      messageHandler = mockAmqpChannel._messageHandler;
    });

    test('should process single notification successfully', async () => {
      const mockMessage = {
        content: Buffer.from(JSON.stringify({
          to: 'token123',
          notification: { title: 'Test', body: 'Test body' }
        })),
        properties: { headers: {} }
      };

      await messageHandler(mockMessage);
      
      expect(mockFirebaseAdmin.messaging().send).toHaveBeenCalledWith({
        token: 'token123',
        notification: { title: 'Test', body: 'Test body' },
        data: undefined,
        android: { priority: 'high' },
        apns: { headers: { 'apns-priority': '10' } }
      });
      expect(mockAmqpChannel.ack).toHaveBeenCalledWith(mockMessage);
    });

    test('should process notification with data payload', async () => {
      const mockMessage = {
        content: Buffer.from(JSON.stringify({
          to: 'token123',
          notification: { title: 'Test', body: 'Test body' },
          data: { 
            payload: { 
              customField: 'value',
              number: 123,
              object: { nested: 'data' }
            }
          }
        })),
        properties: { headers: {} }
      };

      await messageHandler(mockMessage);
      
      expect(mockFirebaseAdmin.messaging().send).toHaveBeenCalledWith({
        token: 'token123',
        notification: { title: 'Test', body: 'Test body' },
        data: {
          customField: 'value',
          number: '123',
          object: '{"nested":"data"}'
        },
        android: { priority: 'high' },
        apns: { headers: { 'apns-priority': '10' } }
      });
    });

    test('should process bulk notification successfully', async () => {
      const mockMessage = {
        content: Buffer.from(JSON.stringify({
          to: ['token1', 'token2', 'token3'],
          notification: { title: 'Bulk Test', body: 'Bulk body' },
          type: 'bulk'
        })),
        properties: { headers: {} }
      };

      await messageHandler(mockMessage);
      
      expect(mockFirebaseAdmin.messaging().send).toHaveBeenCalledTimes(3);
      expect(mockAmqpChannel.ack).toHaveBeenCalledWith(mockMessage);
    });

    test('should handle bulk notification with mixed success/failure', async () => {
      mockFirebaseAdmin.messaging().send
        .mockResolvedValueOnce('success-1')
        .mockRejectedValueOnce(new Error('Send failed'))
        .mockResolvedValueOnce('success-2');

      const mockMessage = {
        content: Buffer.from(JSON.stringify({
          to: ['token1', 'token2', 'token3'],
          notification: { title: 'Mixed Test', body: 'Mixed body' },
          type: 'bulk'
        })),
        properties: { headers: {} }
      };

      await messageHandler(mockMessage);
      
      expect(mockFirebaseAdmin.messaging().send).toHaveBeenCalledTimes(3);
      expect(mockAmqpChannel.ack).toHaveBeenCalledWith(mockMessage);
    });



    test('should handle invalid JSON message', async () => {
      const mockMessage = {
        content: Buffer.from('invalid json'),
        properties: { headers: {} }
      };

      await messageHandler(mockMessage);
      
      expect(mockAmqpChannel.sendToQueue).toHaveBeenCalledWith(
        'process_notification',
        Buffer.from('invalid json'),
        {
          headers: { 'x-retries': 1 },
          persistent: true
        }
      );
      expect(mockAmqpChannel.ack).toHaveBeenCalledWith(mockMessage);
    });

    test('should handle missing notification data', async () => {
      const mockMessage = {
        content: Buffer.from(JSON.stringify({
          to: 'token123'
          // Missing notification field
        })),
        properties: { headers: {} }
      };

      await messageHandler(mockMessage);
      
      expect(mockAmqpChannel.sendToQueue).toHaveBeenCalled();
      expect(mockAmqpChannel.ack).toHaveBeenCalledWith(mockMessage);
    });

    test('should handle unknown notification type', async () => {
      const mockMessage = {
        content: Buffer.from(JSON.stringify({
          to: 'token123',
          notification: { title: 'Test', body: 'Test body' },
          type: 'unknown'
        })),
        properties: { headers: {} }
      };

      await messageHandler(mockMessage);
      
      expect(mockAmqpChannel.sendToQueue).toHaveBeenCalled();
      expect(mockAmqpChannel.ack).toHaveBeenCalledWith(mockMessage);
    });

    test('should handle bulk notification with invalid token format', async () => {
      const mockMessage = {
        content: Buffer.from(JSON.stringify({
          to: 'not-an-array',
          notification: { title: 'Test', body: 'Test body' },
          type: 'bulk'
        })),
        properties: { headers: {} }
      };

      await messageHandler(mockMessage);
      
      expect(mockAmqpChannel.sendToQueue).toHaveBeenCalled();
      expect(mockAmqpChannel.ack).toHaveBeenCalledWith(mockMessage);
    });

    test('should handle empty bulk notification array', async () => {
      const mockMessage = {
        content: Buffer.from(JSON.stringify({
          to: [],
          notification: { title: 'Empty Test', body: 'Empty body' },
          type: 'bulk'
        })),
        properties: { headers: {} }
      };

      await messageHandler(mockMessage);
      
      expect(mockFirebaseAdmin.messaging().send).not.toHaveBeenCalled();
      expect(mockAmqpChannel.ack).toHaveBeenCalledWith(mockMessage);
    });

    test('should infer single type when no type specified', async () => {
      const mockMessage = {
        content: Buffer.from(JSON.stringify({
          to: 'token123',
          notification: { title: 'Test', body: 'Test body' }
          // No type specified - should default to 'single'
        })),
        properties: { headers: {} }
      };

      await messageHandler(mockMessage);
      
      expect(mockFirebaseAdmin.messaging().send).toHaveBeenCalledWith(
        expect.objectContaining({
          token: 'token123'
        })
      );
      expect(mockAmqpChannel.ack).toHaveBeenCalledWith(mockMessage);
    });

    test('should get type from data field', async () => {
      const mockMessage = {
        content: Buffer.from(JSON.stringify({
          to: ['token1', 'token2'],
          notification: { title: 'Test', body: 'Test body' },
          data: { type: 'bulk' }
        })),
        properties: { headers: {} }
      };

      await messageHandler(mockMessage);
      
      expect(mockFirebaseAdmin.messaging().send).toHaveBeenCalledTimes(2);
      expect(mockAmqpChannel.ack).toHaveBeenCalledWith(mockMessage);
    });
  });
});
