import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { Expo, ExpoPushMessage } from 'expo-server-sdk';

// Initialize Firebase Admin SDK
admin.initializeApp();

// Initialize Expo SDK
const expo = new Expo();

interface NotificationDocument {
  id?: string;
  title: string;
  body: string;
  sentAt: FirebaseFirestore.Timestamp | Date;
  sentBy: string;
  category?: string;
  priority?: 'normal' | 'high';
  receiverGroups?: string[];
  data?: Record<string, any>;
}

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
      const notificationData = snapshot.data() as NotificationDocument;
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

      // Extract tokens and filter by receiver groups if specified
      let userTokens: string[] = [];
      
      usersSnapshot.forEach(doc => {
        const userData = doc.data();
        if (userData.expoPushToken && Expo.isExpoPushToken(userData.expoPushToken)) {
          // If notification has receiver groups, only send to users in those groups
          if (notificationData.receiverGroups && notificationData.receiverGroups.length > 0) {
            const userGroup = userData.userGroup || 'general';
            if (notificationData.receiverGroups.includes(userGroup)) {
              userTokens.push(userData.expoPushToken);
            }
          } else {
            // No receiver groups specified, send to all users
            userTokens.push(userData.expoPushToken);
          }
        }
      });

      console.log(`Found ${userTokens.length} valid push tokens to notify`);
      
      if (userTokens.length === 0) {
        console.log('No valid push tokens found, skipping notification send');
        return null;
      }

      // Prepare push notification data
      // Ensure all data values are strings (Expo requirement)
      const pushData: Record<string, string> = {
        id: notificationId,
        category: notificationData.category || 'general',
      };

      // Add additional data if present
      if (notificationData.data) {
        Object.entries(notificationData.data).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            if (typeof value === 'object') {
              pushData[key] = JSON.stringify(value);
            } else {
              pushData[key] = String(value);
            }
          }
        });
      }

      // Create messages for each token
      const messages: ExpoPushMessage[] = userTokens.map(token => ({
        to: token,
        sound: 'default',
        title: notificationData.title,
        body: notificationData.body,
        data: pushData,
        priority: notificationData.priority === 'high' ? 'high' : 'default',
      }));

      // Split messages into chunks to respect Expo's chunk size limit
      const chunks = expo.chunkPushNotifications(messages);
      const tickets = [];

      // Send each chunk of notifications
      for (const chunk of chunks) {
        try {
          const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
          tickets.push(...ticketChunk);
          console.log(`Sent ${ticketChunk.length} notifications`);
        } catch (error) {
          console.error('Error sending chunk of notifications:', error);
        }
      }

      // Process the tickets and identify any failures
      const receiptIds = [];
      const failedTokens: { token: string; error: string; }[] = [];

      tickets.forEach((ticket, index) => {
        if (ticket.status === 'ok') {
          receiptIds.push(ticket.id);
        } else {
          failedTokens.push({
            token: userTokens[index],
            error: ticket.details?.error || 'unknown',
          });
        }
      });

      console.log(`Successfully sent ${receiptIds.length} notifications`);
      
      if (failedTokens.length > 0) {
        console.log(`Failed to send ${failedTokens.length} notifications`);
        
        // Cleanup invalid tokens
        const batch = admin.firestore().batch();
        let batchOperationsCount = 0;
        
        for (const { token, error } of failedTokens) {
          if (error === 'DeviceNotRegistered') {
            const invalidTokenUsers = await admin.firestore()
              .collection('users')
              .where('expoPushToken', '==', token)
              .get();
              
            invalidTokenUsers.forEach(doc => {
              batch.update(doc.ref, { expoPushToken: null });
              batchOperationsCount++;
            });
          }
        }
        
        if (batchOperationsCount > 0) {
          await batch.commit();
          console.log(`Cleaned up ${batchOperationsCount} invalid tokens`);
        }
      }

      return {
        success: true,
        sent: receiptIds.length,
        failed: failedTokens.length,
      };
    } catch (error) {
      console.error('Error in sendPushNotifications function:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return { success: false, error: errorMessage };
    }
  });

/**
 * Check Expo receipts for notification delivery status 
 * Runs every hour to check receipts from the past day
 */
export const checkNotificationReceipts = functions.pubsub
  .schedule('every 1 hours')
  .onRun(async (context) => {
    try {
      // Get notifications from the past 24 hours that have receipt IDs
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const notificationsSnapshot = await admin.firestore()
        .collection('notification_receipts')
        .where('createdAt', '>', yesterday)
        .where('status', '==', 'pending')
        .get();
      
      if (notificationsSnapshot.empty) {
        console.log('No pending notification receipts to check');
        return null;
      }
      
      // Process receipts in batches
      const receiptIds: string[] = [];
      const receiptDocs: FirebaseFirestore.QueryDocumentSnapshot[] = [];
      
      notificationsSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.receiptId) {
          receiptIds.push(data.receiptId);
          receiptDocs.push(doc);
        }
      });
      
      if (receiptIds.length === 0) {
        console.log('No receipt IDs found to check');
        return null;
      }
      
      // Check receipts with Expo
      const receiptChunks = expo.chunkPushNotificationReceiptIds(receiptIds);
      const batch = admin.firestore().batch();
      let batchOperationsCount = 0;
      
      for (const chunk of receiptChunks) {
        try {
          const receipts = await expo.getPushNotificationReceiptsAsync(chunk);
          
          // Update receipt status in Firestore
          for (const [receiptId, receipt] of Object.entries(receipts)) {
            // Find the corresponding document for this receipt
            const docIndex = receiptIds.indexOf(receiptId);
            if (docIndex >= 0) {
              const doc = receiptDocs[docIndex];
              
              if (receipt.status === 'ok') {
                batch.update(doc.ref, { 
                  status: 'delivered',
                  updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });
                batchOperationsCount++;
              } else if (receipt.status === 'error') {
                batch.update(doc.ref, {
                  status: 'failed',
                  error: receipt.details?.error || 'unknown',
                  updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });
                batchOperationsCount++;
                
                // If DeviceNotRegistered, cleanup the token
                if (receipt.details?.error === 'DeviceNotRegistered') {
                  const tokenData = doc.data();
                  if (tokenData.token) {
                    const invalidTokenUsers = await admin.firestore()
                      .collection('users')
                      .where('expoPushToken', '==', tokenData.token)
                      .get();
                      
                    invalidTokenUsers.forEach(userDoc => {
                      batch.update(userDoc.ref, { expoPushToken: null });
                      batchOperationsCount++;
                    });
                  }
                }
              }
            }
          }
        } catch (error) {
          console.error('Error checking receipt chunk:', error);
        }
      }
      
      // Commit all updates
      if (batchOperationsCount > 0) {
        await batch.commit();
        console.log(`Updated ${batchOperationsCount} notification receipts`);
      }
      
      return {
        success: true,
        processed: receiptIds.length
      };
    } catch (error) {
      console.error('Error in checkNotificationReceipts function:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });