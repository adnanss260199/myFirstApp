import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// Data ini diambil langsung dari Firebase Console kamu
const firebaseConfig = {
  apiKey: "AIzaSyABn-AU-1sd9o3cIuNNbtIJo0xHhW9mPfY",
  authDomain: "mychatapp-e2057.firebaseapp.com",
  databaseURL: "https://mychatapp-e2057-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "mychatapp-e2057",
  storageBucket: "mychatapp-e2057.firebasestorage.app",
  messagingSenderId: "648731895176",
  appId: "1:648731895176:web:9593316426530064b8063d",
  measurementId: "G-24H0PHG0HE"
};

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);

// Ekspor database agar bisa dipakai di chat.tsx
export const database = getDatabase(app);