import {
  convertToStringValues,
  sendNotification,
  sendBulkNotifications,
  processNotification,
  initializeFirebase
} from '../notification-service.js';

import admin from 'firebase-admin';

jest.mock('firebase-admin', () => ({
  credential: { cert: jest.fn(() => 'cert') },
  initializeApp: jest.fn(),
  messaging: jest.fn(() => ({ send: jest.fn(async () => 'msg-id') }))
}));

describe('convertToStringValues', () => {
  test('converts values to strings', () => {
    const data = { num: 1, obj: { a: 2 }, str: 'ok' };
    expect(convertToStringValues(data)).toEqual({ num: '1', obj: JSON.stringify({ a: 2 }), str: 'ok' });
  });
});

describe('sendNotification', () => {
  beforeAll(() => {
    process.env.FIREBASE_PROJECT_ID = 'id';
    process.env.FIREBASE_PRIVATE_KEY = 'key';
    process.env.FIREBASE_CLIENT_EMAIL = 'test@test.com';
    initializeFirebase();
  });

  test('fails when firebase not initialized', async () => {
    jest.resetModules();
    const mod = await import('../notification-service.js');
    const result = await mod.sendNotification('t', { title: 'x' });
    expect(result.success).toBe(false);
    expect(result.error).toBe('Firebase not initialized');
  });

  test('sends notification when firebase initialized', async () => {
    const result = await sendNotification('token', { title: 't' });
    expect(result).toEqual({ success: true, messageId: 'msg-id' });
    expect(admin.messaging().send).toHaveBeenCalled();
  });
});

describe('sendBulkNotifications', () => {
  test('aggregates success and failures', async () => {
    const spy = jest.spyOn(admin.messaging(), 'send');
    spy.mockResolvedValueOnce('1');
    spy.mockRejectedValueOnce(new Error('fail'));
    const result = await sendBulkNotifications(['a', 'b'], { title: 't' });
    expect(result).toEqual({ success: true, successCount: 1, failureCount: 1 });
  });
});

describe('processNotification', () => {
  test('processes single notification', async () => {
    const singleSpy = jest.spyOn(admin.messaging(), 'send').mockResolvedValue('1');
    const result = await processNotification({
      to: 'token',
      notification: { title: 't' },
      data: { type: 'single' }
    });
    expect(result.success).toBe(true);
    expect(singleSpy).toHaveBeenCalled();
  });

  test('throws on invalid task', async () => {
    await expect(processNotification({})).rejects.toThrow('Incomplete notification data');
  });
});
