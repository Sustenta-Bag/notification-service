import { jest, describe, test, expect, beforeAll, beforeEach, afterEach } from '@jest/globals';

// Set environment variables before imports
process.env.FIREBASE_PROJECT_ID = 'test-project-id';
process.env.FIREBASE_PRIVATE_KEY = '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC\n-----END PRIVATE KEY-----';
process.env.FIREBASE_CLIENT_EMAIL = 'test@test-project.iam.gserviceaccount.com';
process.env.RABBITMQ = 'amqp://guest:guest@localhost:5672';
process.env.MAX_RETRIES = '3';

// Global mocks - must be defined before imports
let mockMessaging, mockConnect, mockChannel;

// Mock firebase-admin globally
jest.unstable_mockModule('firebase-admin', () => {
  mockMessaging = {
    send: jest.fn(),
    sendMulticast: jest.fn(),
    sendAll: jest.fn()
  };
  
  return {
    default: {
      initializeApp: jest.fn(),
      messaging: jest.fn(() => mockMessaging),
      credential: {
        cert: jest.fn()
      },
      apps: []
    }
  };
});

// Mock amqplib globally
jest.unstable_mockModule('amqplib', () => {
  mockChannel = {
    assertQueue: jest.fn().mockResolvedValue({ queue: 'test-queue' }),
    sendToQueue: jest.fn().mockResolvedValue(true),
    consume: jest.fn(),
    ack: jest.fn(),
    nack: jest.fn(),
    close: jest.fn().mockResolvedValue()
  };

  mockConnect = jest.fn().mockResolvedValue({
    createChannel: jest.fn().mockResolvedValue(mockChannel),
    close: jest.fn().mockResolvedValue(),
    on: jest.fn()
  });

  return {
    default: {
      connect: mockConnect
    }
  };
});

// Mock colors
jest.unstable_mockModule('colors', () => ({
  default: {
    cyan: jest.fn(str => str),
    green: jest.fn(str => str),
    red: jest.fn(str => str),
    yellow: jest.fn(str => str),
    blue: jest.fn(str => str),
    rainbow: jest.fn(str => str),
    bold: { green: jest.fn(str => str) }
  }
}));

jest.unstable_mockModule('dotenv', () => ({
  default: { config: jest.fn() }
}));

describe('Complete Service Coverage Tests', () => {
  let originalConsole;
  let firebaseService, rabbitmqService, notificationController;
  let config, logger;

  beforeAll(async () => {
    // Import modules after mocks are set up
    const firebaseModule = await import('../src/services/firebase.service.js');
    const rabbitmqModule = await import('../src/services/rabbitmq.service.js');
    const controllerModule = await import('../src/controllers/notification.controller.js');
    const configModule = await import('../src/config/index.js');
    const loggerModule = await import('../src/utils/logger.js');

    firebaseService = firebaseModule.default;
    rabbitmqService = rabbitmqModule.default;
    notificationController = controllerModule.default;
    config = configModule.default;
    logger = loggerModule.default;
  });

  beforeEach(() => {
    originalConsole = global.console;
    global.console = {
      ...console,
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
    };
    jest.clearAllMocks();
  });

  afterEach(() => {
    global.console = originalConsole;
  });

  describe('Firebase Service', () => {
    beforeEach(() => {
      // Reset service state
      firebaseService.initialized = false;
      jest.clearAllMocks();
    });

    test('should initialize Firebase successfully', () => {
      const result = firebaseService.initialize();
      expect(result).toBe(true);
      expect(firebaseService.initialized).toBe(true);
    });

    test('should not reinitialize if already initialized', () => {
      firebaseService.initialize();
      const result = firebaseService.initialize();
      expect(result).toBe(true);
    });

    test('should send notification successfully', async () => {
      firebaseService.initialize();
      mockMessaging.send.mockResolvedValue('message-id-123');

      const result = await firebaseService.sendNotification(
        'test-token',
        { title: 'Test Title', body: 'Test Body' },
        { key: 'value' }
      );

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('message-id-123');
      expect(mockMessaging.send).toHaveBeenCalled();
    });

    test('should handle send notification errors', async () => {
      firebaseService.initialize();
      const error = new Error('Firebase send failed');
      mockMessaging.send.mockRejectedValue(error);

      const result = await firebaseService.sendNotification(
        'test-token',
        { title: 'Test Title', body: 'Test Body' }
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Firebase send failed');
    });


    test('should handle Firebase not initialized', async () => {
      const result = await firebaseService.sendNotification(
        'test-token',
        { title: 'Test Title', body: 'Test Body' }
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Firebase not initialized');
    });
  });

  describe('Config Module', () => {
    test('should provide complete configuration', () => {
      expect(config).toBeDefined();
      expect(config.firebase).toBeDefined();
      expect(config.rabbitmq).toBeDefined();
    });

    test('should have Firebase configuration', () => {
      expect(config.firebase.projectId).toBe('test-project-id');
      expect(config.firebase.clientEmail).toBe('test@test-project.iam.gserviceaccount.com');
      expect(config.firebase.privateKey).toContain('BEGIN PRIVATE KEY');
    });

    test('should have RabbitMQ configuration', () => {
      expect(config.rabbitmq.url).toBe('amqp://guest:guest@localhost:5672');
      expect(config.rabbitmq.maxRetries).toBe(3);
    });
  });

  describe('Logger Module', () => {
    test('should provide logging methods', () => {
      expect(logger.info).toBeDefined();
      expect(logger.error).toBeDefined();
      expect(logger.warning).toBeDefined();
      expect(logger.success).toBeDefined();
    });

    test('should log info messages', () => {
      logger.info('Test info message');
      expect(console.log).toHaveBeenCalled();
    });

    test('should log error messages', () => {
      logger.error('Test error message');
      expect(console.error).toHaveBeenCalled();
    });

    test('should log warning messages', () => {
      logger.warning('Test warning message');
      expect(console.log).toHaveBeenCalled();
    });

    test('should log success messages', () => {
      logger.success('Test success message');
      expect(console.log).toHaveBeenCalled();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle Firebase send errors gracefully', async () => {
      firebaseService.initialize();
      mockMessaging.send.mockRejectedValue(new Error('Network error'));

      const result = await firebaseService.sendNotification(
        'test-token',
        { title: 'Test', body: 'Test' }
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });

    test('should handle empty notification data', async () => {
      firebaseService.initialize();
      
      const result = await firebaseService.sendNotification(
        'test-token',
        null
      );

      expect(result.success).toBe(false);
    });

  });
});
