import express from 'express';
import WebSocket, { WebSocketServer } from "ws";
import bodyParser from 'body-parser';
import cors from 'cors';

const app = express();
app.use(bodyParser.json());
cors({credentials: true, origin: true});
app.use(cors());


app.get('/:id', (req, res) => {
  const socket = new WebSocket('ws://localhost:3001'); // WebSocket 서버 주소로 변경
  const id = req.params.id;
    socket.onopen = () => {
      console.log('Connected to WebSocket server');

      // 클라이언트에서 join 메시지 보내기
      const joinMessage = {
        userId: id,
        message: 'join',
      };
      socket.send(JSON.stringify(joinMessage));
    };

    socket.onmessage = (event) => {
      const data = event.data;
      console.log('Received data from server:', data);
    };
    res.send('Hello World!');
  });


app.listen(5000, () => {
  console.log('Example app listening on port 5000!');
});