import { updatePassword } from "firebase/auth";
import db from "./firebase.js";

const usersCollection = db.collection('users');

// user table should have naem, email, password, avatarUrl, code ,code_timestamp, active
// how should the user table look like?
// {

export  async  function createUser(name, email, password, avatarUrl, code, code_timestamp, active) {
  const newUser = {
    name,
    email,
    password,
    avatarUrl,
    code,
    code_timestamp,
    active
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
export async function userNameEmailStep(name,email,code,code_timestamp,AccountStatus){
  const user = {
    name,
    email,
    code,
    code_timestamp,
    AccountStatus
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
export async function signIn(email, password){
 
  try{
    console.log('signing in');  
    console.log(email);
    const snapshot = await usersCollection.where('email', '==', email).get();
    if (snapshot.empty) {
      console.log(email,password);
      console.log('No matching documents.');
      return {'success':false,'id':null}
    } 
    if(snapshot.docs[0].data().password == password){
      console.log('User signed in');
      return {'success':true,'id':snapshot.docs[0].id,'AccountStatus':snapshot.docs[0].data().AccountStatus}
    }
    console.log('No matching documents.2');
    return {'success':false,'id':null}
  }catch(error){
    console.error('Error signing in: ', error);
  }
}