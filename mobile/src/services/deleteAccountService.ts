// Commit: Add deleteAccountFromFirestore service for deleting user doc from Firestore
// Author: GitHub Copilot, 2025-09-23
import { firestore } from '../config/firebase';
import { doc, deleteDoc } from 'firebase/firestore';

/**
 * Delete the user document from Firestore users collection
 * @param userId - The user's ID
 */
export const deleteAccountFromFirestore = async (userId: string): Promise<void> => {
  if (!userId) throw new Error('No user ID provided');
  const userDocRef = doc(firestore, 'users', userId);
  await deleteDoc(userDocRef);
};
