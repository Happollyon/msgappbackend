// https://www.youtube.com/watch?v=T-Pum2TraX4&ab_channel=JonathanSanchez
// npm run docs
import express from 'express'; // Import the express library
import jwt from 'jsonwebtoken'; // Import the jsonwebtoken library
import AWS from 'aws-sdk'; // Import the AWS SDK
import multer from 'multer'; // Import the multer library

import {blockUser,unblockUser,getMessagesByChatId,getChatsByUserId,getMessagesBetweenUsers,markMessageDelivered,saveMessage,updateUserProfilePicture,updateToggles,updateDescription,updateExistingUsers,updateName,selectUserById,getContacts,deleteContact,addContact,searchUserByEmail,createUser,signIn,clearUsersTable,setAccountStatus,updateCode,getCodeById,selectAllUsers,isEmailAlreadyRegistered,userNameEmailStep, setPassword} from './db.js';
import nodemailer from 'nodemailer'; // Import the nodemailer library
import dotenv from 'dotenv';
dotenv.config();

const secretKey = process.env.SECRET_KEY;
const password_gmail = process.env.password_gmail;
const aws_access_key_id = process.env.aws_access_key_id;
const aws_secret_access_key = process.env.aws_secret_access_key;
console.log(secretKey);
const app = express(); // Create an express app
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'fagnernunes1108@gmail.com', // Your email
    pass: password_gmail // Your email password
  }
});

// Configure AWS SDK
AWS.config.update({
  accessKeyId: aws_access_key_id,
  secretAccessKey: aws_secret_access_key,
  region: 'eu-north-1'
});

const s3 = new AWS.S3(); // Create an S3 service object
const upload = multer({ storage: multer.memoryStorage() }); // Create a multer object to handle file uploads
 

/**
 * @module backend
 * @description This is the backend module for the messaging app. It includes the endpoints for user registration, login, 
 * and messaging between users using WebSockets. It also includes the endpoints for uploading images to an S3 bucket,
 * updating user profile pictures, and updating user settings.
 * @requires express
 * @requires db
 * @author Fagner Nunes
 * @version 1.0
 */
// 


/**
 * @api {post} /send-image Upload an image
 * @apiName SendImage
 * @apiGroup Image
 * @apiDescription Uploads an image to the S3 bucket and returns the image URL.
 * 
 * @apiParam {File} photo The image file to be uploaded.
 * 
 * @apiSuccess {Boolean} error Indicates if there was an error.
 * @apiSuccess {String} errorMessage The error message, if any.
 * @apiSuccess {Object} data The data object containing the image URL.
 * @apiSuccess {String} data.imageUrl The URL of the uploaded image.
 * 
 * @apiError {Boolean} error Indicates if there was an error.
 * @apiError {String} errorMessage The error message.
 * @apiError {Object} data The data object, null if there was an error.
 */
app.post('/send-image', authenticateToken, upload.single('photo'), async (req, res) => {
  const TokenData = getDataFromToken(req); // Assuming authenticateToken middleware sets req.user
  const file = req.file;

  if (!file) {
    return res.status(400).json({ error: true, errorMessage: 'No file uploaded', data: null });
  }

  

  const params = {
    Bucket: 'msgappfinalproject',
    Key: `${TokenData.id}-${Date.now()}-${file.originalname}`,
    Body: file.buffer,
    ContentType: file.mimetype,
  };

  try {
   
    const data = await s3.upload(params).promise();
   
    const imageUrl = data.Location;
    
    res.json({ error: false, errorMessage: null, data: { imageUrl } });
  } catch (err) {
   
    res.status(500).json({ error: true, errorMessage: 'Failed to upload image', data: null });
  }
});

/**
 * @api {post} /upload-profile-picture Upload a profile picture
 * @apiName UploadProfilePicture
 * @apiGroup Profile
 * @apiDescription Uploads a profile picture to the S3 bucket and updates the user's profile picture URL.
 * 
 * @apiParam {File} photo The profile picture file to be uploaded.
 * 
 * @apiSuccess {Boolean} error Indicates if there was an error.
 * @apiSuccess {String} errorMessage The error message, if any.
 * @apiSuccess {Object} data The data object containing the profile picture URL.
 * @apiSuccess {String} data.profilePictureUrl The URL of the uploaded profile picture.
 * 
 * @apiError {Boolean} error Indicates if there was an error.
 * @apiError {String} errorMessage The error message.
 * @apiError {Object} data The data object, null if there was an error.
 */
