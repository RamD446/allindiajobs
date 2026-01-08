// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAHCVTzpNO2J93nrE713Rw10Rb5bQpq4oY",
  authDomain: "allindiajobs-36405.firebaseapp.com",
  databaseURL: "https://allindiajobs-36405-default-rtdb.firebaseio.com",
  projectId: "allindiajobs-36405",
  storageBucket: "allindiajobs-36405.firebasestorage.app",
  messagingSenderId: "615657521468",
  appId: "1:615657521468:web:4f47813eefe22b810c5e39",
  measurementId: "G-T0V4G0SDVE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getDatabase(app);

export { app, analytics, auth, db };