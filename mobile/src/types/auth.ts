/**
 * Firebase Authentication Types
 *
 * Type definitions for Firebase Auth integration.
 * @see specs/BFF-50-firebase-auth-migration/spec.md
 */

/**
 * Firebase Auth User representation in our app
 */
export interface FirebaseAuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  emailVerified: boolean;
  phoneNumber: string | null;
}

/**
 * Auth state for the application
 */
export interface AuthState {
  user: FirebaseAuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

/**
 * Credentials for email/password sign in
 */
export interface SignInCredentials {
  email: string;
  password: string;
}

/**
 * Credentials for email/password sign up
 */
export interface SignUpCredentials {
  email: string;
  password: string;
  displayName?: string;
  phone?: string;
}

/**
 * Firebase Auth error structure
 */
export interface AuthError {
  code: string;
  message: string;
}

/**
 * Auth provider types
 */
export type AuthProvider = 'firebase' | 'guest';

/**
 * Token info returned from backend verification
 */
export interface TokenInfo {
  uid: string;
  email: string;
  role: string;
  emailVerified: boolean;
  authProvider: AuthProvider;
}
