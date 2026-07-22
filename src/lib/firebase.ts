/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, deleteApp } from 'firebase/app';
import { 
  getAuth, 
  signOut, 
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';

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
// Form screens intentionally leave several optional fields empty (for example,
// the professional linked to an administrator). Firestore does not accept
// `undefined` values, so omit them at the database boundary instead of
// rejecting the whole registration. Explicit `null` values continue to be
// persisted when a field must be cleared.
const db = initializeFirestore(app, { ignoreUndefinedProperties: true }, databaseId);

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
