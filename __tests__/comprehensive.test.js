import { jest, describe, test, expect, beforeEach, afterEach } from '@jest/globals';

// Set up environment variables first
process.env.FIREBASE_PROJECT_ID = 'test-project-id';
process.env.FIREBASE_PRIVATE_KEY = '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC\n-----END PRIVATE KEY-----';
process.env.FIREBASE_CLIENT_EMAIL = 'test@test-project.iam.gserviceaccount.com';
process.env.RABBITMQ = 'amqp://guest:guest@localhost:5672';
process.env.MAX_RETRIES = '3';

// Mock external dependencies
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

// Mock the new architecture modules
jest.unstable_mockModule('../src/config/index.js', () => ({
  default: {
    firebase: {
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    },
    rabbitmq: {
      url: process.env.RABBITMQ,
      maxRetries: parseInt(process.env.MAX_RETRIES) || 5,
      queue: "process_notification",
      exchange: "process_notification_exchange",
      routingKey: "notification",
      dlqSuffix: "_dlq"
    },
    app: {
      nodeEnv: 'test',
      isDevelopment: false,
      isProduction: false
    },
    validateRequiredEnvVars: jest.fn(),
    displayInfo: jest.fn()
  }
}));

jest.unstable_mockModule('../src/utils/logger.js', () => ({
  default: {
    info: jest.fn(),
    success: jest.fn(),
    warning: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    separator: jest.fn(),
    banner: jest.fn(),
    processingStart: jest.fn(),
    processingSuccess: jest.fn(),
    messageReceived: jest.fn(),
    messageProcessed: jest.fn(),
    messageRetrying: jest.fn(),
    messageToDLQ: jest.fn(),
    bulkNotificationComplete: jest.fn()
  }
}));

