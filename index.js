// https://www.youtube.com/watch?v=T-Pum2TraX4&ab_channel=JonathanSanchez
// npm run docs
import express from 'express';
import jwt from 'jsonwebtoken';
import AWS from 'aws-sdk';
import multer from 'multer';

import {getMessagesByChatId,getChatsByUserId,getMessagesBetweenUsers,markMessageDelivered,saveMessage,updateUserProfilePicture,updateToggles,updateDescription,updateExistingUsers,updateName,selectUserById,getContacts,deleteContact,addContact,searchUserByEmail,createUser,signIn,clearUsersTable,setAccountStatus,updateCode,getCodeById,selectAllUsers,isEmailAlreadyRegistered,userNameEmailStep, setPassword} from './db.js';
import nodemailer from 'nodemailer';

const app = express();
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'fagnernunes1108@gmail.com', // Your email
    pass: 'kcnj wyae ehov qgdl' // Your email password
  }
});

// Configure AWS SDK
AWS.config.update({
  accessKeyId: 'AKIA6GBMHBXKSJ4MBQ5B',
  secretAccessKey: '49tWX4UWShQ3F3p/qzAcJrTuoJAe3xrpYjSLW9Rr',
  region: 'eu-north-1'
});

const s3 = new AWS.S3();
const upload = multer({ storage: multer.memoryStorage() });

// Middleware to parse JSON bodies in POST requests.. upload.single('profilePicture') 
app.post('/upload-profile-picture', authenticateToken, upload.single('photo'), async (req, res) => {
  const TokenData = getDataFromToken(req); // Assuming authenticateToken middleware sets req.user
  const file = req.file;

  if (!file) {

    return res.status(400).json({ error: true, errorMessage: 'No file uploaded', data: null });
  }

  console.log("preparing params")

  const params = {
    Bucket: 'msgappfinalproject',
    Key: `${TokenData.id}-${Date.now()}-${file.originalname}`,
    Body: file.buffer,
    ContentType: file.mimetype,
    
  };

  
  try {
    console.log('Uploading data...');
    const data = await s3.upload(params).promise();
    console.log('uploaded data: ');
    const profilePictureUrl = data.Location;
    console.log('Profile picture URL: ', profilePictureUrl);
    await updateUserProfilePicture(TokenData.id, profilePictureUrl);
    console.log('Profile picture URL saved in database');
    res.json({ error: false, errorMessage: null, data: { profilePictureUrl } });
  } catch (err) {
    console.log('Failed to upload profile picture: ', err);
    res.status(500).json({ error: true, errorMessage: 'Failed to upload profile picture', data: null });
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

// function to aultenticate the token send to the websocket server and return if the token is valid or not
function authenticateTokenWebsocket(token) {
  const user = jwt.verify(token, JWT_SECRET);
  return user;
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
      
      res.json({error: false,token:token, errorMessage: null, data: token});
    }else{
      console.log('Failed to set account status');
      res.json({error: true, errorMessage: 'Failed to set account status', data: null});
    }
    
  }else{
    console.log('Failed to set password');
    res.json({error: true, errorMessage: 'Failed to set password', data: null});
  }

});

//user/update-description/:description to update user description
app.get('/user/update-description/:description',authenticateToken, async (req, res) => {
  const tokenData = getDataFromToken(req);
  const description = req.params.description;
  const data = await updateDescription(tokenData.id, description);
  if(data.success){
    res.json({error: false, errorMessage: null, data: null});
  }else{
    res.json({error: true, errorMessage: 'Failed to update description', data: null});
  }
})
// update toggles `${baseurlBack}/user/update-toggles/${sound}/${notification}/${vibration}`;
app.get('/user/update-toggles/:sound/:notification/:vibration',authenticateToken, async (req, res) => {
  const tokenData = getDataFromToken(req);
  // turt string to boolean
  const sound = req.params.sound === 'true';
  const notification = req.params.notification === 'true';
  const vibration = req.params.vibration === 'true';
  const data = await updateToggles(tokenData.id, sound, notification, vibration);
  if(data.success){
    res.json({error: false, errorMessage: null, data: null});
  }else{
    res.json({error: true, errorMessage: 'Failed to update toggles', data: null});
  }
});
// user/update-name/:name to update user name
app.get('/user/update-name/:name',authenticateToken, async (req, res) => {
  const tokenData = getDataFromToken(req);
  const name = req.params.name;
  const data = await updateName(tokenData.id, name);
  if(data.success){
    res.json({error: false, errorMessage: null, data: null});
  }else{
    res.json({error: true, errorMessage: 'Failed to update name', data: null});
  }
});
app.get('/user/getUser', authenticateToken,async (req, res) => {
  const tokenData = getDataFromToken(req);
  const user = await selectUserById(tokenData.id);
  if(user.success){
    res.json({error: false, errorMessage: null, data: user});
  }else{
    console.log('Failed to get user');
    res.json({error: true, errorMessage: 'Failed to get user', data: null});
  }

});

//endpoint to update Password
app.get('/user/update-password/:password', authenticateToken, async (req, res) => {
  const tokenData = getDataFromToken(req);
  const password = req.params.password;
  const data = await setPassword(tokenData.id, password);
  if(data.success){
    res.json({error: false, errorMessage: null, data: null});
  }else{
    res.json({error: true, errorMessage: 'Failed to update password', data: null});
  }
});

// endpoint to receive a profile picture send it to 
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





// endpoint to get messages between two users /messages/${userInfo.id}/{contactInfo.id}
app.get('/messages/:sender/:receiver', authenticateToken, async (req, res) => {
  const sender = req.params.sender;
  const receiver = req.params.receiver;
  console.log('sender',sender);
  console.log('receiver',receiver);
  const messages = await getMessagesBetweenUsers(sender, receiver);
  
  if(messages.success){
    console.log('Messages:', messages.messages);
    res.json({error: false, errorMessage: null, data: messages.messages});
  }else{
    res.json({error: true, errorMessage: 'Failed to get messages', data: null});
  }

});


