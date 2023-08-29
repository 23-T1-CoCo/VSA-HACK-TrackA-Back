import express from 'express';
import { addWaitingData, getWaitingData } from './DB/db.mjs'
import { createQueues } from './socket/queueServer.mjs';
import bodyParser from 'body-parser';

const app = express();
app.use(bodyParser.json());



app.get('/setData', async (req, res) => {
  const min = 1;
  const max = 100;
  const randomInRange = Math.floor(Math.random() * (max - min + 1)) + min;

  // 현재시간
  const currentTime = Date.now();
  console.log(currentTime);

  try{
    await addWaitingData(currentTime, randomInRange, 'product456')
    res.send(randomInRange);
  } catch(err) {
    console.error('Error setting data:', error);
    res.status(500).send('Error setting data');
  }
});

app.get('/getData', async (req, res) => {

  try{
    const waitingData = await getWaitingData();
    res.json(waitingData);
  } catch(err) {
    console.error('Error getting waiting data:', error);
    res.status(500).send('Error getting waiting data');
  }

});

app.listen(5000, () => {
  console.log('Example app listening on port 5000!');
});