app.post('/upload-profile-picture', authenticateToken, upload.single('photo'), async (req, res) => {
  const TokenData = getDataFromToken(req); // Assuming authenticateToken middleware sets req.user
  const file = req.file;

  if (!file) {

    return res.status(400).json({ error: true, errorMessage: 'No file uploaded', data: null });
  }

  

  const params = {
    Bucket: 'msgappfinalproject',
    Key: `${TokenData.id}-${Date.now()}-${file.originalname}`,
    Body: file.buffer,
    ContentType: file.mimetype,
    
  };

  
  try {
   
    const data = await s3.upload(params).promise();
    
    const profilePictureUrl = data.Location;
    
    await updateUserProfilePicture(TokenData.id, profilePictureUrl);
   
    res.json({ error: false, errorMessage: null, data: { profilePictureUrl } });
  } catch (err) {
    
    res.status(500).json({ error: true, errorMessage: 'Failed to upload profile picture', data: null });
  }
});


const JWT_SECRET = process.env.jwt_secret; // Secret key for JWT (change in production)



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
 * Authenticate the token sent to the WebSocket server.
 * 
 * @function authenticateTokenWebsocket
 * @description Verifies the provided token and returns the user data if the token is valid.
 * @param {string} token - The JWT token to be verified.
 * @returns {Object} The decoded user data from the token.
 * @throws {Error} If the token is invalid or verification fails.
 */
function authenticateTokenWebsocket(token) {
  const user = jwt.verify(token, JWT_SECRET);
  return user;
}




/**
 * @api {get} /register/name-email/:name/:email Register with Name and Email
 * @apiName RegisterNameEmail
 * @apiGroup Registration
 * @apiDescription Registers a user with their name and email. If the email is already registered and active, it returns an error. Otherwise, it generates a verification code, sends it via email, and returns a token.
 * 
 * @apiParam {String} name The name of the user.
 * @apiParam {String} email The email of the user.
 * 
 * @apiSuccess {Boolean} error Indicates if there was an error.
 * @apiSuccess {String} errorMessage The error message, if any.
 * @apiSuccess {Object} data The data object containing user information.
 * @apiSuccess {String} data.id The ID of the user.
 * @apiSuccess {Boolean} data.success Indicates if the registration was successful.
 * @apiSuccess {String} token The token generated for the user.
 * 
 * @apiError {Boolean} error Indicates if there was an error.
 * @apiError {String} errorMessage The error message.
 * @apiError {Object} data The data object, null if there was an error.
 */
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
 * @api {get} /register/confirmation-code/:code Confirm Registration Code
 * @apiName ConfirmRegistrationCode
 * @apiGroup Registration
 * @apiDescription Confirms the registration code sent to the user. Checks if the code matches and if it is within the valid time frame.
 * 
 * @apiParam {String} code The confirmation code sent to the user.
 * 
 * @apiSuccess {Boolean} error Indicates if there was an error.
 * @apiSuccess {String} errorMessage The error message, if any.
 * @apiSuccess {Object} data The data object, null if there was an error.
 * 
 * @apiError {Boolean} error Indicates if there was an error.
 * @apiError {String} errorMessage The error message.
 * @apiError {Object} data The data object, null if there was an error.
 */
