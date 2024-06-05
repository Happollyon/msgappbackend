// https://www.youtube.com/watch?v=T-Pum2TraX4&ab_channel=JonathanSanchez
import express from 'express';
const app = express();

import {createUser,selectAllUsers} from './db.js';

app.get('/create-user', (req, res) => {
    createUser('John Doe', 'john.doe@example.com', 'securePassword123', 'http://example.com/avatar.jpg');
});

app.get('/select-all-users', async (req, res) => {
  const users = await selectAllUsers();
  res.json({users});
})


app.listen(5001, () => {console.log('Server is running on port 5001')});

app.get('/', (req, res) => res.json({message: 'Hello World'}))  // http://localhost:5001/;