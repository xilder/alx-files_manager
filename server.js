import express from 'express';
import addRoutes from './routes/index';

const port = process.env.PORT || 5000;
const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb' }));
addRoutes(app);

app.listen(port, () => {
  console.log(`Server running on port: ${port}`);
});

module.exports = app;
