import { updatePassword } from "firebase/auth";
import db from "./firebase.js";
import firebase from "firebase/compat/app";
const usersCollection = db.collection('users');

// user table should have naem, email, password, avatarUrl, code ,code_timestamp, active
// how should the user table look like?
// {

export  async  function createUser(name, email, password, avatarUrl, code, code_timestamp, active,logginAttempt,logginAttempt_timestamp) {
  const newUser = {
    name,
    email,
    password,
    avatarUrl,
    code,
    code_timestamp,
    active,
    logginAttempt,
    logginAttempt_timestamp
  };
  
  try {
    const docRef = await usersCollection.add(newUser);
    console.log(`User created with ID: ${docRef.id}`);
  } catch (error) {
    console.error('Error adding user: ', error);
  }
}

export async function isEmailAlreadyRegistered(email){
  try {
    const snapshot = await usersCollection.where('email', '==', email).get();
    console.log(snapshot);
    if (snapshot.empty) {
      console.log('No matching documents.');
      return {'email_registered':false, 'id':null, 'AccountStatus':"pending"};
    } 
    // return user data if email is already registered


    return {'email_registered':true, 'id':snapshot.docs[0].id, 'AccountStatus':snapshot.docs[0].data().AccountStatus};
  } catch (error) {
    console.error('Error getting user by email: ', error);

  }

}


export async function addContact(userId, contactId) {
  try {
    // Fetch the user's document
    const userDoc = await usersCollection.doc(userId).get();
    
    if (!userDoc.exists) {
      throw new Error('User not found');
    }

    // Get the current contacts array
    const userData = userDoc.data();
    let contacts = userData.contacts || [];

    // Add the contactId if it doesn't already exist in the array
    if (!contacts.includes(contactId)) {
      contacts.push(contactId);
    }

    // Update the user's document with the new contacts array
    await usersCollection.doc(userId).update({ contacts });

    return { 'success': true };
  } catch (error) {
    console.error('Error adding contact: ', error);
    return { 'success': false };
  }
}
// delete contact
export async function deleteContact(userId, contactId) {
  try {
    // Fetch the user's document
    const userDoc = await usersCollection.doc(userId).get();
    
    if (!userDoc.exists) {
      throw new Error('User not found');
    }

    // Get the current contacts array
    const userData = userDoc.data();
    let contacts = userData.contacts || [];

    // Remove the contactId if it exists in the array
    contacts = contacts.filter(contact => contact !== contactId);

    // Update the user's document with the new contacts array
    await usersCollection.doc(userId).update({ contacts });

    return { 'success': true };
  } catch (error) {
    console.error('Error deleting contact: ', error);
    return { 'success': false };
  }
}
export async function getContacts(userId) {
  try {
    // Assuming usersCollection is defined and accessible in this context
    // and each user document has a 'contacts' field which is an array of contact IDs
    
    const userSnapshot = await usersCollection.doc(userId).get();
    if (!userSnapshot.exists) {
      return { "success": false, "message": "No such user!" };
    } else {
      const contactsData = [];
      const contactsIds = userSnapshot.data().contacts; // Assuming this is an array of contact IDs
      
      // Fetch each contact's details
      for (const contactId of contactsIds) {
        const contactSnapshot = await usersCollection.doc(contactId).get();
        if (contactSnapshot.exists) {
          const contactInfo = contactSnapshot.data();
          contactsData.push({
            id: contactId,
            userId: contactInfo.userId, // Assuming there's a userId field in the contact's document
            name: contactInfo.name,
            email: contactInfo.email,
            avatarUrl: contactInfo.avatarUrl
          });
        }
      }
      
      return { "success": true, "contacts": contactsData };
    }
  } catch (error) {
    console.error('Error getting contacts: ', error);
    return { "success": false, "message": "Error getting contacts" };
  }
}
export async function searchUserByEmail(userId, email) {
  try {
    const snapshot = await usersCollection.where('email', '==', email).get();
    if (snapshot.empty) {
      console.log('No matching documents.');
      return { 'success': false, 'message': 'No matching documents.' };
    }

    // Get the user's document to retrieve the contacts
    const userDoc = await usersCollection.doc(userId).get();
    const userContacts = userDoc.exists ? userDoc.data().contacts || [] : [];

    // Filter out the user with the provided userId and format the user data
    const users = snapshot.docs
      .filter(doc => doc.id !== userId)
      .map(doc => {
        const data = doc.data();
        const isFriend = userContacts.includes(doc.id); // Check if the user is in the contact list
        return {
          id: doc.id,
          name: data.name,
          email: data.email,
          AccountStatus: data.AccountStatus,
          email_registered: !!data.email,
          avatarUrl: data.avatarUrl,
          isFriend
        };
      });

    return { 'success': true, 'users': users };
  } catch (error) {
    console.error('Error getting user by email: ', error);
    return { 'success': false, 'message': 'Error getting user by email.' };
  }
}
export async function userNameEmailStep(name,email,code,code_timestamp,AccountStatus){
  const user = {
    name,
    email,
    code,
    code_timestamp,
    AccountStatus,
    logginAttempt:0,
    logginAttempt_timestamp:Date.now()
  };
  try {
    const docRef = await usersCollection.add(user);
    return {'id':docRef.id,'success':true}
  } catch (error) {
    console.error('Error adding user: ', error);
    return {'id':null,'success':false}
  }

}


export async function updateCode(id,code,code_timestamp){
  try {
    await usersCollection.doc(id).update({
      code: code,
      code_timestamp: code_timestamp
    });
    return {'success':true}
  } catch (error) {
    console.error('Error updating code: ', error);
  }
}

