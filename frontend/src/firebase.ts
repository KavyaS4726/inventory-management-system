import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDnWlsbZun6n3bInQyI5gEnu28mkD0pX-o",
  authDomain: "inventory-management-sys-d35cf.firebaseapp.com",
  projectId: "inventory-management-sys-d35cf",
  storageBucket: "inventory-management-sys-d35cf.firebasestorage.app",
  messagingSenderId: "737910555181",
  appId: "1:737910555181:web:a7a1b664f3f8461c6f6ea4",
  measurementId: "G-2SKV29Z618",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

export const googleProvider = new GoogleAuthProvider();