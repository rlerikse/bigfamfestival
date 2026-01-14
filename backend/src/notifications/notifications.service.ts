import { Injectable, Logger } from '@nestjs/common';
import { FirestoreService } from '../config/firestore/firestore.service';
import * as admin from 'firebase-admin';
import { Timestamp, FieldValue } from '@google-cloud/firestore';
import { Expo, ExpoPushMessage } from 'expo-server-sdk';

// Define a simpler interface for creating notifications with only primitive types
export interface CreateNotificationDto {
  title: string;
  body: string;
  data?: Record<string, any>;
  sentBy: string;
  category?: string;
  priority?: 'normal' | 'high';
  receiverGroups?: string[];
}

// Full interface for stored notifications
export interface AdminNotification {
  id: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  sentAt: Timestamp | Date | FirebaseFirestore.Timestamp | any; // any to handle Firebase sentinel values
  sentBy: string;
  category?: string;
  priority?: 'normal' | 'high';
  receiverGroups?: string[];
}

interface FailedToken {
  token: string;
  error: any;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  constructor(private readonly firebaseService: FirestoreService) {}

  /**
   * Get count of registered push tokens for debugging
   */
  async getTokenCount() {
    try {
      const db = this.firebaseService.db;
      const usersSnapshot = await db
        .collection('users')
        .where('expoPushToken', '!=', null)
        .get();

      const tokens = usersSnapshot.docs
        .map((doc) => (doc.data() as any).expoPushToken)
        .filter(Boolean);

      // Count tokens by platform
      const androidTokens = tokens.filter((token) =>
        token.startsWith('ExponentPushToken['),
      );
      const iosTokens = tokens.filter((token) =>
        token.startsWith('ExponentPushToken:'),
      );
      const webTokens = tokens.filter((token) => token.startsWith('fcm:'));
      const otherTokens = tokens.filter(
        (token) =>
          !token.startsWith('ExponentPushToken[') &&
          !token.startsWith('ExponentPushToken:') &&
          !token.startsWith('fcm:'),
      );

      return {
        count: tokens.length,
        android: androidTokens.length,
        ios: iosTokens.length,
        web: webTokens.length,
        unknown: otherTokens.length,
        tokens: tokens.slice(0, 3), // Return a sample of tokens for debugging
      };
    } catch (error) {
      this.logger.error('Error getting token count:', error);
      throw error;
    }
  }

  /**
   * Verify Firebase Cloud Messaging configuration
   */
  async verifyFcmConfig() {
    try {
      // Check if Firebase Admin is initialized
      if (!admin.apps.length) {
        return {
          initialized: false,
          error: 'Firebase Admin SDK not initialized',
        };
      }

      // Attempt to access messaging, but don't verify by sending a message
      try {
        // Just getting the messaging object, not sending anything
        admin.messaging();

        // Return status with a note about permissions
        return {
          initialized: true,
          note: 'FCM initialized, but permissions not verified. Actual message sending may require additional permissions.',
        };
      } catch (error) {
        return {
          initialized: false,
          error: `FCM not properly configured: ${error.message}`,
        };
      }
    } catch (error) {
      this.logger.error('Error verifying FCM config:', error);
      return {
        initialized: false,
        error: `Error during FCM verification: ${error.message}`,
      };
    }
  }

  /**
   * Send a test notification (for debugging)
   */
  async sendTestNotification() {
    try {
      // Get a sample token
      const tokenCount = await this.getTokenCount();
      if (!tokenCount.tokens || tokenCount.tokens.length === 0) {
        return {
          success: false,
          message: 'No push tokens found to test',
        };
      }

      const testToken = tokenCount.tokens[0];

      // Send test message
      try {
        await admin.messaging().send({
          token: testToken,
          notification: {
            title: 'Test Notification',
            body: 'This is a test notification from the server',
          },
          data: {
            test: 'true',
            timestamp: new Date().toISOString(),
          },
        });

        return {
          success: true,
          message: `Test notification sent to token ${testToken.substring(
            0,
            10,
          )}...`,
        };
      } catch (error) {
        return {
          success: false,
          message: `Failed to send test notification: ${error.message}`,
          error: error,
        };
      }
    } catch (error) {
      this.logger.error('Error sending test notification:', error);
      throw error;
    }
  }

