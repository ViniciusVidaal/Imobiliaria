import { getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDEZvX8PtJkHK5o--xzVc6BOgyzriaXais",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "imobiliaria-template.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "imobiliaria-template",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "imobiliaria-template.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "569527791464",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:569527791464:web:a30dcb395ed8e83cbbf0dd",
};
const app=getApps().length?getApps()[0]:initializeApp(firebaseConfig);
export const auth=getAuth(app); export const db=getFirestore(app); export const storage=getStorage(app);
