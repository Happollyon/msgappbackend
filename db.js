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
    if (snapshot.empty) {

      return false;
    }  
    return true;
  } catch (error) {
   
  }

}
export async function userNameEmailStep(name,email,code,code_timestamp){
  const user = {
    name,
    email,
    code,
    code_timestamp
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
    return JSON.stringify(users);
  } catch (error) {
    console.error('Error getting users: ', error);
  }
}