export async function getCodeById(id){
  try {
    const snapshot = await usersCollection.doc(id).get(); // get the document by id
    if (!snapshot.exists) {
      console.log('No such document!');
    } else {
      return {code:snapshot.data().code,code_timestamp:snapshot.data().code_timestamp}
    }
  } catch (error) {
    console.error('Error getting code: ', error);
  }

}

export async function setPassword(id, password)  {
  try {
    await usersCollection.doc(id).update({
      password: password
    });

    return {'success':true}
  } catch (error) {
    console.error('Error updating password: ', error);
    return {'success':false}
  }
};

export  async function selectAllUsers() {
  try {
    const snapshot = await usersCollection.get();
    const users = snapshot.docs.map(doc => doc.data());
    return users;
  } catch (error) {
    console.error('Error getting users: ', error);
  }
}
export async function setAccountStatus(id,status){
  try {
    await usersCollection.doc(id).update({
      AccountStatus: status
    });
    return {'success':true}
  } catch (error) {
    console.error('Error updating account status: ', error);
    return {'success':false}
  }
}

//endpoint to clear the user table
export async function clearUsersTable(){
  try {
    const snapshot = await usersCollection.get();
    snapshot.forEach((doc) => {
      doc.ref.delete();
    });
    console.log('Users table cleared');
  } catch (error) {
    console.error('Error clearing users table: ', error);
  }
}

// create a funciton to make usersCollection have same fields

export async function signIn(email, password){
 
  try{
  
      const snapshot = await usersCollection.where('email', '==', email).get();
      console.log("logginAttempt ",snapshot.docs[0].data().logginAttempt, "loginAttempt diff",Date.now()-snapshot.docs[0].data().logginAttempt_timestamp,"and ",(Date.now()-snapshot.docs[0].data().logginAttempt_timestamp)<180000,"and",(snapshot.docs[0].data().logginAttempt < 3)," logginAttempt_timestamp",snapshot.docs[0].data().logginAttempt_timestamp,"current time",Date.now() )
           
      if (snapshot.empty) { // if no user found with the email is found
        console.log(email,password);
        console.log('No matching documents.');
        return {'success':false,'id':null}
      } if(!snapshot.empty && snapshot.docs[0].data().password != password){ // if user found with the email but password is incorrect
        console.log('email matches but password does not match');
        if(snapshot.docs[0].data().AccountStatus === "blocked" ){
          console.log("Account is blocked db.js")
          // if account was bloked more than 5 min ago set AccountStatus to active
          if((Date.now()-snapshot.docs[0].data().logginAttempt_timestamp)>300000){
            console.log("Account is blocked more than 5 min ago db.js")
            await usersCollection.doc(snapshot.docs[0].id).update({
              logginAttempt:0,
              logginAttempt_timestamp:Date.now(),
              AccountStatus:'active'
            });
          }
          console.log(snapshot.docs[0].data().AccountStatus)
          return {'success':false,'id':null,'AccountStatus':snapshot.docs[0].data().AccountStatus, 'logginAttempt_timestamp':snapshot.docs[0].data().logginAttempt_timestamp}
        }
         if(snapshot.docs[0].data().logginAttempt==0){ // if user has not attempted to login before first attemp and timestamp are updated
          // set count to 1 and attempt_timestamp to current time
          console.log("counting == 0 db.js setting count to 1 and timestamp to current time")
          
          await usersCollection.doc(snapshot.docs[0].id).update({
            logginAttempt:1,
            logginAttempt_timestamp:Date.now()
          });
          return {'success':false,'id':null,'AccountStatus':snapshot.docs[0].data().AccountStatus}
        } if((Date.now()-snapshot.docs[0].data().logginAttempt_timestamp)<180000 && snapshot.docs[0].data().logginAttempt < 3){
            // if last attemp was less than 3 min ago increment the count
            console.log("counting < 3 db.js and less than 3 min ago")
            await usersCollection.doc(snapshot.docs[0].id).update({
              logginAttempt:snapshot.docs[0].data().logginAttempt+1,
             
            });
            return {'success':false,'id':null,'AccountStatus':snapshot.docs[0].data().AccountStatus}
          } if(snapshot.docs[0].data().logginAttempt>0 && (Date.now()-snapshot.docs[0].data().logginAttempt_timestamp)>180000){ // if user has attempted to login before
            //at least 1 atempt and last attempt was more than 3 min ago set count to 0 and attempt_timestamp to current time
            console.log("morete than one attempt and last attempt was more than 3 min ago.. resetting count to 0 and timestamp to current time")
            console.log("counting > 0 db.js")
              await usersCollection.doc(snapshot.docs[0].id).update({
                logginAttempt:0,
                logginAttempt_timestamp:Date.now()
              });
              
              return {'success':false,'id':null,'AccountStatus':snapshot.docs[0].data().AccountStatus}
          } if((Date.now()-snapshot.docs[0].data().logginAttempt_timestamp)<180000 && snapshot.docs[0].data().logginAttempt>=3){
            console.log("counting >= 3 db.js and less than 3 min ago.. account blocked")
            // if last attemp was less than 3 min ago and count is 3 or more set AccountStatus to blocked
            await usersCollection.doc(snapshot.docs[0].id).update({
              logginAttempt:0,
              logginAttempt_timestamp:Date.now(),
              AccountStatus:'blocked'
            });
          

          return {'success':false,'id':null,'AccountStatus':snapshot.docs[0].data().AccountStatus}
         } 

         console.log("no if statement")
         return {'success':false,'id':null,'AccountStatus':snapshot.docs[0].data().AccountStatus}
    }else{ // if user found with the email and password
      console.log('User signed in');
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