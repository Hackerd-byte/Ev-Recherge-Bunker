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
  return await createUserWithEmailAndPassword(auth, email, password);
}

export async function login(auth, email, password) {
  return await signInWithEmailAndPassword(auth, email, password);
}

export async function logout(auth) {
  return await signOut(auth);
}
