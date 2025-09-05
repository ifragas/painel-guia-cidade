// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage'; // Importe o Storage

const firebaseConfig = {
  apiKey: "AIzaSyCcwZSN3U1tF1yAjeZy3ECGrV_BoFBV8mc",
  authDomain: "turismo-app-fa581.firebaseapp.com",
  projectId: "turismo-app-fa581",
  storageBucket: "turismo-app-fa581.firebasestorage.app",
  messagingSenderId: "117862345287",
  appId: "1:117862345287:web:b6111e17ff92cbdc199f62"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const storage = getStorage(app); // Inicializa o Storage

export { auth, storage };