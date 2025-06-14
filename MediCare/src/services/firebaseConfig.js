import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage'; // Importação do Storage

const firebaseConfig = {
  apiKey: "AIzaSyDJfA41-V2n4141ysIsUX9bfrU0STBrm3E",
  authDomain: "medicare-a8f03.firebaseapp.com",
  projectId: "medicare-a8f03",
  storageBucket: "medicare-a8f03.appspot.com",
  messagingSenderId: "986711537075",
  appId: "1:986711537075:web:2992fedcded9a21b71c7c6"
};

export const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

export const db = getFirestore(app);

export const storage = getStorage(app);
