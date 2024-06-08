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
    return JSON.stringify({'id':docRef.id,'success':true});
  } catch (error) {
    console.error('Error adding user: ', error);
    return JSON.stringify({'success':true});
  }

}

export  async function selectAllUsers() {
  try {
    const snapshot = await usersCollection.get();
    const users = snapshot.docs.map(doc => doc.data());
    return JSON.stringify(users);
  } catch (error) {
    console.error('Error getting users: ', error);
  }
}