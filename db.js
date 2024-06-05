import db from "./firebase.js";

const usersCollection = db.collection('users');

export  async  function createUser(name, email, password, avatarUrl) {
  const newUser = {
    name,
    email,
    password,
    avatarUrl
  };
  
  try {
    const docRef = await usersCollection.add(newUser);
    console.log(`User created with ID: ${docRef.id}`);
  } catch (error) {
    console.error('Error adding user: ', error);
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