import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { meta, resetAll } from '@/db';
import { LIMITS } from './chat-parse';
import { friendlyError } from './errors';
import * as Notifications from 'expo-notifications';
import { auth, firestore } from './firebase';
import { deleteAllPhotos } from './photo';
import { abortSync } from './sync';

export type Profile = { uid: string; displayName: string; createdAt: number };

export function useUser() {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  useEffect(() => onAuthStateChanged(auth, setUser), []);
  return user;
}

export const signIn = (email: string, password: string) => signInWithEmailAndPassword(auth, email.trim(), password);

const profileRef = (uid: string) => doc(firestore, 'users', uid);
const cache = (p: Profile) => {
  meta.set('profile', JSON.stringify(p));
  return p;
};
export const cachedProfile = (): Profile | null => {
  const s = meta.get('profile');
  return s ? (JSON.parse(s) as Profile) : null;
};
const cleanName = (name: string) => name.trim().slice(0, LIMITS.name).trim();

let signingUp: Promise<unknown> | null = null;

export async function signUp(displayName: string, email: string, password: string) {
  const name = cleanName(displayName);
  const run = (async () => {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
    await updateProfile(cred.user, { displayName: name });
    await setDoc(profileRef(cred.user.uid), cache({ uid: cred.user.uid, displayName: name, createdAt: Date.now() }));
    return cred.user;
  })();
  signingUp = run.catch(() => {});
  try {
    return await run;
  } finally {
    signingUp = null;
  }
}

export async function ensureProfile(user: User): Promise<Profile | null> {
  if (signingUp) await signingUp;
  try {
    const snap = await getDoc(profileRef(user.uid));
    const data = snap.exists() ? (snap.data() as Partial<Profile> & Record<string, unknown>) : null;
    const clean: Profile = {
      uid: user.uid,
      displayName:
        cleanName(typeof data?.displayName === 'string' ? data.displayName : '') ||
        cleanName(user.displayName ?? '') ||
        user.email?.split('@')[0]?.slice(0, LIMITS.name) ||
        'Student',
      createdAt: typeof data?.createdAt === 'number' ? data.createdAt : Date.now(),
    };
    const dirty = !data || Object.keys(data).some((k) => !(k in clean)) || data.displayName !== clean.displayName;
    if (dirty) await setDoc(profileRef(user.uid), clean);
    return cache(clean);
  } catch {
    return cachedProfile();
  }
}

async function wipeLocal() {
  abortSync();
  await Notifications.cancelAllScheduledNotificationsAsync().catch(() => {});
  resetAll();
  deleteAllPhotos();
}

export async function signOut() {
  await wipeLocal();
  await fbSignOut(auth);
}

export async function claimLocalData(uid: string) {
  const owner = meta.get('owner');
  if (owner && owner !== uid) await wipeLocal();
  meta.set('owner', uid);
}

export const authError = friendlyError;
