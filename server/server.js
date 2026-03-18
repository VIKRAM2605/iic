import dotenv from 'dotenv';
import express from 'express';
const app = express();


dotenv.config();

const PORT = process.env.PORT || 8001;

app.get('/', (req, res) => {
  res.send('Hello World! My first backend project is running.');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});