  async createNotification(
    notification: Omit<AdminNotification, 'id' | 'sentAt'>,
  ): Promise<{ id: string; fcmWarning?: string }> {
    try {
      const db = this.firebaseService.db;

      // Generate a document ID first
      const notificationId = db.collection('notifications').doc().id;

      // Create a safe notification object with primitive values only
      const safeNotification = {
        ...notification,
        id: notificationId,
        // Do NOT include sentAt here - we'll let Firestore set it during the write
      };

      // Create a document reference with the ID
      const notificationRef = db
        .collection('notifications')
        .doc(notificationId);

      // Use a plain JavaScript object for the write operation
      await notificationRef.set({
        ...safeNotification,
        // IMPORTANT: Use Firestore client's FieldValue, not Admin SDK's
        sentAt: FieldValue.serverTimestamp(),
      });

      // Try to verify FCM config first (without throwing errors)
      const fcmConfig = await this.verifyFcmConfig();

      if (!fcmConfig.initialized) {
        // If FCM is not properly configured, log a warning but don't fail
        this.logger.warn(
          `FCM not properly configured, notification saved but not sent: ${fcmConfig.error}`,
        );

        // Return the ID with a warning
        return {
          id: notificationId,
          fcmWarning:
            'Notification saved but not sent due to FCM configuration issues',
        };
      }

      // Fetch the notification to get the server timestamp
      const savedNotification = await notificationRef.get();
      const savedData = savedNotification.data();

      if (savedData) {
        // After storing, send the notification to all devices
        // We don't await this to improve response time, any errors will be logged
        this.sendNotificationToAllDevices({
          ...safeNotification,
          sentAt: savedData.sentAt || new Date(), // Use the stored timestamp or fallback to current date
        } as AdminNotification).catch((err) => {
          this.logger.error('Failed to send notification to devices', err);

          // If there's a permission issue, we still consider it successful
          // but we return a warning
          if (err && err.code === 'messaging/mismatched-credential') {
            return {
              id: notificationId,
              fcmWarning:
                'Notification saved but not sent due to FCM permission issues',
            };
          }
        });
      }

      // Success case - notification was saved and FCM delivery was attempted
      return { id: notificationId };
    } catch (error) {
      this.logger.error('Error creating notification', error);

      // For Firestore errors, convert them to more user-friendly messages
      if (error && error.code && error.code.startsWith('firestore/')) {
        throw new Error(`Database error: ${error.message}`);
      }

      // Otherwise rethrow the original error
      throw error;
    }
  }

  async getNotifications(limit = 50): Promise<AdminNotification[]> {
    try {
      const db = this.firebaseService.db;
      const snapshot = await db
        .collection('notifications')
        .orderBy('sentAt', 'desc')
        .limit(limit)
        .get();
      return snapshot.docs.map((doc) => doc.data() as AdminNotification);
    } catch (error) {
      this.logger.error('Error getting notifications', error);
      throw error;
    }
  }

  private async sendNotificationToAllDevices(
    notification: AdminNotification,
  ): Promise<void> {
    try {
      const db = this.firebaseService.db;
      // Get all user tokens - assuming users have an expoPushToken field
      const usersSnapshot = await db
        .collection('users')
        .where('expoPushToken', '!=', null)
        .get();

      const tokens = usersSnapshot.docs
        .map((doc) => (doc.data() as any).expoPushToken)
        .filter(Boolean);

      if (tokens.length === 0) {
        this.logger.log('No push tokens found to send notifications to');
        return;
      }

      // Filter tokens based on receiver groups if specified
      let filteredTokens = tokens;
      if (
        notification.receiverGroups &&
        notification.receiverGroups.length > 0
      ) {
        filteredTokens = await this.filterTokensByGroups(
          tokens,
          notification.receiverGroups,
        );
      }

      if (filteredTokens.length === 0) {
        this.logger.log(
          'No matching recipients found after filtering by groups',
        );
        return;
      }

      // Split tokens by provider: Expo vs FCM
      const expoTokens = filteredTokens.filter(
        (t) =>
          t.startsWith('ExponentPushToken[') ||
          t.startsWith('ExponentPushToken:'),
      );
      const fcmTokens = filteredTokens.filter((t) => !expoTokens.includes(t));

      const preparedData = this.prepareNotificationData(notification.data);

      // 1) Send via Expo for Expo tokens
      if (expoTokens.length > 0) {
        try {
          const expo = new Expo();
          const expoMessages: ExpoPushMessage[] = expoTokens.map((token) => ({
            to: token,
            sound: 'default',
            title: notification.title,
            body: notification.body,
            data: preparedData,
            priority: notification.priority === 'high' ? 'high' : 'default',
          }));

          const chunks = expo.chunkPushNotifications(expoMessages);
          const tickets = [] as any[];
          for (const chunk of chunks) {
            const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
            tickets.push(...ticketChunk);
          }
          const failed: FailedToken[] = [];
          tickets.forEach((ticket, idx) => {
            if (ticket?.status !== 'ok') {
              failed.push({ token: expoTokens[idx], error: ticket });
            }
          });
          this.logger.log(
            `Expo: Successfully sent ${expoTokens.length - failed.length}/${
              expoTokens.length
            }`,
          );
          if (failed.length) {
            this.logger.error('Expo token failures:', failed);
            await this.cleanupInvalidTokens(failed);
          }
        } catch (expoError) {
          this.logger.error('Expo push error:', expoError);
        }
      }

      // 2) Send via FCM for the rest
      if (fcmTokens.length > 0) {
        const message: admin.messaging.MulticastMessage = {
          notification: {
            title: notification.title,
            body: notification.body,
          },
          data: preparedData,
          tokens: fcmTokens,
          android:
            notification.priority === 'high'
              ? {
                  priority: 'high',
                }
              : undefined,
          apns: {
            payload: {
              aps: {
                sound: 'default',
                badge: 1,
              },
            },
          },
        };

        try {
          const response = await admin
            .messaging()
            .sendEachForMulticast(message);
          this.logger.log(
            `FCM: Successfully sent ${response.successCount}/${fcmTokens.length}`,
          );
          if (response.failureCount > 0) {
            const failedTokens: FailedToken[] = [];
            response.responses.forEach((resp, idx) => {
              if (!resp.success) {
                failedTokens.push({
                  token: fcmTokens[idx],
                  error: resp.error,
                });
              }
            });
            this.logger.error('FCM token failures:', failedTokens);
            await this.cleanupInvalidTokens(failedTokens);
          }
        } catch (fcmError) {
          if (fcmError.code === 'messaging/mismatched-credential') {
            this.logger.error(
              'FCM permission denied: Service account lacks FCM send permissions. Ensure it has Firebase Cloud Messaging Admin role.',
              fcmError,
            );
            this.logger.warn(
              'Notification saved to database but could not be delivered via FCM due to permission issues.',
            );
          } else {
            this.logger.error('FCM error when sending notification:', fcmError);
          }
        }
      }
    } catch (error) {
      this.logger.error('Error in notification process:', error);
      // Don't throw the error to prevent API failures
      // Just log it so it's recorded but doesn't break the API response
    }
  }

