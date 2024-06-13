// https://www.youtube.com/watch?v=T-Pum2TraX4&ab_channel=JonathanSanchez
// npm run docs
import express from 'express';
import jwt from 'jsonwebtoken';

import {createUser,selectAllUsers,isEmailAlreadyRegistered,userNameEmailStep} from './db.js';
import nodemailer from 'nodemailer';

const app = express();
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'fagnernunes1108@gmail.com', // Your email
    pass: 'kcnj wyae ehov qgdl' // Your email password
  }
});

const JWT_SECRET = 'mysecret-key-test-123-fasfaf-f6254fdw95d46s58saf61afdfw0fw48df4d86f0asf48sa';
/**
 * @module backend
 * @description This is the backend module
 * @requires express
 * @requires db
 * @author Fagner Nunes
 * @version 1.0
 */


// Function to generate JWT
function generateToken(data) {
  return jwt.sign(data, JWT_SECRET, { expiresIn: '1h' });
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (token == null) return res.sendStatus(401); // If no token is present

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403); // If token is not valid
    req.user = user;
    next();
  });
}

/**
 * @function createUser
 * @description This function creates a new user
 * @param {string} name - The name of the user
 * @param {string} email - The email of the user
 * @param {string} password - The password of the user
 * @param {string} avatar - The avatar of the user
 * @returns {Promise<void>}
 * 
 *
 */

// add params to the URL
app.get('/register/name-email/:name/:email', async (req, res) => {
     const name = req.params.name;
     const email = req.params.email;
     
     if (name && email) {
          if(!email.includes('@') || !email.includes('.')){
              res.json({error:true,
                        errorMessage:'Invalid email',
                        data:null})
              ;}else if(await isEmailAlreadyRegistered(email)){

                res.json({error:true,
                          errorMessage:'Email already registered',
                          data:null})
                ;
              }
              else{
                // genenerate a random 4 digits number
                const randomNumber = Math.floor(Math.random() * 10000);
                //create timestamp for now 
                const timestamp = Date.now();
                console.log(`Random number: ${randomNumber}`);

                const response = userNameEmailStep(name, email, randomNumber, timestamp);
                
                // Send an email with the random number
                const mailOptions = {
                  from: 'fagnernunes1108@gmail.com', // Sender address
                  to: "fagnernunes11@gmail.com", // List of receivers
                  subject: 'Your Verification Code', // Subject line
                  text: `Your verification code is: ${randomNumber}` // Plain text body
                };

                // Send the email
                transporter.sendMail(mailOptions, async function(error, info){
                  if (error) { // If there is an error
                    
                    res.json({error: true, errorMessage: 'Failed to send email', data: null});
                  } else {
                    console.log('Email sent: ' + info.response);
                    const data = await userNameEmailStep(name, email, randomNumber, timestamp);
                    const token = generateToken(data);
                    let response = {error: false, errorMessage: null,token:token, data: data};
                    console.log(`Responding with: `, response);
                    res.json(response);
                  }
                });
              }

              
              }

     else {
         res.json({error:true,
                    errorMessage:'Name and email are required',
                    data:null})
         }});
    //createUser(req.params.name, req.params.email, 'securePassword123', 'http://example.com/avatar.jpg');



/**
 * @function confimationCode
 * @description This function confirms the code sent to the user by email
 *
*/

app.get('/register/confirmation-code/:code',authenticateToken, async (req, res) => {
  const code = req.params.code;
  console.log(`Code: ${code}`);
  res.json({code});
  // get the user data from the token

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

app.get('/', (req, res) => res.json({message: 'Hello World'}))  // http://localhost:5001/