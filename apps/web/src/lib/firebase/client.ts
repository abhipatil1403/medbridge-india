import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { firebaseConfig } from './config';

// Lazy singleton pattern — Firebase is only initialized at runtime,
// not during Next.js static page generation (prerender).
let _app: FirebaseApp | null = null;
let _auth: Auth | null = null;
let _db: Firestore | null = null;
let _storage: FirebaseStorage | null = null;

export function getFirebaseApp(): FirebaseApp {
  if (!_app) {
    _app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  }
  return _app;
}

export function getFirebaseAuth(): Auth {
  if (!_auth) _auth = getAuth(getFirebaseApp());
  return _auth;
}

export function getFirebaseDb(): Firestore {
  if (!_db) _db = getFirestore(getFirebaseApp());
  return _db;
}

export function getFirebaseStorage(): FirebaseStorage {
  if (!_storage) _storage = getStorage(getFirebaseApp());
  return _storage;
}

// In browser runtime, initialize directly so Firestore SDK instanceof checks succeed
export const auth: Auth = typeof window !== 'undefined' ? getFirebaseAuth() : new Proxy({} as Auth, {
  get(_, prop) {
    return (getFirebaseAuth() as any)[prop];
  },
});

export const db: Firestore = typeof window !== 'undefined' ? getFirebaseDb() : new Proxy({} as Firestore, {
  get(_, prop) {
    return (getFirebaseDb() as any)[prop];
  },
});

export const storage: FirebaseStorage = typeof window !== 'undefined' ? getFirebaseStorage() : new Proxy({} as FirebaseStorage, {
  get(_, prop) {
    return (getFirebaseStorage() as any)[prop];
  },
});

export default new Proxy({} as FirebaseApp, {
  get(_, prop) {
    return (getFirebaseApp() as any)[prop];
  },
});
