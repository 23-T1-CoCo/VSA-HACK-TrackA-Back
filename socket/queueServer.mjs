import WebSocket from 'ws';

const wss = new WebSocket.Server({ port: 3001 }); // WebSocket 서버 포트

const queue = []; // 대기열 저장 배열

wss.on('connection', (socket) => {
  console.log('Client connected to queue server');

  // 새로운 클라이언트가 연결되었을 때
  socket.on('message', (message) => {
    if (message === 'join') {
      queue.push(socket);
      console.log('Client joined the queue');
      updateQueueStatus(); // 대기열 상태 업데이트
    }
  });

  // 클라이언트가 연결 해제되었을 때
  socket.on('close', () => {
    const index = queue.indexOf(socket);
    if (index !== -1) {
      queue.splice(index, 1);
      console.log('Client left the queue');
      updateQueueStatus(); // 대기열 상태 업데이트
    }
  });

  // 대기열 상태 업데이트를 전송하는 함수
  function updateQueueStatus() {
    const queueSize = queue.length;
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(`Queue size: ${queueSize}`);
      }
    });
  }
});
