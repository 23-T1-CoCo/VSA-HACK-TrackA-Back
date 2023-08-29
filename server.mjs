import express from 'express';
import {setData, getData} from './DB/db.mjs'
import bodyParser from 'body-parser';

const app = express();
app.use(bodyParser.json());

app.get('/', async (req, res) => {
  console.log("1")
  await setData('mykey', "hello")
  res.send('setData');
});

app.get('/test', async (req, res) => {
  await getData('mykey')
  res.send('getData');
});

app.get('/setData', async (req, res) => {
  const min = 1;
  const max = 100;
  const randomInRange = Math.floor(Math.random() * (max - min + 1)) + min;
  await setData('mykey', randomInRange);
  res.send('setData');
});

app.listen(5000, () => {
  console.log('Example app listening on port 5000!');
});