describe('Notification Service Full Coverage Tests', () => {
  let originalConsole;
  let notificationService;
  let firebaseService;
  let rabbitmqService;
  let notificationController;

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
    
    // Import the modules fresh
    notificationService = await import('../src/notification-service.js');
    firebaseService = await import('../src/services/firebase.service.js');
    rabbitmqService = await import('../src/services/rabbitmq.service.js');
    notificationController = await import('../src/controllers/notification.controller.js');
  });

  afterEach(() => {
    global.console = originalConsole;
    jest.resetModules();
  });

  describe('Firebase Service', () => {
    test('should initialize Firebase successfully with valid environment', () => {
      const result = firebaseService.default.initialize();
      
      expect(result).toBe(true);
      expect(mockFirebaseAdmin.credential.cert).toHaveBeenCalledWith({
        type: "service_account",
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY,
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
      });
      expect(mockFirebaseAdmin.initializeApp).toHaveBeenCalled();
    });

    test('should return true if already initialized', () => {
      // First call
      firebaseService.default.initialize();
      // Second call should return true without re-initializing
      const result = firebaseService.default.initialize();
      
      expect(result).toBe(true);
      expect(firebaseService.default.isInitialized()).toBe(true);
    });

    test('should handle Firebase initialization error', () => {
      // Mock Firebase to throw an error
      mockFirebaseAdmin.initializeApp.mockImplementation(() => {
        throw new Error('Firebase init error');
      });
      
      const result = firebaseService.default.initialize();
      expect(result).toBe(false);
    });

    test('should send single notification successfully', async () => {
      firebaseService.default.initialize();
      
      const result = await firebaseService.default.sendNotification(
        'test-token',
        { title: 'Test', body: 'Test message' },
        { key: 'value' }
      );
      
      expect(result.success).toBe(true);
      expect(result.messageId).toBe('message-id-123');
      expect(mockSend).toHaveBeenCalledWith({
        token: 'test-token',
        notification: { title: 'Test', body: 'Test message' },
        data: { key: 'value' },
        android: { priority: "high" },
        apns: { headers: { "apns-priority": "10" } },
      });
    });

    test('should send bulk notifications successfully', async () => {
      firebaseService.default.initialize();
      
      const result = await firebaseService.default.sendBulkNotifications(
        ['token1', 'token2'],
        { title: 'Test', body: 'Test message' }
      );
      
      expect(result.success).toBe(true);
      expect(result.successCount).toBe(2);
      expect(result.failureCount).toBe(0);
    });

    test('should handle notification send error', async () => {
      firebaseService.default.initialize();
      mockSend.mockRejectedValueOnce(new Error('Send failed'));
      
      const result = await firebaseService.default.sendNotification(
        'test-token',
        { title: 'Test', body: 'Test message' }
      );
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Send failed');
    });
  });

  describe('RabbitMQ Service', () => {
    test('should connect to RabbitMQ successfully', async () => {
      const connection = await rabbitmqService.default.connect();
      
      expect(connection).toBe(mockAmqpConnection);
      expect(mockAmqp.connect).toHaveBeenCalledWith(process.env.RABBITMQ);
    });

    test('should retry connection with exponential backoff', async () => {
      mockAmqp.connect
        .mockRejectedValueOnce(new Error('Connection failed'))
        .mockRejectedValueOnce(new Error('Connection failed'))
        .mockResolvedValueOnce(mockAmqpConnection);
      
      const connection = await rabbitmqService.default.connect();
      
      expect(connection).toBe(mockAmqpConnection);
      expect(mockAmqp.connect).toHaveBeenCalledTimes(3);
    });

    test('should setup channel and queues', async () => {
      await rabbitmqService.default.connect();
      await rabbitmqService.default.setupChannel();
      
      expect(mockAmqpConnection.createChannel).toHaveBeenCalled();
      expect(mockAmqpChannel.assertExchange).toHaveBeenCalled();
      expect(mockAmqpChannel.assertQueue).toHaveBeenCalledTimes(2); // main queue + DLQ
      expect(mockAmqpChannel.bindQueue).toHaveBeenCalledTimes(2);
    });
  });

  describe('Notification Controller', () => {
    test('should process single notification successfully', async () => {
      firebaseService.default.initialize();
      
      const task = {
        to: 'test-token',
        notification: { title: 'Test', body: 'Test message' },
        data: { payload: { key: 'value' } }
      };
      
      const result = await notificationController.default.processNotification(task);
      
      expect(result.success).toBe(true);
      expect(mockSend).toHaveBeenCalledWith({
        token: 'test-token',
        notification: { title: 'Test', body: 'Test message' },
        data: { key: 'value' },
        android: { priority: "high" },
        apns: { headers: { "apns-priority": "10" } },
      });
    });

    test('should process bulk notification successfully', async () => {
      firebaseService.default.initialize();
      
      const task = {
        to: ['token1', 'token2'],
        notification: { title: 'Test', body: 'Test message' },
        type: 'bulk'
      };
      
      const result = await notificationController.default.processNotification(task);
      
      expect(result.success).toBe(true);
      expect(result.successCount).toBe(2);
      expect(result.failureCount).toBe(0);
    });

    test('should handle missing notification data', async () => {
      const task = {
        to: 'test-token'
        // missing notification
      };
      
      await expect(notificationController.default.processNotification(task))
        .rejects.toThrow('Incomplete notification data');
    });

    test('should handle unknown notification type', async () => {
      const task = {
        to: 'test-token',
        notification: { title: 'Test', body: 'Test message' },
        type: 'unknown'
      };
      
      await expect(notificationController.default.processNotification(task))
        .rejects.toThrow('Unknown notification type: unknown');
    });

    test('should handle bulk notification with invalid token format', async () => {
      const task = {
        to: 'not-an-array',
        notification: { title: 'Test', body: 'Test message' },
        type: 'bulk'
      };
      
      await expect(notificationController.default.processNotification(task))
        .rejects.toThrow('For bulk notifications, "to" must be an array of tokens');
    });
  });

  describe('Notification Service Integration', () => {
    test('should start notification service successfully', async () => {
      const result = await notificationService.startNotificationService();
      
      expect(result.connection).toBe(mockAmqpConnection);
      expect(result.channel).toBe(mockAmqpChannel);
      expect(mockAmqp.connect).toHaveBeenCalled();
      expect(mockAmqpConnection.createChannel).toHaveBeenCalled();
      expect(mockAmqpChannel.consume).toHaveBeenCalled();
    });

    test('should handle message processing with retry logic', async () => {
      await notificationService.startNotificationService();
      
      // Simulate message processing
      const messageHandler = mockAmqpChannel._messageHandler;
      const mockMessage = {
        content: Buffer.from(JSON.stringify({
          to: 'test-token',
          notification: { title: 'Test', body: 'Test message' }
        })),
        properties: { headers: {} }
      };
      
      firebaseService.default.initialize();
      await messageHandler(mockMessage);
      
      expect(mockAmqpChannel.ack).toHaveBeenCalledWith(mockMessage);
    });
  });
});
