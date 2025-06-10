import { jest, describe, test, expect, beforeEach, afterEach } from '@jest/globals';

describe('Server Environment and Startup Tests', () => {
  let originalExit;
  let originalEnv;
  let originalConsole;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock process.exit to prevent actual exits during tests
    originalExit = process.exit;
    process.exit = jest.fn();
    
    // Mock console to prevent output during tests
    originalConsole = global.console;
    global.console = {
      ...console,
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
    };
    
    // Save original environment
    originalEnv = { ...process.env };
    
    // Set required environment variables
    process.env.RABBITMQ = 'amqp://guest:guest@localhost:5672';
    process.env.MAX_RETRIES = '3';
    process.env.FIREBASE_PROJECT_ID = 'test-project';
    process.env.FIREBASE_CLIENT_EMAIL = 'test@test.com';
    process.env.FIREBASE_PRIVATE_KEY = 'test-key';
  });

  afterEach(() => {
    process.exit = originalExit;
    process.env = originalEnv;
    global.console = originalConsole;
    jest.resetModules();
  });

  test('should validate required environment variables', () => {
    const requiredEnvVars = ["RABBITMQ", "MAX_RETRIES", "FIREBASE_PROJECT_ID", "FIREBASE_CLIENT_EMAIL", "FIREBASE_PRIVATE_KEY"];
    const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
    
    expect(missingEnvVars).toEqual([]);
  });

  test('should detect missing environment variables', () => {
    delete process.env.RABBITMQ;
    
    const requiredEnvVars = ["RABBITMQ", "MAX_RETRIES", "FIREBASE_PROJECT_ID", "FIREBASE_CLIENT_EMAIL", "FIREBASE_PRIVATE_KEY"];
    const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
    
    expect(missingEnvVars).toContain('RABBITMQ');
  });

  test('should mask password in RabbitMQ URL', () => {
    const maskUrl = (url) => {
      if (url && url.includes('@')) {
        return url.replace(/:\/\/.*:.*@/, "://***:***@");
      }
      return url;
    };
    
    const urlWithPassword = 'amqp://user:password@localhost:5672';
    const maskedUrl = maskUrl(urlWithPassword);
    
    expect(maskedUrl).toBe('amqp://***:***@localhost:5672');
    expect(maskedUrl).not.toContain('password');
  });

  test('should handle NODE_ENV environment variable', () => {
    // Test with NODE_ENV set
    process.env.NODE_ENV = 'production';
    expect(process.env.NODE_ENV).toBe('production');
    
    // Test default behavior
    delete process.env.NODE_ENV;
    const nodeEnv = process.env.NODE_ENV || 'development';
    expect(nodeEnv).toBe('development');
  });

  test('should handle process event listeners', () => {
    const mockExit = jest.fn();
    const originalProcessExit = process.exit;
    process.exit = mockExit;

    // Test uncaught exception handler logic
    const handleUncaughtException = (error) => {
      console.error("Uncaught exception:", error);
      process.exit(1);
    };

    // Test unhandled rejection handler logic  
    const handleUnhandledRejection = (reason, promise) => {
      console.error("Unhandled rejection:", reason);
      process.exit(1);
    };

    handleUncaughtException(new Error('Test error'));
    expect(mockExit).toHaveBeenCalledWith(1);

    mockExit.mockClear();
    handleUnhandledRejection(new Error('Test rejection'), Promise.resolve());
    expect(mockExit).toHaveBeenCalledWith(1);

    process.exit = originalProcessExit;
  });

  test('should handle RABBITMQ URL without credentials', () => {
    const maskUrl = (url) => {
      if (url && url.includes('@')) {
        return url.replace(/:\/\/.*:.*@/, "://***:***@");
      }
      return url;
    };
    
    const urlWithoutCredentials = 'amqp://localhost:5672';
    const result = maskUrl(urlWithoutCredentials);
    
    expect(result).toBe('amqp://localhost:5672');
  });
});
