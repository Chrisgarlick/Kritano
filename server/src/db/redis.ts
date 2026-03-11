import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6380';

export const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
});

export async function testRedisConnection(): Promise<boolean> {
  try {
    await redis.connect();
    await redis.ping();
    console.log('Redis connected successfully');
    return true;
  } catch (error) {
    console.error('Redis connection failed:', error);
    return false;
  }
}
