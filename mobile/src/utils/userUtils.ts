import { User } from '../contexts/AuthContext';

/**
 * Check if a user is a guest user
 * @param user The user object to check
 * @returns True if the user is a guest, false otherwise
 */
export const isGuestUser = (user: User | null): boolean => {
  if (!user) return false;
  return user.id === 'guest-user' || user.ticketType === 'guest';
};

/**
 * Check if a user is a logged-in user (not a guest)
 * @param user The user object to check
 * @returns True if the user is logged in (not a guest), false otherwise
 */
export const isLoggedInUser = (user: User | null): boolean => {
  if (!user) return false;
  return !isGuestUser(user);
};