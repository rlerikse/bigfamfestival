import { User, UserRole } from '../types/user'; // Assuming User and UserRole types are defined

// REPLACE WITH YOUR ACTUAL BACKEND API URL
const API_BASE_URL = 'http://localhost:3000/api'; // Or your deployed backend URL

interface AuthResponse {
  token: string;
  user: User;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

// Login user
export const loginUser = async (email: string, password: string): Promise<AuthResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Login failed');
    }

    const data = await response.json();
    // Assuming the backend returns { token: string, user: UserData }
    // You might need to map backend UserData to your frontend User type
    return {
      token: data.access_token, // Or whatever your token field is named
      user: data.user,       // Or map data.user to your User type
    };
  } catch (error) {
    console.error('API login error:', error);
    throw error; // Re-throw to be caught by AuthContext
  }
};

// Register user
export const registerUser = async (userData: RegisterData): Promise<AuthResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Registration failed');
    }
    const data = await response.json();
    return {
      token: data.access_token, 
      user: data.user,
    };
  } catch (error) {
    console.error('API registration error:', error);
    throw error;
  }
};

// Get user profile
export const getUserProfile = async (token: string): Promise<User> => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/profile`, { // Or your specific profile endpoint
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch user profile');
    }
    const userProfile = await response.json();
    // Ensure userProfile matches the User type structure
    return userProfile as User;
  } catch (error) {
    console.error('API get user profile error:', error);
    throw error;
  }
};
