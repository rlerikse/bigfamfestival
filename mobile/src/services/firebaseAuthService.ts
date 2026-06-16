/**
 * Firebase Authentication Service
 *
 * Wraps React Native Firebase Auth SDK for the Big Fam Festival app.
 * Provides authentication methods that integrate with Firebase Auth.
 *
 * @see specs/BFF-50-firebase-auth-migration/spec.md
 */

import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { appleAuth } from '@invertase/react-native-apple-authentication';
import { Platform } from 'react-native';

// Configure Google Sign-In
// IMPORTANT: webClientId MUST be the "Web application" OAuth 2.0 client ID
// from Google Cloud Console (not the Android or iOS client ID).
// On Android, the app's SHA-256 signing fingerprint must be registered in
// Firebase Console > Project Settings > Android apps for each build variant.
try {
  GoogleSignin.configure({
    // Web Application OAuth client ID (same Firebase project)
    webClientId: '292369452544-gk9gjbugtgulecojj42pekg6o2dsq2m7.apps.googleusercontent.com',
    // iOS client ID from GoogleService-Info.plist; only needed if not auto-detected
    ...(Platform.OS === 'ios' && {
      iosClientId: '292369452544-0fs6n82klotfoo0ckbsgq5kmcresasue.apps.googleusercontent.com',
    }),
  });
} catch (e) {
  console.warn('[FirebaseAuth] Google Sign-In configure failed:', e);
}

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

/**
 * Sign in with Google
 *
 * Uses @react-native-google-signin/google-signin v16+ API.
 * The webClientId must match the OAuth 2.0 "Web application" client ID in
 * Google Cloud Console (same project as Firebase). On Android, the app's
 * signing certificate SHA-256 fingerprint must be registered in Firebase
 * Console > Project Settings > Android apps.
 */
export async function signInWithGoogle(): Promise<FirebaseAuthTypes.UserCredential> {
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    // Clear cached account selection so the account picker always appears
    await GoogleSignin.signOut();

    const signInResult = await GoogleSignin.signIn();

    // v13+: signIn() returns { type, data } — handle cancellation
    if ('type' in signInResult && signInResult.type === 'cancelled') {
      throw new Error('Google Sign-In was cancelled.');
    }

    // Extract ID token — different access paths for API versions
    const idToken = signInResult.data?.idToken ?? (signInResult as any)?.idToken;

    if (!idToken) {
      // Common causes:
      // - webClientId mismatch (must be the Web client ID, not Android/iOS)
      // - SHA fingerprint not registered for this build variant
      // - OAuth consent screen not configured
      console.error(
        '[FirebaseAuth] Google Sign-In: no idToken. Check webClientId matches ' +
        'the Web Application OAuth client in Google Cloud Console, and that ' +
        'the SHA-256 fingerprint for this build is registered in Firebase.',
      );
      throw new Error(
        'Google Sign-In failed: Could not get authentication token. ' +
        'Please try again or use email login.',
      );
    }

    const googleCredential = auth.GoogleAuthProvider.credential(idToken);
    return await auth().signInWithCredential(googleCredential);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('[FirebaseAuth] Google sign-in error:', error.code || error.message);
    if (error.code === 'SIGN_IN_CANCELLED' || error.code === '12501') {
      throw new Error('Google Sign-In was cancelled.');
    }
    if (error.code === 'IN_PROGRESS') {
      throw new Error('Google Sign-In is already in progress.');
    }
    if (error.code === 'PLAY_SERVICES_NOT_AVAILABLE') {
      throw new Error('Google Play Services is not available on this device.');
    }
    // Network failure during token exchange
    if (error.code === '10' || error.code === 'DEVELOPER_ERROR') {
      console.error(
        '[FirebaseAuth] DEVELOPER_ERROR: SHA fingerprint or webClientId mismatch. ' +
        'Ensure the OAuth web client ID is used (not Android client ID) and ' +
        'all build-variant SHA-256 fingerprints are registered in Firebase Console.',
      );
      throw new Error(
        'Google Sign-In configuration error. Please contact support if this persists.',
      );
    }
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Sign in with Apple (iOS only)
 */
export async function signInWithApple(): Promise<FirebaseAuthTypes.UserCredential> {
  if (Platform.OS !== 'ios') {
    throw new Error('Apple Sign-In is only available on iOS.');
  }
  try {
    const appleAuthRequestResponse = await appleAuth.performRequest({
      requestedOperation: appleAuth.Operation.LOGIN,
      requestedScopes: [appleAuth.Scope.FULL_NAME, appleAuth.Scope.EMAIL],
    });
    if (!appleAuthRequestResponse.identityToken) {
      throw new Error('Apple Sign-In failed: no identity token returned.');
    }
    const { identityToken, nonce } = appleAuthRequestResponse;
    const appleCredential = auth.AppleAuthProvider.credential(identityToken, nonce);
    return await auth().signInWithCredential(appleCredential);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('[FirebaseAuth] Apple sign-in error:', error.code || error.message);
    if (error.code === appleAuth.Error.CANCELED) {
      throw new Error('Apple Sign-In was cancelled.');
    }
    throw new Error(getErrorMessage(error));
  }
}