  /**
   * Helper method to prepare notification data for FCM
   * Ensures all values are primitive strings to avoid serialization issues
   */
  private prepareNotificationData(
    data?: Record<string, any>,
  ): Record<string, string> {
    if (!data) return {};

    const result: Record<string, string> = {};

    for (const [key, value] of Object.entries(data)) {
      // Skip null or undefined values
      if (value === null || value === undefined) continue;

      if (typeof value === 'string') {
        // Keep strings as-is
        result[key] = value;
      } else if (typeof value === 'number' || typeof value === 'boolean') {
        // Convert numbers and booleans to strings
        result[key] = String(value);
      } else if (typeof value === 'object') {
        try {
          // Check for Firebase Timestamp or Date objects
          if (
            value instanceof Date ||
            ('_seconds' in value && '_nanoseconds' in value) ||
            ('seconds' in value && 'nanoseconds' in value)
          ) {
            // Convert timestamps to ISO strings
            result[key] = new Date(
              value instanceof Date
                ? value.getTime()
                : (value._seconds || value.seconds) * 1000,
            ).toISOString();
          } else {
            // For other objects, convert to JSON string
            result[key] = JSON.stringify(value);
          }
        } catch (e) {
          // If serialization fails, use a placeholder value
          this.logger.warn(`Could not serialize value for key ${key}:`, e);
          result[key] = '[Object]';
        }
      } else {
        // For any other types, convert to string
        result[key] = String(value);
      }
    }

    return result;
  }
  private async filterTokensByGroups(
    tokens: string[],
    groups: string[],
  ): Promise<string[]> {
    try {
      // Implementation depends on how you store user groups
      const db = this.firebaseService.db;

      const usersSnapshot = await db
        .collection('users')
        .where('userGroup', 'in', groups)
        .where('expoPushToken', '!=', null)
        .get();

      return usersSnapshot.docs
        .map((doc) => (doc.data() as any).expoPushToken)
        .filter(Boolean);
    } catch (error) {
      this.logger.error('Error filtering tokens by groups', error);
      return []; // Return empty array on error to avoid notification failure
    }
  }
  private async cleanupInvalidTokens(
    failedTokens: FailedToken[],
  ): Promise<void> {
    try {
      const db = this.firebaseService.db;

      // Find tokens that need to be removed (e.g., tokens that are no longer valid)
      const tokensToRemove = failedTokens
        .filter(
          (item) =>
            item.error?.code === 'messaging/invalid-registration-token' ||
            item.error?.code === 'messaging/registration-token-not-registered',
        )
        .map((item) => item.token);

      if (tokensToRemove.length === 0) return;

      // Find users with invalid tokens
      const batch = db.batch();
      const usersWithInvalidTokens = await db
        .collection('users')
        .where('expoPushToken', 'in', tokensToRemove)
        .get();

      // Remove the tokens
      usersWithInvalidTokens.docs.forEach((doc) => {
        batch.update(doc.ref, { expoPushToken: null });
      });

      await batch.commit();
      this.logger.log(
        `Cleaned up ${usersWithInvalidTokens.size} invalid tokens`,
      );
    } catch (error) {
      this.logger.error('Error cleaning up invalid tokens', error);
      // Don't throw here, just log the error
    }
  }
}
