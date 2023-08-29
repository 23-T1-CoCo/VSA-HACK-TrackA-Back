import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();
const REDIS_HOST = process.env.REDIS_HOST;
const REDIS_PORT = process.env.REDIS_PORT;

// Redis 서버에 연결하는 함수
export const connectToRedis = () => {
  const redis = new Redis({
    host: REDIS_HOST,  // Redis 서버 호스트
    port: REDIS_PORT,         // Redis 포트 (기본값)
  });

  redis.on('connect', () => {
    console.log('Connected to Redis server');
  });

  redis.on('error', (err) => {
    console.error('Error connecting to Redis server:', err);
  });

  return redis;
};

// 데이터 저장 함수
export const addWaitingData = (score, userId, productId) => {
  const redis = connectToRedis();

  return new Promise((resolve, reject) => {
    redis.zadd('Wating', score, `${userId}:${productId}`, (err, result) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(result);
      redis.quit();
    });
  });
};

// 데이터 조회 함수
export const getWaitingData = () => {
  const redis = connectToRedis();

  return new Promise((resolve, reject) => {
    redis.zrange('Wating', 0, -1, 'WITHSCORES', (err, result) => {
      if (err) {
        reject(err);
        return;
      }
      
      const waitingData = [];
      for (let i = 0; i < result.length; i += 2) {
        const [userId, productId] = result[i].split(':');
        const score = result[i + 1];
        waitingData.push({ userId, productId, score });
      }
      
      resolve(waitingData);
      redis.quit();
    });
  });
};