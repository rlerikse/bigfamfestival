/**
 * Firebase Authentication Service
 *
 * Wraps React Native Firebase Auth SDK for the Big Fam Festival app.
 * Provides authentication methods that integrate with Firebase Auth.
 *
 * @see specs/BFF-50-firebase-auth-migration/spec.md
 */

import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';

// Error code to user-friendly message mapping
const ERROR_MESSAGES: Record<string, string> = {
  'auth/email-already-in-use': 'This email is already registered. Please login instead.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/operation-not-allowed': 'Email/password accounts are not enabled.',
  'auth/weak-password': 'Password should be at least 6 characters.',
  'auth/user-disabled': 'This account has been disabled.',
  'auth/user-not-found': 'No account found with this email.',
  'auth/wrong-password': 'Incorrect password. Please try again.',
  'auth/invalid-credential': 'Invalid email or password.',
  'auth/too-many-requests': 'Too many login attempts. Please try again later.',
  'auth/network-request-failed': 'Network error. Please check your connection.',
};

/**
 * Get user-friendly error message from Firebase error code
 */
function getErrorMessage(error: any): string {
  if (error?.code && ERROR_MESSAGES[error.code]) {
    return ERROR_MESSAGES[error.code];
  }
  return error?.message || 'An unexpected error occurred.';
}

/**
 * Firebase Auth User type
 */
export interface FirebaseAuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  emailVerified: boolean;
  phoneNumber: string | null;
}

/**
 * Sign in with email and password
 */
export async function signIn(
  email: string,
  password: string,
): Promise<FirebaseAuthTypes.UserCredential> {
  try {
    const credential = await auth().signInWithEmailAndPassword(email, password);
    return credential;
  } catch (error: any) {
    console.error('[FirebaseAuth] Sign in error:', error.code);
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Create a new user with email and password
 */
export async function signUp(
  email: string,
  password: string,
  displayName?: string,
): Promise<FirebaseAuthTypes.UserCredential> {
  try {
    const credential = await auth().createUserWithEmailAndPassword(email, password);

    // Update display name if provided
    if (displayName && credential.user) {
      await credential.user.updateProfile({ displayName });
    }

    return credential;
  } catch (error: any) {
    console.error('[FirebaseAuth] Sign up error:', error.code);
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<void> {
  try {
    await auth().signOut();
  } catch (error: any) {
    console.error('[FirebaseAuth] Sign out error:', error.code);
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Get the currently signed-in user
 */
export function getCurrentUser(): FirebaseAuthTypes.User | null {
  return auth().currentUser;
}

/**
 * Get the current user's ID token for API calls
 * The token is automatically refreshed if expired
 */
export async function getIdToken(forceRefresh = false): Promise<string | null> {
  const user = auth().currentUser;
  if (!user) {
    return null;
  }

  try {
    const token = await user.getIdToken(forceRefresh);
    return token;
  } catch (error: any) {
    console.error('[FirebaseAuth] Get ID token error:', error.code);
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Subscribe to auth state changes
 * Returns unsubscribe function
 */
export function onAuthStateChanged(
  callback: (user: FirebaseAuthTypes.User | null) => void,
): () => void {
  return auth().onAuthStateChanged(callback);
}

/**
 * Subscribe to ID token changes (fires when token refreshed)
 * Returns unsubscribe function
 */
export function onIdTokenChanged(
  callback: (user: FirebaseAuthTypes.User | null) => void,
): () => void {
  return auth().onIdTokenChanged(callback);
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(email: string): Promise<void> {
  try {
    console.log('[FirebaseAuth] Sending password reset email to:', email);
    await auth().sendPasswordResetEmail(email);
    console.log('[FirebaseAuth] Password reset email sent successfully');
  } catch (error: any) {
    console.error('[FirebaseAuth] Password reset error:', error.code, error.message);
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Reload the current user's data from Firebase
 */
export async function reloadUser(): Promise<void> {
  const user = auth().currentUser;
  if (user) {
    await user.reload();
  }
}

/**
 * Delete the current user's account
 */
export async function deleteUser(): Promise<void> {
  const user = auth().currentUser;
  if (!user) {
    throw new Error('No user is currently signed in.');
  }

  try {
    await user.delete();
  } catch (error: any) {
    console.error('[FirebaseAuth] Delete user error:', error.code);
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Convert Firebase user to our app's user format
 */
export function mapFirebaseUser(firebaseUser: FirebaseAuthTypes.User): FirebaseAuthUser {
  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    displayName: firebaseUser.displayName,
    emailVerified: firebaseUser.emailVerified,
    phoneNumber: firebaseUser.phoneNumber,
  };
}

// Export the auth instance for direct access if needed
export { auth };