app.get('/chats/getChatsAndMessages', authenticateToken, async (req, res) => {
  const userId = getDataFromToken(req).id;

  try {
    const chatsResult = await getChatsByUserId(userId);
    if (!chatsResult.success) {
      return res.status(500).json({ success: false, message: chatsResult.message });
    }

    const chats = chatsResult.chats;
    const chatsWithMessages = [];

    for (const chat of chats) {
      const messagesResult = await getMessagesByChatId(chat.id);
      if (messagesResult.success) {
        chatsWithMessages.push({ 
          ...chat, 
          messages: messagesResult.messages 
        });
      } else {
        chatsWithMessages.push({ 
          ...chat, 
          messages: [] 
        });
      }
    }

  
    return res.json({ success: true, chats: chatsWithMessages });
  } catch (error) {
    console.error('Error getting chats and messages: ', error);
    return res.status(500).json({ success: false, message: 'Error getting chats and messages' });
  }
});
// endpoint to create a user
app.get('/create-users', (req, res) => {
  users.forEach(async (user) => {
    await createUser(user.name, user.email, user.password, user.avatarUrl, user.code, user.code_timestamp, user.active, user.logginAttempt, user.logginAttempt_timestamp);
  });
  res.json({message: 'Users created'});
});

async function  savemessage  (delivered, read, message, sender, receiver, imageLink, msgTimestamp){
  
  // Save the message to the database
  //const message = await saveMessage(delivered, read, message, sender, receiver, imageLink, msgTimestamp);
  //console.log('Message saved to database:', message);
  return new Promise(async (resolve, reject) => {
    const messageReturn = await saveMessage(delivered, read, message, sender, receiver, imageLink, msgTimestamp);

    if(messageReturn.success){
      resolve(messageReturn);
    }
      else{
        reject(messageReturn);
      }
  });

}

async function markMessageDeliveredTouser(messageId){
  return new Promise(async (resolve, reject) => {
    const messageReturn = await markMessageDelivered(messageId);
    if(messageReturn.success){
      resolve(messageReturn);
    }
      else{
        reject(messageReturn);
      }
  });
}
app.listen(5001, () => {console.log('Server is running on port 5001')});

app.get('/', (req, res) => res.json({message: 'Hello World'}))  // http://localhost:5001/



//================= Websocket server =================

import {WebSocket, WebSocketServer } from 'ws';
import { confirmPasswordReset } from 'firebase/auth';

const server = new WebSocketServer({ port: 8080 }); // Create a WebSocket server

function heartbeat() { // Function to check if the client is alive
  this.isAlive = true;
}

server.on('connection', socket => {
  console.log('Client connected');

  // Initialize the isAlive property
  socket.isAlive = true; 
  socket.on('pong', heartbeat); // Listen for the pong message

  // Wait for the client to send its user ID
  socket.once('message', message => { // Listen for the first message

    const userId = message.toString(); // Convert the message to a string
    socket.userId = userId; // Store the user ID in the socket object
    console.log(`Client connected with user ID: ${userId}`);

    // Send a welcome message to the client
    socket.send(`Welcome to the WebSocket server! Your user ID is ${userId}`);

    // Handle subsequent messages from the client
    socket.on('message', message => { // Listen for messages
    
      // message is a string, converting to json
      message = JSON.parse(message);

if (message.type === 'message') {
    const msg = {
      "delivered": false,
      "read": false,
      "message": message.msgObj.message,
      "sender": message.msgObj.sender,
      "receiver": message.msgObj.receiver,
      "imageLink": message.msgObj.imageLink,
      "msgTimestamp": Date.now()
    };

    // Save message to the database
    savemessage(msg.delivered, msg.read, msg.message, msg.sender, msg.receiver, msg.imageLink, msg.msgTimestamp).then(() => {
      console.log('Message saved to database:', msg);
      // add msg id to the message object
      msg.id = message.msgObj.id;
      const finalMessage = JSON.stringify(msg);
      socket.send(`Server: ${finalMessage}`);

        // Send the message to the receiver if the database operation is successful
        server.clients.forEach(client => {
          if (client !== socket && client.readyState === WebSocket.OPEN && client.userId === message.msgObj.receiver) {
            client.send(`User ${msg.sender} says: ${msg.message}`);
            console.log(`Forwarded message to user ${message.msgObj.receiver}`);
            
          }
        })
    }).catch((error) => {
      console.log('Failed to save message to database:', error);
    });  
  

    console.log(`Echoed message back to user ${message.msgObj.receiver} the message: ${message}`);
}
if (message.type === 'ping_message_delived') {
  markMessageDeliveredTouser(message.msgObj.messageId)
}


    
      
      // Echo the message back to the client
      socket.send(`Server: ${message}`); // Send a message to the client who just sent the message
      
      // forward to a client with a specific user ID
      
    });

    // Handle client disconnection
    socket.on('close', () => {
      console.log(`Client with user ID ${userId} disconnected`);
    });
  });
});

// Set up a ping interval to check if clients are alive
const interval = setInterval(() => {
  server.clients.forEach(socket => {
    if (socket.isAlive === false) {
      console.log(`Terminating dead connection for user ID ${socket.userId}`);
      return socket.terminate();
    }

    socket.isAlive = false;
    socket.ping();
  });
}, 30000); // Ping every 30 seconds

server.on('close', () => {
  clearInterval(interval);
});

console.log('WebSocket server is running on ws://localhost:8080');


//================= Handle messaging =================
