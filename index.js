// https://www.youtube.com/watch?v=T-Pum2TraX4&ab_channel=JonathanSanchez
// npm run docs
import express from 'express';
import jwt from 'jsonwebtoken';

import {getContacts,deleteContact,addContact,searchUserByEmail,createUser,signIn,clearUsersTable,setAccountStatus,updateCode,getCodeById,selectAllUsers,isEmailAlreadyRegistered,userNameEmailStep, setPassword} from './db.js';
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
 * @returns {string} // The generated token
 */
function generateToken(data) {
  return jwt.sign(data, JWT_SECRET, { expiresIn: '36h' });
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
 * @apiGroup Register
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
              ;}else {

                const userinformationByemail = await isEmailAlreadyRegistered(email) 
                console.log(userinformationByemail);
                if(userinformationByemail.AccountStatus=="active"&& userinformationByemail.email_registered==true) {
                res.json({error:true,
                          errorMessage:'Email already registered',
                          data:null})
                ;
              
                }else{
                // genenerate a random 4 digits number
                const randomNumber = Math.floor(Math.random() * 9000) + 1000;               
                //create timestamp for now 
                const timestamp = Date.now();

               // const response = userNameEmailStep(name, email, randomNumber, timestamp, 'pending');
                
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
                    let response
                    if(userinformationByemail.email_registered==true){
                      const newCodeData = await updateCode(userinformationByemail.id, randomNumber, timestamp);
                      const data = {'id':userinformationByemail.id,"success":true}
                      const token = generateToken(data);
                      response = {error: false, errorMessage: null, "token":token ,data: data};
                    }else{
                      const data = await userNameEmailStep(name, email, randomNumber, timestamp, 'pending');
                      const token = generateToken(data);
                      response = {error: false, errorMessage: null,token:token, data: data};
                    }
                   
                    res.json(response);
                  }
                });
              }

            }
              }

     else {
         res.json({error:true,
                    errorMessage:'Name and email are required',
                    data:null})
         }});
    //createUser(req.params.name, req.params.email, 'securePassword123', 'http://example.com/avatar.jpg');


/** 
 * @function getDataFromToken
 * @description This function gets the data from the JWT token sent by the user in the Authorization header.
 * @param {*} req // The request object from Express
 * 
 * @returns // The data from the JWT token
*/
function getDataFromToken(req){
  // get data from the JWT token token
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  return jwt.verify(token, JWT_SECRET);
}

/**
 * @api {get} /register/confirmation-code/:code Register a new user 
 * @apiName RegisterUser
 * @apiGroup Register
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
  console.log(`Data: `, data);
  const dbData = await getCodeById(data.id);
 
 
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


/**
 * @api {get} /register/resend-code Resend the confirmation code
 * @apiName ResendCode
 * @apiGroup User
 * @apiVersion  1.0.0
 * @apiDescription This endpoint is used to resend the confirmation code to the user's email address.
 * @apiSuccess {Boolean} error The error status
 * @apiSuccess {String} errorMessage The error message
 * @apiSuccess {Object} data The user data
 *  
 */

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
    res.json({error: true, errorMessage: 'Failed to update code', data: null});
  }


});

// and endpoint to that adds a contact to the user's contact list
app.get('/contacts/add-contact/:id',authenticateToken, async (req, res) => {
  const tokenData = getDataFromToken(req);
  const id = req.params.id;

  // add contact to the user's contact list
  const data = await addContact(tokenData.id, id);
  if(data.success){
    res.json({error: false, errorMessage: null, data: null});
  }else{
    res.json({error: true, errorMessage: 'Failed to add contact', data: null});
  }
});

//endpoint to delete contact
app.get('/contacts/delete-contact/:id',authenticateToken, async (req, res) => {
  const tokenData = getDataFromToken(req);
  const id = req.params.id;
  console.log('id',id);
  // delete contact from the user's contact list
  const data = await deleteContact(tokenData.id, id);
  if(data.success){
    res.json({error: false, errorMessage: null, data: null});
  }else{
    res.json({error: true, errorMessage: 'Failed to delete contact', data: null});
  }
});

