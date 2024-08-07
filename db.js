import { updatePassword } from "firebase/auth";// import the updatePassword function from the firebase/auth module
import db from "./firebase.js"; // import the db object from the firebase.js file
import firebase from "firebase/compat/app"; // import the firebase/app module
const usersCollection = db.collection('users'); // get the users collection from the database
const messagesCollection = db.collection('messages'); // get the messages collection from the database
const chatsCollection = db.collection('chats'); // get the chats collection from the database

/**
 * Creates a new user and adds it to the users collection.
 * 
 * @function createUser
 * @description This function creates a new user object with the provided parameters and adds it to the users collection in the database. 
 * It initializes various user properties such as name, email, password, avatar URL, code, timestamps, and settings.
 * 
 * @param {string} name - The name of the user.
 * @param {string} email - The email of the user.
 * @param {string} password - The password of the user.
 * @param {string} avatarUrl - The URL of the user's avatar.
 * @param {string} code - The code associated with the user.
 * @param {Date} code_timestamp - The timestamp of the code.
 * @param {boolean} active - The active status of the user.
 * @param {number} logginAttempt - The number of login attempts.
 * @param {Date} logginAttempt_timestamp - The timestamp of the last login attempt.
 * @param {string} description - The description of the user.
 * @param {boolean} vibration - The vibration setting of the user.
 * @param {boolean} sound - The sound setting of the user.
 * @param {boolean} notification - The notification setting of the user.
 * 
 * @returns {Promise<void>} A promise that resolves when the user is added.
 * 
 * @throws {Error} Will throw an error if adding the user fails.
 */
// Function to create a new user
export async function createUser(name, email, password, avatarUrl, code, code_timestamp, active, logginAttempt, logginAttempt_timestamp, description, vibration, sound, notification) {
  const newUser = { // create a new user object
    name, // set the name
    email,// set the email
    password,// set the password
    avatarUrl,// set the avatarUrl
    code,// set the code
    code_timestamp,// set the code_timestamp
    active, // set the active
    logginAttempt,//  set the logginAttempt
    logginAttempt_timestamp, // set the logginAttempt_timestamp
    description, // set the description
    vibration,// set the vibration
    sound,//  set the sound
    notification, // set the notification
    contacts: [],// set the contacts
    blocked: [], // Add blocked field
    blockedUser: [] // Add blockedUser field
  };
  
  try { // try to add the new user to the users collection
    const docRef = await usersCollection.add(newUser); // add the new user to the users collection
    
  } catch (error) {// catch any errors
    console.error('Error adding user: ', error);
  }
}

/**
 * Checks if an email is already registered in the users collection.
 * 
 * @function isEmailAlreadyRegistered
 * @description This function queries the users collection to check if a user with the specified email already exists. 
 * It returns an object indicating whether the email is registered, along with the user's ID and account status if applicable.
 * 
 * @param {string} email - The email to check for registration.
 * 
 * @returns {Promise<Object>} A promise that resolves to an object containing:
 * - `email_registered` (boolean): Indicates if the email is registered.
 * - `id` (string|null): The ID of the user if the email is registered, otherwise null.
 * - `AccountStatus` (string): The account status of the user if the email is registered, otherwise "pending".
 * 
 * @throws {Error} Will throw an error if the query fails.
 */
export async function isEmailAlreadyRegistered(email){ // function to get a user by email
  try {
    const snapshot = await usersCollection.where('email', '==', email).get(); // get the document by email
    
    if (snapshot.empty) { // if no user found with the email is found
      
      return {'email_registered':false, 'id':null, 'AccountStatus':"pending"}; // return email_registered as false
    } 
    // return user data if email is already registered


    return {'email_registered':true, 'id':snapshot.docs[0].id, 'AccountStatus':snapshot.docs[0].data().AccountStatus}; // return email_registered as true and the user data
  } catch (error) {
    console.error('Error getting user by email: ', error);

  }

}


/**
 * Adds a contact to a user's contact list.
 * 
 * @function addContact
 * @description This function fetches the user's document by userId, retrieves the current contacts array, 
 * and adds the contactId to the array if it doesn't already exist. It then updates the user's document with the new contacts array.
 * 
 * @param {string} userId - The ID of the user to whom the contact will be added.
 * @param {string} contactId - The ID of the contact to be added.
 * 
 * @returns {Promise<Object>} A promise that resolves to an object containing:
 * - `success` (boolean): Indicates if the contact was successfully added.
 * 
 * @throws {Error} Will throw an error if the user is not found or if updating the user's document fails.
 */

export async function addContact(userId, contactId) {  // function to add a contact
  try {
    // Fetch the user's document by userId
    const userDoc = await usersCollection.doc(userId).get(); 
    
    if (!userDoc.exists) { // if user not found return an error
      throw new Error('User not found');
    }

    // Get the current contacts array
    const userData = userDoc.data(); // get the user data from the user document
    let contacts = userData.contacts || []; // get the contacts array from the user data or set it to an empty array if it doesn't exist

    // Add the contactId if it doesn't already exist in the array
    if (!contacts.includes(contactId)) {  // if the contactId is not already in the contacts array add it
      contacts.push(contactId);
    }

    // Update the user's document with the new contacts array
    await usersCollection.doc(userId).update({ contacts }); // update the user document with the new contacts array

    return { 'success': true }; // return success as true
  } catch (error) {
    console.error('Error adding contact: ', error); // log the error
    return { 'success': false }; // return success as false
  }
}

