/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, deleteApp } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  deleteUser as deleteAuthUser,
  getAuth,
  signOut,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

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

export function getPasswordValidationError(password: string): string | null {
  if (password.length < 8 || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) {
    return 'A senha deve ter pelo menos 8 caracteres, incluindo letra maiúscula, letra minúscula e número.';
  }
  return null;
}

/**
 * Creates a secondary Firebase instance to register a user
 * without logging out the currently logged-in administrator.
 */
export async function createNewUserAuth(
  email: string,
  password: string,
  persistProfile: (uid: string) => Promise<void>
): Promise<string> {
  const passwordError = getPasswordValidationError(password);
  if (passwordError) throw new Error(passwordError);

  const secondaryAppName = `SecondaryApp_${Date.now()}`;
  const secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
  const secondaryAuth = getAuth(secondaryApp);
  try {
    const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    const uid = userCredential.user.uid;
    try {
      await persistProfile(uid);
    } catch (error) {
      // Avoid leaving an Auth account without its authorized Firestore profile.
      await deleteAuthUser(userCredential.user);
      throw error;
    }
    await signOut(secondaryAuth);
    return uid;
  } finally {
    await deleteApp(secondaryApp);
  }
}
