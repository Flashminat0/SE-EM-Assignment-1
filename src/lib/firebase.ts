import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
// @ts-expect-error React Native-only export
import { connectAuthEmulator, getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { connectFirestoreEmulator, initializeFirestore } from 'firebase/firestore';

export const usingEmulators = process.env.EXPO_PUBLIC_USE_EMULATORS === '1';
export const emulatorHost = process.env.EXPO_PUBLIC_EMULATOR_HOST || '127.0.0.1';
const host = emulatorHost;

const config = usingEmulators
  ? { apiKey: 'demo-key', projectId: 'demo-edu-alarm', authDomain: 'demo-edu-alarm.firebaseapp.com', appId: 'demo' }
  : {
      apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
      messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
    };

const fresh = getApps().length === 0;
export const app = fresh ? initializeApp(config) : getApp();
export const auth = initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
export const firestore = initializeFirestore(app, { experimentalForceLongPolling: true });

if (usingEmulators && fresh) {
  connectAuthEmulator(auth, `http://${host}:9099`, { disableWarnings: true });
  connectFirestoreEmulator(firestore, host, 8080);
}
