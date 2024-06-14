// https://www.youtube.com/watch?v=T-Pum2TraX4&ab_channel=JonathanSanchez
// npm run docs
import express from 'express';
import jwt from 'jsonwebtoken';

import {updateCode,getCodeById,selectAllUsers,isEmailAlreadyRegistered,userNameEmailStep} from './db.js';
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
/**
 * @function generateToken
 * @description This function generates a token using the JWT library and a secret key. The token expires in 1 hour.
 * @param {*} data  // The data to be stored in the token
 * @returns // The generated token
 */
function generateToken(data) {
  return jwt.sign(data, JWT_SECRET, { expiresIn: '1h' });
}

/**
 * @function authenticateToken
 * @description This function authenticates the token sent by the user in the Authorization header. If the token is not present, it sends a 401 status code. If the token is not valid, it sends a 403 status code.
 * @param {*} req // The request object from Express  
 * @param {*} res // The response object from Express
 * @param {*} next // The next function to be called
 * @returns // The next function to be called or a status code if the token is not present or not valid.
 * 
 */
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

/**
 * @api {get} /register/name-email/:name/:email Register a new user
 * @apiName RegisterUser
 * @apiGroup User
 * @apiVersion  1.0.0
 * @apiDescription This endpoint registers a new user with a name and an email address. The email address must be unique.
 * @apiParam {String} name The name of the user (required)  
 * @apiParam {String} email The email of the user (required)
 * @apiSuccess {Boolean} error The error status
 * @apiSuccess {String} errorMessage The error message
 * @apiSuccess {Object} data The user data
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
                const randomNumber = Math.floor(Math.random() * 9000) + 1000;               
                //create timestamp for now 
                const timestamp = Date.now();

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
                  
                    const data = await userNameEmailStep(name, email, randomNumber, timestamp);
                    const token = generateToken(data);
                    let response = {error: false, errorMessage: null,token:token, data: data};
                   
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


function getDataFromToken(req){
  // get data from the JWT token token
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  return jwt.verify(token, JWT_SECRET);
}

/**
 * @api {get} /register/confirmation-code/:code Register a new user 
 * @apiName RegisterUser
 * @apiGroup User
 * @apiVersion  1.0.0
 * @apiDescription This endpoint is used to confirm the registration of a new user. The user must provide the confirmation code that was sent to the email address.
 * @apiParam {String} code The confirmation code sent to the user's email address
 * @apiSuccess {Boolean} error The error status
 * @apiSuccess {String} errorMessage The error message
 * @apiSuccess {Object} data The user data
 * 
*/

app.get('/register/confirmation-code/:code',authenticateToken, async (req, res) => {
  const code = req.params.code;

  const data = getDataFromToken(req);
  const dbData = await getCodeById(data.id);
 
  console.log(`DB code: `, dbData.code, `Code: `, code);
  if (dbData.code == code) {
    console.log(`Data: `, data);

    // get current timsstamp and compare with  the timestamp in the database in seconds
    const currentTimestamp = Date.now();
    const timestampDiff = (currentTimestamp - dbData.code_timestamp)/1000;
   
    if(timestampDiff > 300){
      res.json({error:true,
                errorMessage:'Code expired',
                data:null})
    }else{
      res.json({error:false,
                errorMessage:null,
                data:null})
    }
  }else{
    res.json({error:true,
              errorMessage:'Invalid code',
              data:null})
  }
  
  


});



app.get('/register/resend-code',authenticateToken, async (req, res) => {
  const TokenData = getDataFromToken(req);
  
  // genenerate a random 4 digits number
  const randomNumber = Math.floor(Math.random() * 9000) + 1000;               
  //create timestamp for now 
  const timestamp = Date.now();

  // update the code and timestamp in the database
  const codeUpdated = updateCode(TokenData.id, randomNumber, timestamp);

  if(codeUpdated){
    // Send an email with the random number
    const mailOptions = {
      from: 'fagnernunes1108@gmail.com', // Sender address
      to: "fagnernunes11@gmail.com", // List of receivers
      subject: 'Your Verification Code', // Subject line
      text: `Your verification code is: ${randomNumber}` // Plain text body
    };


    // send email with the new code
    transporter.sendMail(mailOptions, async function(error, info){
      if (error) { // If there is an error
        res.json({error: true, errorMessage: 'Failed to send email. Try again', data: null});
      } else {
        res.json({error: false, errorMessage: null, data: null});
      }
    });
  }else{

  }


});

/**
 * @api {get} /select-all-users Select all users
 * @apiName SelectAllUsers
 * @apiGroup User
 * @apiVersion  1.0.0
 * @apiDescription This endpoint selects all users from the database.
 * @apiSuccess {Array} users An array of user objects
 * 
 */
app.get('/select-all-users', async (req, res) => {
  const users = await selectAllUsers();
  res.json({users});

})


app.listen(5001, () => {console.log('Server is running on port 5001')});

app.get('/', (req, res) => res.json({message: 'Hello World'}))  // http://localhost:5001/