import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Alert } from 'react-native';
import { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { UserRole } from '../types/user';
import { getUserProfile, createUserProfile } from '../services/authService';
import { deleteAccountFromFirestore } from '../services/deleteAccountService';
import { scheduleAllUserEventsNotifications, cancelAllUserEventsNotifications } from '../services/notificationService';
import {
  signIn as firebaseSignIn,
  signUp as firebaseSignUp,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  getIdToken,
  sendPasswordResetEmail,
} from '../services/firebaseAuthService';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  shareMyCampsite?: boolean;
  shareMyLocation?: boolean;
  ticketType?: string;
  profilePictureUrl?: string;
}
export interface AuthContextProps {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, phone?: string) => Promise<void>;
  loginAsGuest: () => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  isGuestUser: () => boolean;
  redirectToLogin: (message?: string) => void;
  deleteAccount: () => Promise<void>;
  getAuthToken: () => Promise<string | null>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseAuthTypes.User | null>(null);

  // Subscribe to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(async (fbUser) => {
      setFirebaseUser(fbUser);
      
      if (fbUser) {
        try {
          // Get the ID token for API calls
          const token = await fbUser.getIdToken();
          
          // Fetch user profile from our backend (to get role, ticketType, etc.)
          const userData = await getUserProfile(token);
          setUser(userData);
          
          // Schedule notifications for user's events
          await scheduleAllUserEventsNotifications(userData.id);
        } catch (error) {
          console.error('[AuthContext] Error fetching user profile:', error);
          // User exists in Firebase but not in Firestore - might need to create profile
          setUser({
            id: fbUser.uid,
            name: fbUser.displayName || 'User',
            email: fbUser.email || '',
            role: UserRole.ATTENDEE,
          });
        }
      } else {
        // Check if guest user
        const guestUser = await SecureStore.getItemAsync('guestUser');
        if (guestUser) {
          setUser(JSON.parse(guestUser));
        } else {
          setUser(null);
        }
      }
      
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Get auth token for API calls (Firebase ID token)
  const getAuthToken = async (): Promise<string | null> => {
    // If guest user, no token
    if (user?.id === 'guest-user') {
      return null;
    }
    return getIdToken();
  };

  // Delete account from Firestore and Firebase Auth
  const deleteAccount = async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      
      // Delete from Firestore first
      await deleteAccountFromFirestore(user.id);
      
      // Delete from Firebase Auth if not guest
      if (firebaseUser) {
        await firebaseUser.delete();
      }
      
      // Clear guest user if applicable
      await SecureStore.deleteItemAsync('guestUser');
      
      setUser(null);
      setFirebaseUser(null);
      Alert.alert('Account Deleted', 'Your account has been deleted.');
    } catch (error) {
      console.error('Delete account error:', error);
      Alert.alert('Delete Failed', error instanceof Error ? error.message : 'Failed to delete your account. Please try again.');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Login function using Firebase Auth
  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      
      // Clear any guest user
      await SecureStore.deleteItemAsync('guestUser');
      
      // Sign in with Firebase
      await firebaseSignIn(email, password);
      
      // onAuthStateChanged will handle setting the user
      if (__DEV__) {
        console.log('[AuthContext] Login initiated for:', email);
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Login Failed', error instanceof Error ? error.message : 'Please check your credentials');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Register function using Firebase Auth
  const register = async (name: string, email: string, password: string, phone?: string) => {
    try {
      setIsLoading(true);
      
      // Clear any guest user
      await SecureStore.deleteItemAsync('guestUser');
      
      // Create Firebase Auth user
      const credential = await firebaseSignUp(email, password, name);
      
      // Create user profile in Firestore
      if (credential.user) {
        const token = await credential.user.getIdToken();
        await createUserProfile(token, {
          name,
          email,
          phone,
          role: UserRole.ATTENDEE,
        });
      }
      
      // onAuthStateChanged will handle setting the user
      if (__DEV__) {
        console.log('[AuthContext] Registration completed for:', email);
      }
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert('Registration Failed', error instanceof Error ? error.message : 'Please try again later');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      // Sign out from Firebase
      if (firebaseUser) {
        await firebaseSignOut();
      }
      
      // Clear guest user
      await SecureStore.deleteItemAsync('guestUser');
      
      setUser(null);
      setFirebaseUser(null);
      
      // Cancel all scheduled notifications
      await cancelAllUserEventsNotifications();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Login as guest function
  const loginAsGuest = async () => {
    try {
      setIsLoading(true);
      
      // Create a guest user without Firebase auth
      const guestUserData: User = {
        id: 'guest-user',
        name: 'Guest',
        email: 'guest@example.com',
        role: UserRole.ATTENDEE,
        ticketType: 'guest'
      };
      
      // Store guest user preference
      await SecureStore.setItemAsync('guestUser', JSON.stringify(guestUserData));
      
      setUser(guestUserData);
    } catch (error) {
      console.error('Guest login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Update user data
  const updateUser = (userData: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...userData });
    }
  };

  // Check if current user is a guest
  const isGuestUser = (): boolean => {
    return user?.id === 'guest-user';
  };

  // Redirect to login screen with optional message
  const redirectToLogin = (message?: string) => {
    if (message) {
      Alert.alert('Login Required', message, [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Login', 
          onPress: async () => {
            // For guest users, need to logout first so Auth stack becomes available
            if (isGuestUser()) {
              await logout();
            }
          }
        },
      ]);
    } else {
      // For guest users, need to logout first so Auth stack becomes available
      if (isGuestUser()) {
        logout();
      }
    }
  };

  // Request password reset email via Firebase
  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(email);
      if (__DEV__) {
        console.log('[AuthContext] Password reset email sent to:', email);
      }
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoading, 
      login, 
      register, 
      logout, 
      loginAsGuest, 
      updateUser,
      isGuestUser,
      redirectToLogin,
      deleteAccount,
      getAuthToken,
      resetPassword,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
