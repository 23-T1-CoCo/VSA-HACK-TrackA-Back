import express from 'express';

const app = express();

app.get('/', (req, res) => {
  res.send('!');
});

app.listen(5000, () => {
  console.log('Example app listening on port 5000!');
});