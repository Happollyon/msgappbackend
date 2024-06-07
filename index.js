// https://www.youtube.com/watch?v=T-Pum2TraX4&ab_channel=JonathanSanchez
// npm run docs
import express from 'express';
const app = express();
import {createUser,selectAllUsers} from './db.js';

/**
 * @module backend
 * @description This is the backend module
 * @requires express
 * @requires db
 * @author Fagner Nunes
 * @version 1.0
 */


/**
 * @function createUser
 * @description This function creates a new user
 * @param {string} name - The name of the user
 * @param {string} email - The email of the user
 * @param {string} password - The password of the user
 * @param {string} avatar - The avatar of the user
 * @returns {Promise<void>}
 */


app.get('/create-user', (req, res) => {
    createUser('John Doe', 'john.doe@example.com', 'securePassword123', 'http://example.com/avatar.jpg');
});


/**
 * @function selectAllUsers
 * @description This function selects all users
 * @returns {Promise<void>}
 
 */
app.get('/select-all-users', async (req, res) => {
  const users = await selectAllUsers();
  res.json({users});
})


app.listen(5001, () => {console.log('Server is running on port 5001')});

app.get('/', (req, res) => res.json({message: 'Hello World'}))  // http://localhost:5001/;