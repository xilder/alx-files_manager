import express from 'express';
import AppController from './controllers/AppController';

const port = process.env.PORT || 5000;
const app = express();

app.get('/status', (req, res) => AppController.getStatus(req, res));
app.get('/stats', (req, res) => AppController.getStats(req, res));

app.listen(port, () => {
  console.log(`The server is listening on port: ${port}`);
});
