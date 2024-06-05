// https://www.youtube.com/watch?v=T-Pum2TraX4&ab_channel=JonathanSanchez
import express from 'express';
const app = express();

import db from "./firebase.js";

const usersCollection = db.collection('users');

async function createUser(name, email, password, avatarUrl) {
  const newUser = {
    name,
    email,
    password,
    avatarUrl
  };

  try {
    const docRef = await usersCollection.add(newUser);
    console.log(`User created with ID: ${docRef.id}`);
  } catch (error) {
    console.error('Error adding user: ', error);
  }
}

app.get('/create-user', (req, res) => {
    createUser('John Doe', 'john.doe@example.com', 'securePassword123', 'http://example.com/avatar.jpg');
});
// Example usage:



app.listen(5001, () => {console.log('Server is running on port 5001')});

app.get('/', (req, res) => res.json({message: 'Hello World'}))  // http://localhost:5001/;