/**
 * Deletes a contact from a user's contact list.
 * 
 * @function deleteContact
 * @description This function fetches the user's document by userId, retrieves the current contacts array, 
 * and removes the contactId from the array if it exists. It then updates the user's document with the new contacts array.
 * 
 * @param {string} userId - The ID of the user from whom the contact will be deleted.
 * @param {string} contactId - The ID of the contact to be deleted.
 * 
 * @returns {Promise<Object>} A promise that resolves to an object containing:
 * - `success` (boolean): Indicates if the contact was successfully deleted.
 * 
 * @throws {Error} Will throw an error if the user is not found or if updating the user's document fails.
 */

export async function deleteContact(userId, contactId) { // function to delete a contact
  try {
    // Fetch the user's document
    const userDoc = await usersCollection.doc(userId).get();
    
    if (!userDoc.exists) { // if user not found return an error 
      throw new Error('User not found');
    }

    // Get the current contacts array
    const userData = userDoc.data();
    let contacts = userData.contacts || [];

    // Remove the contactId if it exists in the array
    contacts = contacts.filter(contact => contact !== contactId);

    // Update the user's document with the new contacts array
    await usersCollection.doc(userId).update({ contacts });

    return { 'success': true }; // return success as true
  } catch (error) { // catch any errors
    console.error('Error deleting contact: ', error);
    return { 'success': false }; // return success as false
  }
}
/**
 * Retrieves the contact list for a user, excluding blocked users.
 * 
 * @function getContacts
 * @description This function fetches the user's document by userId, retrieves the current contacts array, 
 * and filters out any contacts that are in the blockedUser array. It returns the filtered contacts.
 * 
 * @param {string} userId - The ID of the user whose contacts are to be retrieved.
 * 
 * @returns {Promise<Object>} A promise that resolves to an object containing:
 * - `success` (boolean): Indicates if the contacts were successfully retrieved.
 * - `contacts` (Array<string>): The filtered list of contact IDs.
 * - `message` (string): An error message if the operation fails.
 * 
 * @throws {Error} Will throw an error if fetching the user's document fails.
 */

export async function getContacts(userId) { // function to get contacts
  try { // try to get the contacts
    const userSnapshot = await usersCollection.doc(userId).get(); // get the user document by userId
    if (!userSnapshot.exists) { // if user not found return an error 
      return { "success": false, "message": "User not found" };
    }

    const userData = userSnapshot.data(); // get the user data from the user document
    const contacts = userData.contacts || []; // get the contacts array from the user data or set it to an empty array if it doesn't exist
    const blockedUsers = userData.blockedUser || []; // get the blockedUser array from the user data or set it to an empty array if it doesn't exist

    // Filter out contacts that are in the blockedUser array
    const filteredContacts = contacts.filter(contactId => !blockedUsers.includes(contactId));

    return { "success": true, "contacts": filteredContacts }; // return success as true and the filtered contacts
  } catch (error) {
    console.error('Error getting contacts: ', error); // log the error
    return { "success": false, "message": "Error getting contacts" }; // return success as false
  }
}

/**
 * Searches for users by email, excluding the requesting user and blocked users.
 * 
 * @function searchUserByEmail
 * @description This function searches the users collection for users with the specified email. 
 * It excludes the requesting user (identified by userId) and any users that are in the requesting user's blockedUser array.
 * 
 * @param {string} userId - The ID of the user making the request.
 * @param {string} email - The email to search for.
 * 
 * @returns {Promise<Object>} A promise that resolves to an object containing:
 * - `success` (boolean): Indicates if the search was successful.
 * - `users` (Array<Object>): An array of user objects that match the search criteria.
 * - `message` (string): An error message if the operation fails.
 * 
 * @throws {Error} Will throw an error if the search operation fails.
 */
export async function searchUserByEmail(userId, email) {
  try {
    const snapshot = await usersCollection.where('email', '==', email).get(); // get the document by email 
    if (snapshot.empty) { // if no user found with the email is found
      return { 'success': false, 'message': 'No users found with that email.' };
    }

    // Get the user's document to retrieve the blockedUser array
    const userDoc = await usersCollection.doc(userId).get();
    const blockedUsers = userDoc.exists ? userDoc.data().blockedUser || [] : []; // get the blockedUser array from the user document or set it to an empty array if it doesn't exist

    // Filter out the user with the provided userId and those in the blockedUser array
    const users = snapshot.docs // get the users from the snapshot
      .filter(doc => doc.id !== userId && !blockedUsers.includes(doc.id)) // filter out the user with the provided userId and those in the blockedUser array
      .map(doc => ({ // map the users to an object
        id: doc.id, // set the id
        ...doc.data() // set the user data
      }));

    return { 'success': true, 'users': users };
  } catch (error) {
    console.error('Error getting user by email: ', error);
    return { 'success': false, 'message': 'Error getting user by email.' };
  }
}