// endpoint to get all contacts
app.get('/contacts/get-contacts',authenticateToken, async (req, res) => {
  const tokenData = getDataFromToken(req);
  const contacts = await getContacts(tokenData.id);
  if(contacts.success){
    // return only id, name, email, avatarUrl,and isFriend

    const ReturnedContacts = contacts.contacts.map(contact => 
      {return {id: contact.id, name: contact.name, email: contact.email, avatarUrl: contact.avatarUrl ,contact:true}}
    );    
    res.json({error: false, errorMessage: null, data: ReturnedContacts});
  }else{
    res.json({error: true, errorMessage: 'Failed to get contacts', data: null});
  
  }
  
});
// endpoint to search a user by email and for each user return id, name, email, AccountStatus, email_registered, avatarUrl and if users are friend take user id from token and exclude from the list

app.get('/contacts/search-user/:email', authenticateToken, async (req, res) => {
  const tokenData = getDataFromToken(req);
  const email = req.params.email;
  // get users by email and exclude the user with the token id
  const users = await searchUserByEmail(tokenData.id, email);
  if (users.success) {
    // return only id, name, email, AccountStatus, email_registered, avatarUrl, isFriend
    console.log("users returned");
    const usersToReturn = users.users.map(user => {
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        AccountStatus: user.AccountStatus,
        email_registered: user.email_registered,
        avatarUrl: user.avatarUrl,
        contact: user.isFriend
      };
    });
    console.log(users);
    res.json({ error: false, errorMessage: null, data: usersToReturn });
  } else {
    res.json({ error: true, errorMessage: 'Failed to get contacts', data: null });
  }
});
/**
 * @api {get} /register/password/:password Set the password
 * @apiName SetPassword
 * @apiGroup register
 * @apiVersion  1.0.0
 * @apiDescription This endpoint is used to set the password for the user. The user must provide the password. 
 * @apiSuccess {Boolean} error The error status
 * @apiSuccess {String} errorMessage The error message
 * @apiSuccess {Object} data The user data
 * 
 * 
*/

app.get('/register/password/:password',authenticateToken, async (req, res) => {
  const tokenData = getDataFromToken(req);
  const password = req.params.password;
  const data = await setPassword(tokenData.id, password);

  if(data.success){
    console.log('Password set');
    const AccountStatus = setAccountStatus(tokenData.id, 'active');
    if(AccountStatus){
      console.log('Account is active');
      const token = generateToken({id: tokenData.id, loggedIn: true, AccountStatus: 'active',loggedInAt: Date.now()});
      res.json({error: false,token:token, errorMessage: null, data: null});
    }else{
      console.log('Failed to set account status');
      res.json({error: true, errorMessage: 'Failed to set account status', data: null});
    }
    
  }else{
    console.log('Failed to set password');
    res.json({error: true, errorMessage: 'Failed to set password', data: null});
  }

});


app.get('/login/:email/:password',async (req, res) => {

  const email = req.params.email;
  const password = req.params.password;

  // search for email and password in the database
  const user = await signIn(email, password);
  
  if(user.success){
   
    const token = generateToken({id: user.id, loggedIn: true, AccountStatus: user.AccountStatus,loggedInAt: Date.now()});
   
    res.json({error: false,token:token, errorMessage: null, data: null});

  }else{
    if(user.AccountStatus == 'blocked'){

      // calculate how much time has passed since the last login attempt and how long left to hit the 5 min mark
      const tryAgain2 = Math.floor( (Date.now() - user.logginAttempt_timestamp )/60000,2); 
      const tryAgain = 5 - tryAgain2;
      console.log('Account is blocked. Try again in ', tryAgain, ' minutes');

      res.json({error: true, errorMessage: 'Account is blocked. Try again in '+tryAgain +" min", data: null});
      return;
    }
    res.json({error: true, errorMessage: 'Invalid email or password', data: null});
  }
});

