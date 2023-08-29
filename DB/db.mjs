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
export const setData = (key, value) => {
  const redis = connectToRedis();

  return new Promise((resolve, reject) => {
    redis.set(key, value, (err, result) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(result);
      redis.quit();
    });
  });
};

// 데이터 가져오기 함수
export const getData = (key) => {
  const redis = connectToRedis();

  return new Promise((resolve, reject) => {
    redis.get(key, (err, result) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(result);
      redis.quit();
    });
  });
};