/**
 * Retrieves a user by their ID.
 * 
 * @function selectUserById
 * @description This function fetches the user's document by their ID from the users collection. 
 * It returns an object containing the user's details if found.
 * 
 * @param {string} id - The ID of the user to retrieve.
 * 
 * @returns {Promise<Object>} A promise that resolves to an object containing:
 * - `success` (boolean): Indicates if the user was successfully retrieved.
 * - `id` (string): The ID of the user.
 * - `name` (string): The name of the user.
 * - `email` (string): The email of the user.
 * - `avatarUrl` (string): The URL of the user's avatar.
 * - `AccountStatus` (string): The account status of the user.
 * - `description` (string): The description of the user.
 * - `vibration` (boolean): The vibration setting of the user.
 * - `sound` (boolean): The sound setting of the user.
 * - `notification` (boolean): The notification setting of the user.
 * - `message` (string): An error message if the operation fails.
 * 
 * @throws {Error} Will throw an error if fetching the user's document fails.
 */


export async function selectUserById(id) { // function to get a user by id
  try { // try to get the user by id
    const snapshot = await usersCollection.doc(id).get(); // get the document by id
    if (!snapshot.exists) {
      return { 'success': false, 'message': 'No such document!' };
    } else {
      return { 'success':true,id:snapshot.id, name:snapshot.data().name, email:snapshot.data().email, avatarUrl:snapshot.data().avatarUrl, AccountStatus:snapshot.data().AccountStatus,email:snapshot.data().email,description:snapshot.data().description,vibration:snapshot.data().vibration,sound:snapshot.data().sound,notification:snapshot.data().notification};
    }
  } catch (error) {
    console.error('Error getting user by id: ', error);
  }
}

/**
 * Creates a new user with the provided name, email, code, and account status.
 * 
 * @function userNameEmailStep
 * @description This function creates a new user object with the provided parameters and adds it to the users collection in the database. 
 * It initializes various user properties such as name, email, code, timestamps, and settings.
 * 
 * @param {string} name - The name of the user.
 * @param {string} email - The email of the user.
 * @param {string} code - The code associated with the user.
 * @param {Date} code_timestamp - The timestamp of the code.
 * @param {string} AccountStatus - The account status of the user.
 * 
 * @returns {Promise<Object>} A promise that resolves to an object containing:
 * - `id` (string|null): The ID of the newly created user if successful, otherwise null.
 * - `success` (boolean): Indicates if the user was successfully created.
 * 
 * @throws {Error} Will throw an error if adding the user fails.
 */
export async function userNameEmailStep(name, email, code, code_timestamp, AccountStatus) { // function to create a new user
  const user = {
    name, // set the name
    email, // set the email
    code, // set the code
    code_timestamp, // set the code_timestamp
    AccountStatus, // set the AccountStatus
    logginAttempt: 0, // set the logginAttempt
    logginAttempt_timestamp: Date.now(), // set the logginAttempt_timestamp
    description: "", // set the description
    vibration: true,// set the vibration
    sound: true, // set the sound
    notification: true, // set the notification
    contacts: [], // set the contacts 
    blocked: [], // Add blocked field
    blockedUser: [] // Add blockedUser field
  };
  
  try {
    const docRef = await usersCollection.add(user); // add the new user to the users collection
    return { 'id': docRef.id, 'success': true }; // return the id and success as true
  } catch (error) { // catch any errors
    console.error('Error adding user: ', error); // log the error
    return { 'id': null, 'success': false }; // return the id as null and success as false
  }
}

/**
 * Updates the toggle settings (sound, notification, vibration) for a user.
 * 
 * @function updateToggles
 * @description This function updates the user's document with the new toggle settings for sound, notification, and vibration.
 * 
 * @param {string} id - The ID of the user whose toggle settings are to be updated.
 * @param {boolean} sound - The new sound setting for the user.
 * @param {boolean} notification - The new notification setting for the user.
 * @param {boolean} vibration - The new vibration setting for the user.
 * 
 * @returns {Promise<Object>} A promise that resolves to an object containing:
 * - `success` (boolean): Indicates if the toggles were successfully updated.
 * 
 * @throws {Error} Will throw an error if updating the user's document fails.
 */
export async function updateToggles(id,sound,notification,vibration){
  try {
    await usersCollection.doc(id).update({ // update the user document with the new toggles
      sound: sound, // set the sound
      notification: notification, // set the notification
      vibration: vibration // set the vibration
    });
    return {'success':true} // return success as true
  } catch (error) { // catch any errors
    console.error('Error updating toggles: ', error); // log the error
    return {'success':false} // return success as false
  }
}

/**
 * Updates the profile picture for a user.
 * 
 * @function updateUserProfilePicture
 * @description This function updates the user's document with the new profile picture URL.
 * 
 * @param {string} id - The ID of the user whose profile picture is to be updated.
 * @param {string} avatarUrl - The new URL of the user's profile picture.
 * 
 * @returns {Promise<Object>} A promise that resolves to an object containing:
 * - `success` (boolean): Indicates if the profile picture was successfully updated.
 * 
 * @throws {Error} Will throw an error if updating the user's document fails.
 */

