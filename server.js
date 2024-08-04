import express from 'express';
import router from './routes/index';
import AppController from './controllers/AppController';

const port = process.env.PORT || 5000;
const app = express();
app.use(express.json())

app.get('/status', (req, res) => AppController.getStatus(req, res));
app.get('/stats', (req, res) => AppController.getStats(req, res));
app.use('/', router);

app.listen(port, () => {
  console.log(`The server is listening on port: ${port}`);
});
