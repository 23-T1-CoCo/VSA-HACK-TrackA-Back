import WebSocket, { WebSocketServer } from "ws";
import http from 'http';
import { Redis } from 'ioredis';

const server = http.createServer(); // HTTP 서버 생성
const wss = new WebSocketServer({ noServer: true }); // WebSocket 서버 포트


// Redis 클라이언트 생성
const redisClient = new Redis({
  host: 'localhost',
  port: 6379,
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
server.listen(3000, () => {
  console.log('Listening to port 5000');
});

// 대기열을 생성하는 함수
export async function createQueues() {
  await redisClient.del(queue1Name, queue2Name, queue3Name); // 기존 대기열 삭제
  await redisClient.rpush(queue1Name, 'a', 'b', 'c', 'd', 'e'); // 대기열에 데이터 추가
  const queueContents = await redisClient.lrange(queue1Name, 0, -1);
  console.log(queueContents);
}

// 대기열을 처리하는 함수
export async function processQueue() {
  const data = await redisClient.lpop(queue1Name); // 대기열에서 데이터를 가져옴
  if (data) {
    await redisClient.rpush(queue2Name, data); // 처리 대기열에 데이터 추가
    await redisClient.rpush(queue3Name, data); // 완료 대기열에 데이터 추가
  }
}

// 대기열 처리를 주기적으로 실행하는 함수
export async function processQueuePeriodically() {
  await processQueue();
  setTimeout(processQueuePeriodically, 1000); // 1초마다 실행
}

processQueuePeriodically(); // 대기열 처리 함수 실행

// WebSocket 서버에 연결된 클라이언트가 있을 때
wss.on('connection', (socket) => {
  console.log('Client connected to queue server');

  // 새로운 클라이언트가 연결되었을 때
  socket.on('message', (message) => {
    if (message === 'join') {
      socket.join(queue1Name); // 대기열에 클라이언트 추가
      console.log('Client joined the queue');
      updateQueueStatus(); // 대기열 상태 업데이트
    }
  });

  socket.on('close', () => {
    console.log('Client left the queue');
    updateQueueStatus(); // 대기열 상태 업데이트
  });

  // 대기열 상태 업데이트를 전송하는 함수
  async function updateQueueStatus() {
    const queueSize = await redisClient.llen(queue1Name); // 대기열의 길이를 가져옴
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(`Queue size: ${queueSize}`);
      }
    });
  }
});