app.get('/register/confirmation-code/:code',authenticateToken, async (req, res) => {
  const code = req.params.code;

  const data = getDataFromToken(req);
  
  const dbData = await getCodeById(data.id);
 
 
  if (dbData.code == code) {
    

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
 * @api {get} /register/resend-code Resend Verification Code
 * @apiName ResendVerificationCode
 * @apiGroup Registration
 * @apiDescription Resends a new verification code to the user's email.
 * 
 * @apiSuccess {Boolean} error Indicates if there was an error.
 * @apiSuccess {String} errorMessage The error message, if any.
 * @apiSuccess {Object} data The data object, null if there was an error.
 * 
 * @apiError {Boolean} error Indicates if there was an error.
 * @apiError {String} errorMessage The error message.
 * @apiError {Object} data The data object, null if there was an error.
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

/**
 * @api {get} /contacts/add-contact/:id Add Contact
 * @apiName AddContact
 * @apiGroup Contacts
 * @apiDescription Adds a contact to the user's contact list.
 * 
 * @apiParam {String} id The ID of the contact to be added.
 * 
 * @apiSuccess {Boolean} error Indicates if there was an error.
 * @apiSuccess {String} errorMessage The error message, if any.
 * @apiSuccess {Object} data The data object, null if there was an error.
 * 
 * @apiError {Boolean} error Indicates if there was an error.
 * @apiError {String} errorMessage The error message.
 * @apiError {Object} data The data object, null if there was an error.
 */


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

/**
 * @api {get} /contacts/delete-contact/:id Delete Contact
 * @apiName DeleteContact
 * @apiGroup Contacts
 * @apiDescription Deletes a contact from the user's contact list.
 * 
 * @apiParam {String} id The ID of the contact to be deleted.
 * 
 * @apiSuccess {Boolean} error Indicates if there was an error.
 * @apiSuccess {String} errorMessage The error message, if any.
 * @apiSuccess {Object} data The data object, null if there was an error.
 * 
 * @apiError {Boolean} error Indicates if there was an error.
 * @apiError {String} errorMessage The error message.
 * @apiError {Object} data The data object, null if there was an error.
 */
app.get('/contacts/delete-contact/:id',authenticateToken, async (req, res) => {
  const tokenData = getDataFromToken(req);
  const id = req.params.id;
  
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
    console.log(contacts);
    const ReturnedContacts = contacts.contacts.map(contact => 
      {return {id: contact.id, name: contact.name, email: contact.email, avatarUrl: contact.avatarUrl ,contact:true}}
    );    
    res.json({error: false, errorMessage: null, data: ReturnedContacts});
  }else{
    res.json({error: true, errorMessage: 'Failed to get contacts', data: null});
  
  }
  
});

/**
 * @api {get} /contacts/search-user/:email Search User by Email
 * @apiName SearchUserByEmail
 * @apiGroup Contacts
 * @apiDescription Searches for users by email and excludes the user with the token ID.
 * 
 * @apiParam {String} email The email of the user to search for.
 * 
 * @apiSuccess {Boolean} error Indicates if there was an error.
 * @apiSuccess {String} errorMessage The error message, if any.
 * @apiSuccess {Object[]} data The list of users found.
 * @apiSuccess {String} data.id The ID of the user.
 * @apiSuccess {String} data.name The name of the user.
 * @apiSuccess {String} data.email The email of the user.
 * @apiSuccess {String} data.AccountStatus The account status of the user.
 * @apiSuccess {Boolean} data.email_registered Indicates if the email is registered.
 * @apiSuccess {String} data.avatarUrl The avatar URL of the user.
 * @apiSuccess {Boolean} data.contact Indicates if the user is a contact.
 * 
 * @apiError {Boolean} error Indicates if there was an error.
 * @apiError {String} errorMessage The error message.
 * @apiError {Object} data The data object, null if there was an error.
 */
app.get('/contacts/search-user/:email', authenticateToken, async (req, res) => {
  const tokenData = getDataFromToken(req);
  const email = req.params.email;
  // get users by email and exclude the user with the token id
  const users = await searchUserByEmail(tokenData.id, email);
  if (users.success) {
    // return only id, name, email, AccountStatus, email_registered, avatarUrl, isFriend
  
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
   
    res.json({ error: false, errorMessage: null, data: usersToReturn });
  } else {
    res.json({ error: true, errorMessage: 'Failed to get contacts', data: null });
  }
});
/**
 * @api {get} /register/password/:password Set the password
 * @apiName SetPassword
 * @apiGroup Registration
 * @apiDescription Sets the password for the user. The user must provide the password.
 * 
 * @apiParam {String} password The password to be set.
 * 
 * @apiSuccess {Boolean} error Indicates if there was an error.
 * @apiSuccess {String} errorMessage The error message, if any.
 * @apiSuccess {Object} data The user data.
 * @apiSuccess {String} token The token generated for the user.
 * 
 * @apiError {Boolean} error Indicates if there was an error.
 * @apiError {String} errorMessage The error message.
 * @apiError {Object} data The data object, null if there was an error.
 */

app.get('/register/password/:password',authenticateToken, async (req, res) => {
  const tokenData = getDataFromToken(req);
  const password = req.params.password;
  const data = await setPassword(tokenData.id, password);

  if(data.success){
   
    const AccountStatus = setAccountStatus(tokenData.id, 'active');
    if(AccountStatus){
      
      const token = generateToken({id: tokenData.id, loggedIn: true, AccountStatus: 'active',loggedInAt: Date.now()});
      
      res.json({error: false,token:token, errorMessage: null, data: token});
    }else{
      
      res.json({error: true, errorMessage: 'Failed to set account status', data: null});
    }
    
  }else{
   
    res.json({error: true, errorMessage: 'Failed to set password', data: null});
  }

});
/**
 * @api {get} /user/update-description/:description Update User Description
 * @apiName UpdateUserDescription
 * @apiGroup User
 * @apiDescription Updates the description of the user.
 * 
 * @apiParam {String} description The new description for the user.
 * 
 * @apiSuccess {Boolean} error Indicates if there was an error.
 * @apiSuccess {String} errorMessage The error message, if any.
 * @apiSuccess {Object} data The data object, null if there was an error.
 * 
 * @apiError {Boolean} error Indicates if there was an error.
 * @apiError {String} errorMessage The error message.
 * @apiError {Object} data The data object, null if there was an error.
 */
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
/**
 * @api {get} /user/update-toggles/:sound/:notification/:vibration Update User Toggles
 * @apiName UpdateUserToggles
 * @apiGroup User
 * @apiDescription Updates the user's toggle settings for sound, notification, and vibration.
 * 
 * @apiParam {String} sound The sound setting (true/false).
 * @apiParam {String} notification The notification setting (true/false).
 * @apiParam {String} vibration The vibration setting (true/false).
 * 
 * @apiSuccess {Boolean} error Indicates if there was an error.
 * @apiSuccess {String} errorMessage The error message, if any.
 * @apiSuccess {Object} data The data object, null if there was an error.
 * 
 * @apiError {Boolean} error Indicates if there was an error.
 * @apiError {String} errorMessage The error message.
 * @apiError {Object} data The data object, null if there was an error.
 */
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

/**
 * @api {get} /user/update-name/:name Update User Name
 * @apiName UpdateUserName
 * @apiGroup User
 * @apiDescription Updates the name of the user.
 * 
 * @apiParam {String} name The new name for the user.
 * 
 * @apiSuccess {Boolean} error Indicates if there was an error.
 * @apiSuccess {String} errorMessage The error message, if any.
 * @apiSuccess {Object} data The data object, null if there was an error.
 * 
 * @apiError {Boolean} error Indicates if there was an error.
 * @apiError {String} errorMessage The error message.
 * @apiError {Object} data The data object, null if there was an error.
 */
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

/**
 * @api {get} /user/getUser Get User Information
 * @apiName GetUserInformation
 * @apiGroup User
 * @apiDescription Retrieves the information of the authenticated user.
 * 
 * @apiSuccess {Boolean} error Indicates if there was an error.
 * @apiSuccess {String} errorMessage The error message, if any.
 * @apiSuccess {Object} data The user data.
 * @apiSuccess {String} data.id The ID of the user.
 * @apiSuccess {String} data.name The name of the user.
 * @apiSuccess {String} data.email The email of the user.
 * @apiSuccess {String} data.AccountStatus The account status of the user.
 * @apiSuccess {Boolean} data.email_registered Indicates if the email is registered.
 * @apiSuccess {String} data.avatarUrl The avatar URL of the user.
 * 
 * @apiError {Boolean} error Indicates if there was an error.
 * @apiError {String} errorMessage The error message.
 * @apiError {Object} data The data object, null if there was an error.
 */
app.get('/user/getUser', authenticateToken,async (req, res) => {
  const tokenData = getDataFromToken(req);
  const user = await selectUserById(tokenData.id);
  if(user.success){
    res.json({error: false, errorMessage: null, data: user});
  }else{
   
    res.json({error: true, errorMessage: 'Failed to get user', data: null});
  }

});

/**
 * @api {get} /user/block/:id Block User
 * @apiName BlockUser
 * @apiGroup User
 * @apiDescription Blocks a user by their ID.
 * 
 * @apiParam {String} id The ID of the user to be blocked.
 * 
 * @apiSuccess {Boolean} error Indicates if there was an error.
 * @apiSuccess {String} errorMessage The error message, if any.
 * @apiSuccess {Object} data The data object, null if there was an error.
 * 
 * @apiError {Boolean} error Indicates if there was an error.
 * @apiError {String} errorMessage The error message.
 * @apiError {Object} data The data object, null if there was an error.
 */
app.get('/user/block/:id', authenticateToken, async (req, res) => {
  const tokenData = getDataFromToken(req);
  const targetUserId = req.params.id;
 

  const data = await blockUser(tokenData.id, targetUserId);
  if (data.success) {
    
    res.json({ error: false, errorMessage: null, data: null });
  } else {
    res.json({ error: true, errorMessage: 'Failed to block user', data: null });
  }
});

/**
 * @api {get} /user/unblock/:id Unblock User
 * @apiName UnblockUser
 * @apiGroup User
 * @apiDescription Unblocks a user by their ID.
 * 
 * @apiParam {String} id The ID of the user to be unblocked.
 * 
 * @apiSuccess {Boolean} error Indicates if there was an error.
 * @apiSuccess {String} errorMessage The error message, if any.
 * @apiSuccess {Object} data The data object, null if there was an error.
 * 
 * @apiError {Boolean} error Indicates if there was an error.
 * @apiError {String} errorMessage The error message.
 * @apiError {Object} data The data object, null if there was an error.
 */
app.get('/user/unblock/:id', authenticateToken, async (req, res) => {
  
  const tokenData = getDataFromToken(req);
  const targetUserId = req.params.id;

  const data = await unblockUser(tokenData.id, targetUserId);
  if (data.success) {
    
    res.json({ error: false, errorMessage: null, data: null });
  } else {
    res.json({ error: true, errorMessage: 'Failed to unblock user', data: null });
  }
});
/**
 * @api {get} /user/update-password/:password Update User Password
 * @apiName UpdateUserPassword
 * @apiGroup User
 * @apiDescription Updates the password of the authenticated user.
 * 
 * @apiParam {String} password The new password for the user.
 * 
 * @apiSuccess {Boolean} error Indicates if there was an error.
 * @apiSuccess {String} errorMessage The error message, if any.
 * @apiSuccess {Object} data The data object, null if there was an error.
 * 
 * @apiError {Boolean} error Indicates if there was an error.
 * @apiError {String} errorMessage The error message.
 * @apiError {Object} data The data object, null if there was an error.
 */
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


/**
 * @api {get} /login/:email/:password User Login
 * @apiName UserLogin
 * @apiGroup Authentication
 * @apiDescription Authenticates a user using their email and password.
 * 
 * @apiParam {String} email The email of the user.
 * @apiParam {String} password The password of the user.
 * 
 * @apiSuccess {Boolean} error Indicates if there was an error.
 * @apiSuccess {String} token The authentication token if login is successful.
 * @apiSuccess {String} errorMessage The error message, if any.
 * @apiSuccess {Object} data The data object, null if there was an error.
 * 
 * @apiError {Boolean} error Indicates if there was an error.
 * @apiError {String} errorMessage The error message.
 * @apiError {Object} data The data object, null if there was an error.
 */
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
      

      res.json({error: true, errorMessage: 'Account is blocked. Try again in '+tryAgain +" min", data: null});
      return;
    }
    res.json({error: true, errorMessage: 'Invalid email or password', data: null});
  }
});

