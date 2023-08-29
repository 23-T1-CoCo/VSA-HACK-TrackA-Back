import express from 'express';
import {setData, connectToRedis} from './DB/db.mjs'
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

app.listen(5000, () => {
  console.log('Example app listening on port 5000!');
});