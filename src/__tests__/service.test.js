import * as svc from '../notification-service.js';

const connectSpy = jest.spyOn(svc, 'connectRabbitMQ');
const processSpy = jest.spyOn(svc, 'processNotification');

const makeChannel = () => ({
  assertExchange: jest.fn(),
  assertQueue: jest.fn(),
  bindQueue: jest.fn(),
  consume: jest.fn(),
  ack: jest.fn(),
  sendToQueue: jest.fn(),
  publish: jest.fn(),
  close: jest.fn(),
});

const makeConnection = (channel) => ({
  createChannel: jest.fn().mockResolvedValue(channel),
  close: jest.fn(),
});

describe('startNotificationService', () => {
  afterEach(() => jest.clearAllMocks());
  test('consumes and processes messages', async () => {
    const channel = makeChannel();
    const connection = makeConnection(channel);
    connectSpy.mockResolvedValue(connection);
    processSpy.mockResolvedValue({ success: true });

    const promise = svc.startNotificationService();
    const result = await promise;
    expect(result).toEqual({ connection, channel });

    // simulate consuming a message
    const msg = { content: Buffer.from('{}'), properties: { headers: {} } };
    const consumeCb = channel.consume.mock.calls[0][1];
    await consumeCb(msg);

    expect(processSpy).toHaveBeenCalled();
    expect(channel.ack).toHaveBeenCalledWith(msg);
  });

  test('requeues message on failure', async () => {
    const channel = makeChannel();
    const connection = makeConnection(channel);
    connectSpy.mockResolvedValue(connection);
    processSpy.mockRejectedValue(new Error('fail'));

    const promise = svc.startNotificationService();
    await promise;
    const msg = { content: Buffer.from('{}'), properties: { headers: { 'x-retries': 0 } } };
    const consumeCb = channel.consume.mock.calls[0][1];
    await consumeCb(msg);

    expect(channel.sendToQueue).toHaveBeenCalled();
    expect(channel.publish).not.toHaveBeenCalled();
    expect(channel.ack).toHaveBeenCalledWith(msg);
  });

  test('moves to DLQ after max retries', async () => {
    const channel = makeChannel();
    const connection = makeConnection(channel);
    connectSpy.mockResolvedValue(connection);
    processSpy.mockRejectedValue(new Error('fail'));

    const promise = svc.startNotificationService();
    await promise;
    const msg = { content: Buffer.from('{}'), properties: { headers: { 'x-retries': 5 } } };
    const consumeCb = channel.consume.mock.calls[0][1];
    await consumeCb(msg);

    expect(channel.publish).toHaveBeenCalled();
    expect(channel.ack).toHaveBeenCalledWith(msg);
  });
});
