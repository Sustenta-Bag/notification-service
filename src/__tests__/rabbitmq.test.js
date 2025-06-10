import { connectRabbitMQ } from '../notification-service.js';
import amqp from 'amqplib';

jest.mock('amqplib', () => ({ connect: jest.fn() }));

describe('connectRabbitMQ', () => {
  test('retries before succeeding', async () => {
    amqp.connect
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValue('conn');

    const conn = await connectRabbitMQ(0, 2);
    expect(conn).toBe('conn');
    expect(amqp.connect).toHaveBeenCalledTimes(2);
  });

  test('throws after max retries', async () => {
    amqp.connect.mockRejectedValue(new Error('fail'));
    await expect(connectRabbitMQ(0, 1)).rejects.toThrow('fail');
  });
});