export async function updateUserProfilePicture(id,avatarUrl){
  try { // try to update the profile picture
    await usersCollection.doc(id).update({ // update the user document with the new profile picture
      avatarUrl: avatarUrl // set the avatarUrl
    });
    return {'success':true} // return success as true
  } catch (error) {// catch any errors
    console.error('Error updating profile picture: ', error);
    return {'success':false} // return success as false
  }
}

/**
 * Updates the code and code timestamp for a user.
 * 
 * @function updateCode
 * @description This function updates the user's document with the new code and code timestamp.
 * 
 * @param {string} id - The ID of the user whose code is to be updated.
 * @param {string} code - The new code for the user.
 * @param {Date} code_timestamp - The new timestamp for the code.
 * 
 * @returns {Promise<Object>} A promise that resolves to an object containing:
 * - `success` (boolean): Indicates if the code was successfully updated.
 * 
 * @throws {Error} Will throw an error if updating the user's document fails.
 */
export async function updateCode(id,code,code_timestamp){
  try {
    await usersCollection.doc(id).update({ // update the user document with the new code
      code: code,
      code_timestamp: code_timestamp
    });
    return {'success':true} // return success as true
  } catch (error) {
    console.error('Error updating code: ', error);
  }
}

/**
 * Retrieves the code and code timestamp for a user by their ID.
 * 
 * @function getCodeById
 * @description This function fetches the user's document by their ID and retrieves the code and code timestamp.
 * 
 * @param {string} id - The ID of the user whose code is to be retrieved.
 * 
 * @returns {Promise<Object>} A promise that resolves to an object containing:
 * - `code` (string): The code of the user.
 * - `code_timestamp` (Date): The timestamp of the code.
 * 
 * @throws {Error} Will throw an error if fetching the user's document fails.
 */
export async function getCodeById(id){
  try {
    const snapshot = await usersCollection.doc(id).get(); // get the document by id
    if (!snapshot.exists) { //  if no user found with the id is found
      console.log('No such document!'); // log the error
    } else {
      return {code:snapshot.data().code,code_timestamp:snapshot.data().code_timestamp} // return the code and code_timestamp
    }
  } catch (error) {
    console.error('Error getting code: ', error); // log the error
  }

}

/**
 * Updates the password for a user.
 * 
 * @function setPassword
 * @description This function updates the user's document with the new password.
 * 
 * @param {string} id - The ID of the user whose password is to be updated.
 * @param {string} password - The new password for the user.
 * 
 * @returns {Promise<Object>} A promise that resolves to an object containing:
 * - `success` (boolean): Indicates if the password was successfully updated.
 * 
 * @throws {Error} Will throw an error if updating the user's document fails.
 */
export async function setPassword(id, password)  { // function to update the password
  try { // try to update the password
    await usersCollection.doc(id).update({ // update the user document with the new password
      password: password 
    });

    return {'success':true} // return success as true
  } catch (error) { // catch any errors
    console.error('Error updating password: ', error); // 
    return {'success':false} // return success as false
  }
};

/**
 * Retrieves all users from the users collection.
 * 
 * @function selectAllUsers
 * @description This function fetches all user documents from the users collection and returns an array of user data.
 * 
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of user objects.
 * 
 * @throws {Error} Will throw an error if fetching the users fails.
 */
export  async function selectAllUsers() { // function to get all users
  try { // try to get all users
    const snapshot = await usersCollection.get();
    const users = snapshot.docs.map(doc => doc.data()); // get the users from the snapshot
    return users; // return the users
  } catch (error) {
    console.error('Error getting users: ', error);
  }
}

/**
 * Updates the account status for a user.
 * 
 * @function setAccountStatus
 * @description This function updates the user's document with the new account status.
 * 
 * @param {string} id - The ID of the user whose account status is to be updated.
 * @param {string} status - The new account status for the user.
 * 
 * @returns {Promise<Object>} A promise that resolves to an object containing:
 * - `success` (boolean): Indicates if the account status was successfully updated.
 * 
 * @throws {Error} Will throw an error if updating the user's document fails.
 */
export async function setAccountStatus(id,status){ // function to update the account status
  try {
    await usersCollection.doc(id).update({ // update the user document with the new account status
      AccountStatus: status
    });
    return {'success':true} // return success as true
  } catch (error) { // catch any errors
    console.error('Error updating account status: ', error);
    return {'success':false} // return success as false
  }
}
/**
 * Clears the users table by deleting all user documents.
 * 
 * @function clearUsersTable
 * @description This function deletes all documents in the users collection.
 * 
 * @returns {Promise<void>} A promise that resolves when the users table is cleared.
 * 
 * @throws {Error} Will throw an error if clearing the users table fails.
 */

export async function clearUsersTable(){
  try {
    const snapshot = await usersCollection.get(); // get the users collection
    snapshot.forEach((doc) => {
      doc.ref.delete(); // delete each document in the collection
    });
   
  } catch (error) {
    console.error('Error clearing users table: ', error);
  }
}

