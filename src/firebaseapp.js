// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";

import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: import.meta.env.API_KEY,
    authDomain: "saef-task-69b70.firebaseapp.com",
    projectId: "saef-task-69b70",
    storageBucket: "saef-task-69b70.firebasestorage.app",
    messagingSenderId: "742689429459",
    appId: "1:742689429459:web:8d874b18fc8ba70c3a4126"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);