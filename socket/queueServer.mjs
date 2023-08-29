import WebSocket, { WebSocketServer } from "ws";
import http from 'http';
import { Redis } from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();
const REDIS_HOST = process.env.REDIS_HOST;
const REDIS_PORT = process.env.REDIS_PORT;

const server = http.createServer(); // HTTP 서버 생성
const wss = new WebSocketServer({ noServer: true }); // WebSocket 서버 포트
const userIdIndexMapKey = "userIndexMap";

// Redis 클라이언트 생성
const redisClient = new Redis({
  host: REDIS_HOST,
  port: REDIS_PORT,
  db: 0
});

const queue1Name = "waitingQueue";
const queue2Name = "processingQueue";
const queue3Name = "completedQueue";

redisClient.on('error', (err) => {
  console.log('Redis error: ', err);
});

// HTTP 서버에 연결된 클라이언트가 WebSocket 연결을 요청했을 때
server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (socket) => {
    wss.emit('connection', socket, request); // 연결된 클라이언트를 WebSocket 서버에 추가
  });
});

// HTTP 서버가 5000번 포트에서 대기
server.listen(3001, () => {
  console.log('Listening to port 3000');
});

// 대기열을 처리하는 함수
export async function processQueue() {
  const data = await redisClient.rpop(queue1Name); // 대기열에서 데이터를 가져옴
  console.log(data);
  if (data) {
    await redisClient.lpush(queue2Name, data); // 처리 대기열에 데이터 추가
    await redisClient.lpush(queue3Name, data); // 완료 대기열에 데이터 추가
  }
}




// WebSocket 서버에 연결된 클라이언트가 있을 때
wss.on('connection', async (socket) => {
  console.log('Client connected to queue server');

  socket.on('message', async (message) => {
    const data = JSON.parse(message);
    const userId = data.userId;
    const join = data.message;

    if (join === 'join') {
      // 사용자를 큐에 추가하고, 인덱스 맵에도 추가
      redisClient.lpush(queue1Name, userId, async (error, queueLength) => {
        if (error) {
          console.error('Error adding user to queue:', error);
        } else {
          console.log(`User ${userId} joined the queue. Queue length: ${queueLength}`);
          const result = {
            "userId": userId,
            "queueLength": queueLength
          };

          // 사용자의 인덱스 값을 해시 맵에 저장
          await redisClient.hset("userIdIndexMapKey", userId, queueLength - 1);

          socket.send(JSON.stringify(result)); // 클라이언트에게 응답을 전송
          await updateQueueStatus(userId); // 대기열 상태 업데이트


        }
      });
    }
  });

  // 대기열 처리 및 대기열 상태 업데이트 주기적으로 실행하는 함수
    async function processQueuePeriodically() {
      if (wss.clients.size === 0) { // 연결된 클라이언트가 없으면
        return;
      }

      const userId = "coco"
      await processQueue();
      await updateQueueStatus(userId); // 대기열 상태 업데이트

      // 맨 앞 사용자 제거 및 인덱스 감소 로직 추가
      const userIdToBeRemoved = await redisClient.lindex(queue1Name, 0);
      if (userIdToBeRemoved) {
    
        // 인덱스 감소 로직 추가
        const userIds = await redisClient.lrange(queue1Name, 0, -1);
        console.log(userIds);
        userIds.forEach(async (id) => {
          await redisClient.hincrby("userIdIndexMapKey", id, -1);
        });
      }
    

      setTimeout(processQueuePeriodically, 5000); // 3초마다 실행
    }

  await processQueuePeriodically(); // 대기열 처리 및 대기열 상태 업데이트 주기적으로 실행

  socket.on('close', async () => {
    const userId = "coco";

    if (userId) {
      const index = await redisClient.hget(userIdIndexMapKey, userId);

      redisClient.lrem(queue1Name, 1, userId, async (error, queueLength) => {
        if (error) {
          console.error('Error removing user from queue:', error);
        } else {
          console.log(`User ${userId} left the queue. Queue length: ${queueLength}`);
          await updateQueueStatus(userId); // 대기열 상태 업데이트

          if (index !== null) {
            const indexInt = parseInt(index, 10);
            const userIds = await redisClient.lrange(queue1Name, indexInt, -1);
            userIds.forEach(async (id) => {
              await redisClient.hincrby(userIdIndexMapKey, id, -1);
            });
          }
        }
      });
    } else {
      console.log('Client disconnected');
    }
  });

  // 대기열 상태 업데이트를 전송하는 함수
  async function updateQueueStatus(userId) {
    wss.clients.forEach(async (client) => {
      if (client.readyState === WebSocket.OPEN) {
        const newIndex = await redisClient.hget("userIdIndexMapKey", userId);
            const result = {
              "userId": userId,
              "queueIndex": newIndex
            };
            client.send(JSON.stringify(result));
            console.log(result)
          }
        });
      }
    });