/**
 * Updates the name for a user.
 * 
 * @function updateName
 * @description This function updates the user's document with the new name.
 * 
 * @param {string} id - The ID of the user whose name is to be updated.
 * @param {string} name - The new name for the user.
 * 
 * @returns {Promise<Object>} A promise that resolves to an object containing:
 * - `success` (boolean): Indicates if the name was successfully updated.
 * 
 * @throws {Error} Will throw an error if updating the user's document fails.
 */
export async function updateName(id, name) {  // function to update the name
  try {
    await usersCollection.doc(id).update({
      name: name
    });
    return {'success':true} // return success as true
  } catch (error) {
    console.error('Error updating name: ', error); // log the error
    return {'success':false}
  }
}

/**
 * Blocks a user by adding the blockedUserId to the user's blocked array and vice versa.
 * 
 * @function blockUser
 * @description This function fetches the user's document by userId, retrieves the current blocked array, 
 * and adds the blockedUserId to the array if it doesn't already exist. It then updates the user's document with the new blocked array.
 * Additionally, it updates the blockedUser's document by adding the userId to their blockedUser array.
 * 
 * @param {string} userId - The ID of the user who is blocking another user.
 * @param {string} blockedUserId - The ID of the user to be blocked.
 * 
 * @returns {Promise<Object>} A promise that resolves to an object containing:
 * - `success` (boolean): Indicates if the user was successfully blocked.
 * - `message` (string): A message indicating the result of the operation.
 * 
 * @throws {Error} Will throw an error if fetching or updating the user's document fails.
 */
export async function blockUser(userId, blockedUserId) { // function to block a user
  try {
    // Fetch the user's document
    const userDoc = await usersCollection.doc(userId).get(); // get the user document by userId
    if (!userDoc.exists) { // if user not found return an error
      return { success: false, message: 'User not found' }; 
    }

    // Get the current blocked array
    const userData = userDoc.data(); // get the user data from the user document
    let blocked = userData.blocked || []; // get the blocked array from the user data or set it to an empty array if it doesn't exist

    // Add the blockedUserId if it doesn't already exist in the array
    if (!blocked.includes(blockedUserId)) {
      blocked.push(blockedUserId); // 
    }

    // Update the user's document with the new blocked array
    await usersCollection.doc(userId).update({ blocked });

    // Also update the blockedUser's document
    const blockedUserDoc = await usersCollection.doc(blockedUserId).get();
    if (!blockedUserDoc.exists) {
      return { success: false, message: 'Blocked user not found' }; // if blocked user not found return an error
    }

    const blockedUserData = blockedUserDoc.data();
    let blockedBy = blockedUserData.blockedUser || []; // get the blockedUser array from the blocked user data or set it to an empty array if it doesn't exist

    if (!blockedBy.includes(userId)) { // if the userId is not already in the blockedBy array
      blockedBy.push(userId); // add the userId to the blockedBy array if it doesn't already exist
    }

    await usersCollection.doc(blockedUserId).update({ blockedUser: blockedBy }); // update the blocked user document with the new blockedBy array

    return { success: true };
  } catch (error) {
    console.error('Error blocking user: ', error);
    return { success: false, error };
  }
}

/**
 * Unblocks a user by removing the blockedUserId from the user's blocked array and vice versa.
 * 
 * @function unblockUser
 * @description This function fetches the user's document by userId, retrieves the current blocked array, 
 * and removes the blockedUserId from the array if it exists. It then updates the user's document with the new blocked array.
 * Additionally, it updates the blockedUser's document by removing the userId from their blockedUser array.
 * 
 * @param {string} userId - The ID of the user who is unblocking another user.
 * @param {string} blockedUserId - The ID of the user to be unblocked.
 * 
 * @returns {Promise<Object>} A promise that resolves to an object containing:
 * - `success` (boolean): Indicates if the user was successfully unblocked.
 * - `message` (string): A message indicating the result of the operation.
 * 
 * @throws {Error} Will throw an error if fetching or updating the user's document fails.
 */

// Function to unblock a user
export async function unblockUser(userId, blockedUserId) { // function to unblock a user
  try { // try to unblock the user
    
    const userDoc = await usersCollection.doc(userId).get(); // get the user document by userId
    if (!userDoc.exists) { // if user not found return an error
      return { success: false, message: 'User not found' };
    }

    // Get the current blocked array
    const userData = userDoc.data();
    let blocked = userData.blocked || [];

    // Remove the blockedUserId if it exists in the array
    blocked = blocked.filter(id => id !== blockedUserId); 

    // Update the user's document with the new blocked array
    await usersCollection.doc(userId).update({ blocked });

    // Also update the blockedUser's document
    const blockedUserDoc = await usersCollection.doc(blockedUserId).get();
    if (!blockedUserDoc.exists) {
      return { success: false, message: 'Blocked user not found' };
    }

    const blockedUserData = blockedUserDoc.data();
    let blockedBy = blockedUserData.blockedUser || []; // get the blockedUser array from the blocked user data or set it to an empty array if it doesn't exist

    blockedBy = blockedBy.filter(id => id !== userId);

    await usersCollection.doc(blockedUserId).update({ blockedUser: blockedBy }); // update the blocked user document with the new blockedBy array

    return { success: true };
  } catch (error) { // catch any errors
    console.error('Error unblocking user: ', error);
    return { success: false, error }; // return success as false
  }
}

