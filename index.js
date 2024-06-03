// https://www.youtube.com/watch?v=T-Pum2TraX4&ab_channel=JonathanSanchez
import express from 'express';

const app = express();

app.listen(5001, () => {console.log('Server is running on port 5001')});

app.get('/', (req, res) => res.json({message: 'Hello World'}))  // http://localhost:5001/;
