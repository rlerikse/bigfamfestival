import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { Expo } from 'expo-server-sdk';

// Initialize Firebase Admin SDK
admin.initializeApp();

// Initialize Expo SDK
const expo = new Expo();

/**
 * Firebase Cloud Function that triggers when a new notification is added
 * to the notifications collection in Firestore.
 * 
 * It retrieves all users with valid Expo push tokens and sends them
 * push notifications via the Expo Push API.
 */
export const sendPushNotifications = functions.firestore
  .document('notifications/{notificationId}')
  .onCreate(async (snapshot, context) => {
    try {
      const notificationData = snapshot.data();
      const notificationId = context.params.notificationId;

      console.log(`Processing notification ${notificationId}: ${notificationData.title}`);
      
      // Skip if no title or body
      if (!notificationData.title || !notificationData.body) {
        console.log(`Notification ${notificationId} has no title or body, skipping`);
        return null;
      }

      // Get all users with push tokens
      const usersSnapshot = await admin.firestore()
        .collection('users')
        .where('expoPushToken', '!=', null)
        .get();

      if (usersSnapshot.empty) {
        console.log('No users with push tokens found');
        return null;
      }

      // Extract valid tokens
      const userTokens: string[] = [];
      
      usersSnapshot.forEach(doc => {
        const userData = doc.data();
        if (userData.expoPushToken && Expo.isExpoPushToken(userData.expoPushToken)) {
          userTokens.push(userData.expoPushToken);
        }
      });

      console.log(`Found ${userTokens.length} valid push tokens to notify`);
      
      if (userTokens.length === 0) {
        console.log('No valid push tokens found, skipping notification send');
        return null;
      }

      // Create messages for each token
      const messages = userTokens.map(token => ({
        to: token,
        sound: 'default',
        title: notificationData.title,
        body: notificationData.body,
        data: { id: notificationId },
      }));

      // Split messages into chunks to respect Expo's chunk size limit
      const chunks = expo.chunkPushNotifications(messages);

      // Send each chunk of notifications
      for (const chunk of chunks) {
        try {
          const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
          console.log(`Sent ${ticketChunk.length} notifications`);
        } catch (error) {
          console.error('Error sending chunk of notifications:', error);
        }
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error in sendPushNotifications function:', error);
      return { success: false, error: error.message || 'Unknown error' };
    }
  });