/**
 * @function updateDescription
 * @description This function updates the user's document with the new description.
 * 
 * @param {string} id - The ID of the user whose description is to be updated.
 * @param {string} description - The new description for the user.
 * 
 * @returns {Promise<Object>} A promise that resolves to an object containing:
 * - `success` (boolean): Indicates if the description was successfully updated.
 * 
 * @throws {Error} Will throw an error if updating the user's document fails.
 */
export async function updateDescription(id, description) {
  try {
    await usersCollection.doc(id).update({ // update the user document with the new description
      description: description
    });
    return {'success':true}
  } catch (error) {
    console.error('Error updating description: ', error);
    return {'success':false} // return success as false if there is an error
  }
}
export async function addMessage(senderId, receiverId, message, imageLink){
  // create a message object 
  const newMessage = {
    senderId,
    receiverId,
    message,
    imageLink,
    time: firebase.firestore.FieldValue.serverTimestamp()
  };
  try {
    const docRef = await messagesCollection.add(newMessage);
    
  } catch (error) {
    console.error('Error adding message: ', error);
  }
}

/**
 * 
 * @function addMessage
 * @description This function creates a new message object and adds it to the messages collection.
 * 
 * @param {string} senderId - The ID of the user sending the message.
 * @param {string} receiverId - The ID of the user receiving the message.
 * @param {string} message - The content of the message.
 * @param {string} imageLink - The URL of the image associated with the message.
 * 
 * @returns {Promise<void>} A promise that resolves when the message is added.
 * 
 * @throws {Error} Will throw an error if adding the message fails.
 */
export async function signIn(email, password){
 
  try{
  
      const snapshot = await usersCollection.where('email', '==', email).get();
           
      if (snapshot.empty) { // if no user found with the email is found
      
        return {'success':false,'id':null}
      } if(!snapshot.empty && snapshot.docs[0].data().password != password){ // if user found with the email but password is incorrect
       
        if(snapshot.docs[0].data().AccountStatus === "blocked" ){
        
          // if account was bloked more than 5 min ago set AccountStatus to active
          if((Date.now()-snapshot.docs[0].data().logginAttempt_timestamp)>300000){
           
            await usersCollection.doc(snapshot.docs[0].id).update({
              logginAttempt:0,
              logginAttempt_timestamp:Date.now(),
              AccountStatus:'active'
            });
          }
          
          return {'success':false,'id':null,'AccountStatus':snapshot.docs[0].data().AccountStatus, 'logginAttempt_timestamp':snapshot.docs[0].data().logginAttempt_timestamp}
        }
         if(snapshot.docs[0].data().logginAttempt==0){ // if user has not attempted to login before first attemp and timestamp are updated
          // set count to 1 and attempt_timestamp to current time
          
          await usersCollection.doc(snapshot.docs[0].id).update({
            logginAttempt:1,
            logginAttempt_timestamp:Date.now()
          });
          return {'success':false,'id':null,'AccountStatus':snapshot.docs[0].data().AccountStatus}
        } if((Date.now()-snapshot.docs[0].data().logginAttempt_timestamp)<180000 && snapshot.docs[0].data().logginAttempt < 3){
            // if last attemp was less than 3 min ago increment the count
              await usersCollection.doc(snapshot.docs[0].id).update({
              logginAttempt:snapshot.docs[0].data().logginAttempt+1,
             
            });
            return {'success':false,'id':null,'AccountStatus':snapshot.docs[0].data().AccountStatus}
          } if(snapshot.docs[0].data().logginAttempt>0 && (Date.now()-snapshot.docs[0].data().logginAttempt_timestamp)>180000){ // if user has attempted to login before
            //at least 1 atempt and last attempt was more than 3 min ago set count to 0 and attempt_timestamp to current time
            await usersCollection.doc(snapshot.docs[0].id).update({
                logginAttempt:0,
                logginAttempt_timestamp:Date.now()
              });
              
              return {'success':false,'id':null,'AccountStatus':snapshot.docs[0].data().AccountStatus}
          } if((Date.now()-snapshot.docs[0].data().logginAttempt_timestamp)<180000 && snapshot.docs[0].data().logginAttempt>=3){
             // if last attemp was less than 3 min ago and count is 3 or more set AccountStatus to blocked
            await usersCollection.doc(snapshot.docs[0].id).update({
              logginAttempt:0,
              logginAttempt_timestamp:Date.now(),
              AccountStatus:'blocked'
            });
          

          return {'success':false,'id':null,'AccountStatus':snapshot.docs[0].data().AccountStatus}
         } 

         return {'success':false,'id':null,'AccountStatus':snapshot.docs[0].data().AccountStatus}
    }else{ // if user found with the email and password
       // set attpemt to 0 and attempt_timestamp to current time and set AccountStatus to active
      await usersCollection.doc(snapshot.docs[0].id).update({
        logginAttempt:0,
        logginAttempt_timestamp:Date.now(),
        AccountStatus:'active'
      });  
      return {'success':true,'id':snapshot.docs[0].id,'AccountStatus':snapshot.docs[0].data().AccountStatus}
  
    }
        
  }catch(error){
    console.error('Error signing in: ', error);
  }
}