/**
 * @api {get} /select-all-users Select all users
 * @apiName SelectAllUsers
 * @apiGroup admin
 * @apiVersion  1.0.0
 * @apiDescription This endpoint selects all users from the database.
 * @apiSuccess {Array} users An array of user objects
 * 
 */
app.get('/admin/select-all-users', async (req, res) => {
  const users = await selectAllUsers();
  res.json({"users":users});

})

/**
 * @api {get} /admin/clear-users-table Clear the user table
 * @apiName ClearUsersTable
 * @apiGroup admin
 * @apiVersion  1.0.0
 * @apiDescription This endpoint clears the user table.
 * @apiSuccess {String} message A message confirming that the table has been cleared
 * 
 
*/
// endpoint to clear the user table
app.get('/admin/clear-users-table', async (req, res) => {
  // clear the user table
  await clearUsersTable();
  res.json({message: 'Table cleared'});
})

const users = [
  {
    name: "Alice Smith",
    email: "alice@example.com",
    password: "securepassword123",
    avatarUrl: "http://example.com/avatar1.png",
    code: "A1B2C3",
    code_timestamp: "2023-06-15T14:48:00Z",
    active: true,
    logginAttempt: 1,
    logginAttempt_timestamp: "2023-06-15T14:50:00Z"
  },
  {
    name: "Bob Johnson",
    email: "bob@example.com",
    password: "anotherpassword456",
    avatarUrl: "http://example.com/avatar2.png",
    code: "D4E5F6",
    code_timestamp: "2023-06-16T09:30:00Z",
    active: false,
    logginAttempt: 3,
    logginAttempt_timestamp: "2023-06-16T09:35:00Z"
  },
  {
    name: "Charlie Brown",
    email: "charlie@example.com",
    password: "yetanotherpassword789",
    avatarUrl: "http://example.com/avatar3.png",
    code: "G7H8I9",
    code_timestamp: "2023-06-17T12:20:00Z",
    active: true,
    logginAttempt: 2,
    logginAttempt_timestamp: "2023-06-17T12:25:00Z"
  },
  {
    name: "Diana Prince",
    email: "diana@example.com",
    password: "supersecurepassword012",
    avatarUrl: "http://example.com/avatar4.png",
    code: "J1K2L3",
    code_timestamp: "2023-06-18T15:00:00Z",
    active: true,
    logginAttempt: 0,
    logginAttempt_timestamp: null
  },
  {
    name: "Edward Nygma",
    email: "edward@example.com",
    password: "riddlerpassword345",
    avatarUrl: "http://example.com/avatar5.png",
    code: "M4N5O6",
    code_timestamp: "2023-06-19T17:45:00Z",
    active: false,
    logginAttempt: 5,
    logginAttempt_timestamp: "2023-06-19T17:50:00Z"
  }
];

// endpoint to create a user
app.get('/create-users', (req, res) => {
  users.forEach(async (user) => {
    await createUser(user.name, user.email, user.password, user.avatarUrl, user.code, user.code_timestamp, user.active, user.logginAttempt, user.logginAttempt_timestamp);
  });
  res.json({message: 'Users created'});
});
app.listen(5001, () => {console.log('Server is running on port 5001')});

app.get('/', (req, res) => res.json({message: 'Hello World'}))  // http://localhost:5001/



//================= Websocket server =================

import {WebSocketServer} from 'ws'
const server = new WebSocketServer({ port: 8080 });

server.on('connection', socket => {
  console.log('Client connected');

  // Send a welcome message to the client
  socket.send('Welcome to the WebSocket server!');

  // Handle messages from clients
  socket.on('message', message => {
    console.log(`Received message: ${message}`);
    // Echo the message back to the client
    socket.send(`Server: ${message}`);
  });

  // Handle client disconnection
  socket.on('close', () => {
    console.log('Client disconnected');
  });
});

console.log('WebSocket server is running on ws://localhost:8080');