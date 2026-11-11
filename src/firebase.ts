import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  OAuthProvider,
  TwitterAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithRedirect,
  getRedirectResult,
  signInWithPopup,
  sendEmailVerification,
  sendPasswordResetEmail,
  applyActionCode,
  updateProfile as updateAuthProfile,
  onAuthStateChanged,
  signOut as firebaseSignOut,
  deleteUser,
  linkWithCredential,
  fetchSignInMethodsForEmail,
  EmailAuthProvider,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
} from 'firebase/auth';
import type { AuthCredential, UserCredential } from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  onSnapshot,
  enableIndexedDbPersistence,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyCPFDaUIQmRSdbKurl-3AWjVaZevsveM-E',
  authDomain: 'studyflow-65e65.firebaseapp.com',
  projectId: 'studyflow-65e65',
  storageBucket: 'studyflow-65e65.firebasestorage.app',
  messagingSenderId: '1071935185705',
  appId: '1:1071935185705:web:c8d8fd9bf8cf7576170d38',
  measurementId: 'G-LEL984HSQ1',
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

enableIndexedDbPersistence(db).catch(() => {
  // Unsupported browser or multiple open tabs; app still works online.
});

export const googleProvider = new GoogleAuthProvider();
// Reuse of the browser's Google session auto-signs the same account with no
// chance to switch. select_account always shows the account chooser.
googleProvider.setCustomParameters({ prompt: 'select_account' });

export const microsoftProvider = new OAuthProvider('microsoft.com');
// Needed to fetch the profile photo from Microsoft Graph; Firebase only asks
// for openid/profile/email by default, and many Microsoft accounts return no
// photoURL through the identity provider at all.
microsoftProvider.addScope('User.Read');
// select_account stops silent re-use of the browser's Microsoft session by
// always showing the account chooser. Note: Azure AD rejects combined prompt
// values (AADSTS90023), so this must stay a single value — adding 'consent'
// breaks sign-in entirely.
microsoftProvider.setCustomParameters({ prompt: 'select_account' });

export const twitterProvider = new TwitterAuthProvider();

export {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithRedirect,
  getRedirectResult,
  signInWithPopup,
  sendEmailVerification,
  sendPasswordResetEmail,
  applyActionCode,
  updateAuthProfile,
  onAuthStateChanged,
  firebaseSignOut,
  deleteUser,
  linkWithCredential,
  fetchSignInMethodsForEmail,
  EmailAuthProvider,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  GoogleAuthProvider,
  OAuthProvider,
  TwitterAuthProvider,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  onSnapshot,
};
export type { AuthCredential, UserCredential };
