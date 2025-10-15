import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";

export function initAuth(app) {
  return getAuth(app);
}

export async function register(auth, email, password) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    alert(`Admin created: ${userCredential.user.email}`);
  } catch (error) {
    if (error.code === "auth/email-already-in-use") {
      alert("This email is already registered. Please use Login instead.");
    } else if (error.code === "auth/invalid-email") {
      alert("Invalid email format."); 
    } else if (error.code === "auth/weak-password") {
      alert("Password too weak. Use at least 6 characters.");
    } else {
      alert(`ERROR(${error.code}):${error.message}`);
    }
  }
  return userCredential;
}

export async function login(auth, email, password) {
  try {
    await signInWithEmailAndPassword(auth, email, password);
    alert("Logged in successfully!");
  } catch (error) {
    alert(`ERROR(${error.code}):${error.message}`);
  }
}

export async function logout(auth) {
  return await signOut(auth);
}
