/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, deleteApp, getApp, getApps } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut, 
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  getDocs, 
  updateDoc, 
  deleteDoc,
  query,
  where
} from 'firebase/firestore';
import { User } from '../types';

const firebaseConfig = {
  projectId: "gen-lang-client-0067109529",
  appId: "1:911613401448:web:9397c658efc6b1deb25edd",
  apiKey: "AIzaSyDJt-63t-jgDeNjEQV6k3Rdc29x4x3sK8A",
  authDomain: "gen-lang-client-0067109529.firebaseapp.com",
  storageBucket: "gen-lang-client-0067109529.firebasestorage.app",
  messagingSenderId: "911613401448",
};

const databaseId = "ai-studio-espaolabelleagen-3c23ae7c-bd7e-4820-bb41-b9270c1eecb0";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app, databaseId);

export { app, auth, db };

/**
 * Creates a secondary Firebase instance to register a user
 * without logging out the currently logged-in administrator.
 */
export async function createNewUserAuth(email: string, password: string): Promise<string> {
  const secondaryAppName = `SecondaryApp_${Date.now()}`;
  const secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
  const secondaryAuth = getAuth(secondaryApp);
  try {
    const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    const uid = userCredential.user.uid;
    await signOut(secondaryAuth);
    return uid;
  } finally {
    await deleteApp(secondaryApp);
  }
}

/**
 * Seed initial users if none exist.
 * Returns true if the email/password provider is disabled in the Firebase Console.
 */
export async function bootstrapInitialUsers(): Promise<boolean> {
  let isEmailPasswordDisabled = false;
  const secondaryAppName = `SecondaryApp_Bootstrap_${Date.now()}`;
  let secondaryApp;
  try {
    console.log('Checking or bootstrapping default auth accounts...');
    
    // Default users to bootstrap with password '123' (aligns with test/mock suite)
    const defaultUsersToSeed = [
      { email: 'admin@labelle.com', password: '123' },
      { email: 'fernandoaraujotrafego@gmail.com', password: '123' },
      { email: 'gestora@labelle.com', password: '123' },
      { email: 'recepcao@labelle.com', password: '123' },
      { email: 'profissional@labelle.com', password: '123' }
    ];

    // Initialize a single secondary app for the entire seeding loop to prevent network stress
    secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
    const secondaryAuth = getAuth(secondaryApp);

    for (const u of defaultUsersToSeed) {
      try {
        await createUserWithEmailAndPassword(secondaryAuth, u.email, u.password);
        await signOut(secondaryAuth);
        console.log(`Auth account created successfully for: ${u.email}`);
        // Add a tiny delay to prevent rate limits
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (err: any) {
        // If user already exists in Auth, handle it gracefully
        if (err.code === 'auth/email-already-in-use') {
          // Already created, ignore
        } else if (err.code === 'auth/operation-not-allowed') {
          console.warn('Firebase Email/Password authentication provider is disabled in Firebase Console.');
          isEmailPasswordDisabled = true;
          break;
        } else if (err.code === 'auth/network-request-failed') {
          console.warn(`Network issue while bootstrapping Auth for ${u.email}. This is normal and will be resolved on-demand during login.`);
        } else {
          console.warn(`Non-fatal warning bootstrapping Auth for ${u.email}:`, err.message || err);
        }
      }
    }
  } catch (error: any) {
    console.warn('Non-fatal warning in bootstrapInitialUsers:', error.message || error);
    if (error.code === 'auth/operation-not-allowed') {
      isEmailPasswordDisabled = true;
    }
  } finally {
    if (secondaryApp) {
      try {
        await deleteApp(secondaryApp);
      } catch (e) {
        // Ignore deletion error
      }
    }
  }
  return isEmailPasswordDisabled;
}