/**
 * @async
 * @function addChatsFieldToUsers
 * @description This function checks each user document in the users collection and adds a 'chats' field if it doesn't already exist.
 * @returns {Promise<void>} A promise that resolves when the operation is complete.
 * @throws Will throw an error if there is an issue with the database operation.
 */
export async function addChatsFieldToUsers() { 
  try {
    const snapshot = await usersCollection.get();
    const batch = db.batch(); // Use batch to perform multiple writes as a single atomic operation

    snapshot.forEach(doc => {
      const userData = doc.data();
      if (!userData.hasOwnProperty('chats')) {
        batch.update(usersCollection.doc(doc.id), { chats: [] });
      }
    });

    await batch.commit();
   
  } catch (error) {
    console.error('Error adding chats field to users: ', error);
  }
}

// function to save message  to the database saveMessage(delivered, read, message, sender, receiver, imageLink, msgTimestamp);


/**
 * 
 * @async
 * @function saveMessage
 * @description This function saves a message to the messages collection and updates the relevant chat and user documents.
 * @param {boolean} delivered - Indicates if the message was delivered.
 * @param {boolean} read - Indicates if the message was read.
 * @param {string} message - The content of the message.
 * @param {string} sender - The ID of the sender.
 * @param {string} receiver - The ID of the receiver.
 * @param {string} imageLink - A link to an image associated with the message.
 * @param {number} msgTimestamp - The timestamp of the message.
 * @returns {Promise<Object>} A promise that resolves to an object containing the success status and the message ID if successful.
 * @throws Will throw an error if there is an issue with the database operation.
 */
export async function saveMessage(delivered, read, message, sender, receiver, imageLink, msgTimestamp) {
  const newMessage = {
    delivered,
    read,
    message,
    sender,
    receiver,
    imageLink,
    msgTimestamp
  };

  try {
    // Check if a chat exists between the sender and receiver
    let chatId;
    const chatSnapshot = await chatsCollection
      .where('participants', 'array-contains', sender)
      .get();

    chatSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.participants.includes(receiver)) {
        chatId = doc.id;
      }
    });

    // If no chat exists, create a new chat
    if (!chatId) {
      
      const newChat = {
        participants: [sender, receiver],
        messages: [],
        lastMessage: message,
        lastMessageTimestamp: msgTimestamp
      };
      const chatDocRef = await chatsCollection.add(newChat);
      chatId = chatDocRef.id;
     

      // Add the new chat ID to both users' chats array using the workaround
      const senderDoc = await usersCollection.doc(sender).get();
      const senderData = senderDoc.data();
      const updatedSenderChats = senderData.chats || [];
      updatedSenderChats.push(chatId);
      await usersCollection.doc(sender).update({ chats: updatedSenderChats });

      const receiverDoc = await usersCollection.doc(receiver).get();
      const receiverData = receiverDoc.data();
      const updatedReceiverChats = receiverData.chats || [];
      updatedReceiverChats.push(chatId);
      await usersCollection.doc(receiver).update({ chats: updatedReceiverChats });

      
    } else {
      // Update the last message and timestamp in the existing chat
      await chatsCollection.doc(chatId).update({
        lastMessage: message,
        lastMessageTimestamp: msgTimestamp
      });
      
    }

    // Save the message in the messages collection
    const docRef = await messagesCollection.add(newMessage);
    

    // Workaround to add the message ID to the chat document
    const chatDoc = await chatsCollection.doc(chatId).get();
    const chatData = chatDoc.data();
    const updatedMessages = chatData.messages || [];
    updatedMessages.push(docRef.id);

    await chatsCollection.doc(chatId).update({
      messages: updatedMessages
    });
    

    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error adding message: ', error);
    return { success: false, error };
  }
}

/**
 * Marks a message as delivered in the messages collection.
 * 
 * @async
 * @function markMessageDelivered
 * @description This function updates the 'delivered' field of a message document in the messages collection to true.
 * @param {string} messageId - The ID of the message to mark as delivered.
 * @returns {Promise<Object>} A promise that resolves to an object containing the success status.
 * @throws Will throw an error if there is an issue with the database operation.
 */
export async function markMessageDelivered(messageId) {
  try {
    await messagesCollection.doc(messageId).update({ delivered: true });
    return { success: true };
  } catch (error) {
    console.error('Error marking message as delivered: ', error);
    return { success: false, error };
  }
}
/**
 * Retrieves messages between two users.
 * 
 * @async
 * @function getMessagesBetweenUsers
 * @description This function retrieves messages from the messages collection between two users.
 * @param {string} userId1 - The ID of the first user.
 * @param {string} userId2 - The ID of the second user.
 * @param {number} [limit=20] - The maximum number of messages to retrieve.
 * @param {number} [lastMessageTimestamp=null] - The timestamp of the last message to start after.
 * @returns {Promise<Object>} A promise that resolves to an object containing the success status and an array of messages.
 * @throws Will throw an error if there is an issue with the database operation.
 */
