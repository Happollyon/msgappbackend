// https://www.youtube.com/watch?v=T-Pum2TraX4&ab_channel=JonathanSanchez
// npm run docs
import express from 'express';
const app = express();
import {createUser,selectAllUsers,isEmailAlreadyRegistered,userNameEmailStep} from './db.js';

import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'fagnernunes1108@gmail.com', // Your email
    pass: 'kcnj wyae ehov qgdl' // Your email password
  }
});

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
                transporter.sendMail(mailOptions, function(error, info){
                  if (error) {
                    console.log(error);
                    res.json({error: true, errorMessage: 'Failed to send email', data: null});
                  } else {
                    console.log('Email sent: ' + info.response);
                    const response = userNameEmailStep(name, email, randomNumber, timestamp);
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