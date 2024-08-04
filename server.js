import express from 'express';
import addRoutes from './routes/index';

const port = process.env.PORT || 5000;
const app = express();
app.use(express.json());
addRoutes(app);

app.listen(port, () => {
  console.log(`The server is listening on port: ${port}`);
});

module.exports = app;