/**
 * @api {get} /admin/select-all-users Select all users
 * @apiName SelectAllUsers
 * @apiGroup Admin
 * @apiDescription This endpoint selects all users from the database.
 * 
 * @apiSuccess {Array} users An array of user objects.
 * 
 * @apiError {Boolean} error Indicates if there was an error.
 * @apiError {String} errorMessage The error message.
 * @apiError {Object} data The data object, null if there was an error.
 */
app.get('/admin/select-all-users', async (req, res) => {
  const users = await selectAllUsers();
  res.json({"users":users});

})

/**
 * @api {get} /admin/clear-users-table Clear the user table
 * @apiName ClearUsersTable
 * @apiGroup Admin
 * @apiDescription This endpoint clears the user table.
 * 
 * @apiSuccess {String} message A message confirming that the table has been cleared.
 * 
 * @apiError {Boolean} error Indicates if there was an error.
 * @apiError {String} errorMessage The error message.
 * @apiError {Object} data The data object, null if there was an error.
 */
// endpoint to clear the user table
app.get('/admin/clear-users-table', async (req, res) => {
  // clear the user table
  await clearUsersTable();
  res.json({message: 'Table cleared'});
})




/**
 * @api {get} /messages/:sender/:receiver Get Messages Between Users
 * @apiName GetMessagesBetweenUsers
 * @apiGroup Messages
 * @apiDescription Retrieves messages between two users.
 * 
 * @apiParam {String} sender The ID of the sender.
 * @apiParam {String} receiver The ID of the receiver.
 * 
 * @apiSuccess {Boolean} error Indicates if there was an error.
 * @apiSuccess {String} errorMessage The error message, if any.
 * @apiSuccess {Object[]} data The list of messages.
 * 
 * @apiError {Boolean} error Indicates if there was an error.
 * @apiError {String} errorMessage The error message.
 * @apiError {Object} data The data object, null if there was an error.
 */