export async function getMessagesBetweenUsers(userId1, userId2, limit = 20, lastMessageTimestamp = null) {
  try {
    let query = messagesCollection
      .where('sender', 'in', [userId1, userId2])
      .where('receiver', 'in', [userId1, userId2])
      .orderBy('msgTimestamp', 'desc')
      .limit(limit);

    if (lastMessageTimestamp) {
      query = query.startAfter(lastMessageTimestamp);
    }

    const snapshot = await query.get();
    const messages = snapshot.docs.map(doc => doc.data());
   

    return { success: true, messages };
  } catch (error) {
    console.error('Error retrieving messages: ', error);
    return { success: false, error };
  }
}
/**
 * Retrieves chats by user ID.
 * 
 * @async
 * @function getChatsByUserId
 * @description This function retrieves chats from the chats collection by user ID.
 * @param {string} userId - The ID of the user whose chats are to be retrieved.
 * @returns {Promise<Object>} A promise that resolves to an object containing the success status and an array of chats.
 * @throws Will throw an error if there is an issue with the database operation.
 */
export async function getChatsByUserId(userId) {
  try {
    // Fetch the user's document to get blocked and blockedUser arrays
    const userDoc = await usersCollection.doc(userId).get();
    if (!userDoc.exists) {
      return { success: false, message: 'User not found' };
    }

    const userData = userDoc.data();
    const blocked = userData.blocked || [];
    const blockedUser = userData.blockedUser || [];

    const userChats = userData.chats || [];
    const chats = [];

    for (const chatId of userChats) {
      const chatDoc = await chatsCollection.doc(chatId).get();
      if (chatDoc.exists) {
        const chatData = chatDoc.data();
        const otherUserId = chatData.participants.find(id => id !== userId);
        
        // Skip chat if the other user is in the blockedUser array
        if (blockedUser.includes(otherUserId)) {
          continue;
        }

        const otherUserDoc = await usersCollection.doc(otherUserId).get();
        if (otherUserDoc.exists) {
          const otherUserData = otherUserDoc.data();
          const isFriend = userData.contacts.includes(otherUserId);
          const isBlocked = blocked.includes(otherUserId);

          chats.push({
            id: chatDoc.id,
            ...chatData,
            otherUser: {
              id: otherUserId,
              name: otherUserData.name,
              email: otherUserData.email,
              avatarUrl: otherUserData.avatarUrl,
              email_registered: true,
              isFriend: isFriend,
              blocked: isBlocked
            }
          });
        }
      }
    }

    return { success: true, chats: chats };
  } catch (error) {
    console.error('Error getting chats by user ID: ', error);
    return { success: false, message: 'Error getting chats by user ID' };
  }
}

/**
 * Retrieves messages by chat ID.
 * 
 * @async
 * @function getMessagesByChatId
 * @description This function retrieves messages from the messages collection by chat ID.
 * @param {string} chatId - The ID of the chat to retrieve messages from.
 * @param {number} [limit=20] - The maximum number of messages to retrieve.
 * @param {number} [lastMessageTimestamp=null] - The timestamp of the last message to start after.
 * @returns {Promise<Object>} A promise that resolves to an object containing the success status and an array of messages.
 * @throws Will throw an error if there is an issue with the database operation.
 */
export async function getMessagesByChatId(chatId, limit = 20, lastMessageTimestamp = null) {
  try {
    const chatDoc = await chatsCollection.doc(chatId).get();
    if (!chatDoc.exists) {
      return { success: false, message: 'Chat not found' };
    }

    const chatData = chatDoc.data();
    const messageIds = chatData.messages || [];
    const messages = [];

    for (const messageId of messageIds) {
      const messageDoc = await messagesCollection.doc(messageId).get();
      if (messageDoc.exists) {
        messages.push({ id: messageDoc.id, ...messageDoc.data() });
      }
    }

    return { success: true, messages };
  } catch (error) {
    console.error('Error getting messages by chat ID: ', error);
    return { success: false, message: 'Error getting messages by chat ID' };
  }
}

/**
 * 
 * @async
 * 
 * @function updateExistingUsers
 * @description This function fetches all user documents from the users collection and updates them with default values for the description, vibration, sound, and notification fields.
 * @returns {Promise<void>} A promise that resolves when the operation is complete.
 * @throws Will throw an error if there is an issue with the database operation.
 */
export async function updateExistingUsers() {
  try {
    const snapshot = await usersCollection.get();
    const batch = db.batch(); // Use batch to perform multiple writes as a single atomic operation

    snapshot.forEach(doc => {
      const userRef = usersCollection.doc(doc.id);
      batch.update(userRef, {
        description: "", // Default value for description
        vibration: true, // Default value for vibration
        sound: true, // Default value for sound
        notification: true // Default value for notification
      });
    });

    await batch.commit();
   
  } catch (error) {
    console.error('Error updating existing users: ', error);
  }
}