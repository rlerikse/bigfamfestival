import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { UserRole } from '../types/user';
import { loginUser, registerUser, getUserProfile } from '../services/authService';
import { Alert } from 'react-native';

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

interface AuthContextProps {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, phone?: string) => Promise<void>;
  loginAsGuest: () => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
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

  // Initialize auth state
  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = await SecureStore.getItemAsync('userToken');
        if (token) {
          // If we have a token, fetch user data to validate it
          const userData = await getUserProfile(token);
          setUser(userData);
        }
      } catch (error) {
        console.error('Error loading user:', error);
        // Clear token if it's invalid
        await SecureStore.deleteItemAsync('userToken');
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const { token, user } = await loginUser(email, password);
      
      // Save token securely
      await SecureStore.setItemAsync('userToken', token);
      setUser(user);
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Login Failed', error instanceof Error ? error.message : 'Please check your credentials');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Register function
  const register = async (name: string, email: string, password: string, phone?: string) => {
    try {
      setIsLoading(true);
      const { token, user } = await registerUser({ name, email, password, phone });
      
      // Save token securely
      await SecureStore.setItemAsync('userToken', token);
      setUser(user);
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
      await SecureStore.deleteItemAsync('userToken');
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Login as guest function
  const loginAsGuest = async () => {
    try {
      setIsLoading(true);
      // Create a guest user without storing any token
      setUser({
        id: 'guest-user',
        name: 'Guest',
        email: 'guest@example.com',
        role: UserRole.ATTENDEE,
        ticketType: 'guest'
      });
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

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, loginAsGuest, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};