app.get('/messages/:sender/:receiver', authenticateToken, async (req, res) => {
  const sender = req.params.sender;
  const receiver = req.params.receiver;
  
  const messages = await getMessagesBetweenUsers(sender, receiver);
  
  if(messages.success){
    
    res.json({error: false, errorMessage: null, data: messages.messages});
  }else{
    res.json({error: true, errorMessage: 'Failed to get messages', data: null});
  }

});

/**
 * @api {get} /chats/getChatsAndMessages Get Chats and Messages
 * @apiName GetChatsAndMessages
 * @apiGroup Chats
 * @apiDescription Retrieves chats and their messages for the authenticated user.
 * 
 * @apiSuccess {Boolean} success Indicates if the operation was successful.
 * @apiSuccess {Object[]} chats The list of chats with their messages.
 * 
 * @apiError {Boolean} success Indicates if there was an error.
 * @apiError {String} message The error message.
 */
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


/**
 * @api {get} /create-users Create Users
 * @apiName CreateUsers
 * @apiGroup Users
 * @apiDescription Creates multiple users.
 * 
 * @apiSuccess {String} message A message confirming that the users have been created.
 * 
 * @apiError {Boolean} error Indicates if there was an error.
 * @apiError {String} errorMessage The error message.
 * @apiError {Object} data The data object, null if there was an error.
 */
app.get('/create-users', (req, res) => {
  users.forEach(async (user) => {
    await createUser(user.name, user.email, user.password, user.avatarUrl, user.code, user.code_timestamp, user.active, user.logginAttempt, user.logginAttempt_timestamp);
  });
  res.json({message: 'Users created'});
});

/**
 * Save the message to the database.
 * 
 * @function savemessage
 * @description Saves a message with the provided details to the database.
 * @param {boolean} delivered - Indicates if the message was delivered.
 * @param {boolean} read - Indicates if the message was read.
 * @param {string} message - The content of the message.
 * @param {string} sender - The ID of the sender.
 * @param {string} receiver - The ID of the receiver.
 * @param {string} imageLink - The link to the image associated with the message.
 * @param {number} msgTimestamp - The timestamp of the message.
 * @returns {Promise<Object>} A promise that resolves with the saved message details.
 * @throws {Error} If the message could not be saved.
 */
async function  savemessage  (delivered, read, message, sender, receiver, imageLink, msgTimestamp){
  
  // Save the message to the database
  //const message = await saveMessage(delivered, read, message, sender, receiver, imageLink, msgTimestamp);
  
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

/**
 * Mark a message as delivered to the user.
 * 
 * @function markMessageDeliveredTouser
 * @description Marks a message as delivered based on the provided message ID.
 * @param {string} messageId - The ID of the message to mark as delivered.
 * @returns {Promise<Object>} A promise that resolves with the message delivery status.
 * @throws {Error} If the message delivery status could not be updated.
 */
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
  

  // Initialize the isAlive property
  socket.isAlive = true; 
  socket.on('pong', heartbeat); // Listen for the pong message

  // Wait for the client to send its user ID
  socket.once('message', message => { // Listen for the first message

    const userId = message.toString(); // Convert the message to a string
    socket.userId = userId; // Store the user ID in the socket object
   

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

      // add msg id to the message object
      msg.id = message.msgObj.id;
      const finalMessage = JSON.stringify(msg);
      socket.send(`Server: ${finalMessage}`);

        // Send the message to the receiver if the database operation is successful
        server.clients.forEach(client => {
          if (client !== socket && client.readyState === WebSocket.OPEN && client.userId === message.msgObj.receiver) {
            client.send(`User ${msg.sender} says: ${msg.message}`);
           
            
          }
        })
    }).catch((error) => {
     
    });  
  

   
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
     
    });
  });
});

// Set up a ping interval to check if clients are alive
const interval = setInterval(() => {
  server.clients.forEach(socket => {
    if (socket.isAlive === false) {
  
      return socket.terminate();
    }

    socket.isAlive = false;
    socket.ping();
  });
}, 30000); // Ping every 30 seconds

server.on('close', () => {
  clearInterval(interval);
});




//================= Handle messaging =================
