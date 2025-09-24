import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { api } from '../services/api';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import NotificationHistoryItem from '../components/NotificationHistoryItem';
import { compareRoles, showTokenDebugInfo } from '../utils/debugTools';

/**
 * AdminNotificationsScreen - A screen for admins to send push notifications to all app users
 * This component allows admins to create and send broadcast notifications to all registered devices
 */
// Define notification history item type
interface NotificationHistoryItem {
  id: string;
  title: string;
  body: string;
  sentAt: {
    _seconds: number;
    _nanoseconds: number;
  } | string;
  category?: string;
  priority?: 'normal' | 'high';
}

// Define API error type for better error handling
interface ApiError {
  message?: string;
  status?: number;
  response?: {
    data?: {
      message?: string;
      statusCode?: number;
    };
    status?: number;
  };
}

const AdminNotificationsScreen = () => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState('announcement'); // Default category
  const [receiverGroups, setReceiverGroups] = useState<string[]>([]);
  const [isHighPriority, setIsHighPriority] = useState(false);
  const [notificationHistory, setNotificationHistory] = useState<NotificationHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const navigation = useNavigation();
  const { user } = useAuth();
  
  // Load notification history on component mount
  useEffect(() => {
    fetchNotificationHistory();
  }, []);
  
  const fetchNotificationHistory = async () => {
    try {
      setIsLoadingHistory(true);
      const response = await api.get('/notifications?limit=10');
      setNotificationHistory(response.data);
    } catch (error) {
      console.error('Failed to fetch notification history:', error);
      // Don't show alert for this as it's not critical
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const sendNotification = async () => {
    // Validate input
    if (!title.trim() || !body.trim()) {
      Alert.alert('Error', 'Please enter both a title and message body');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'You must be logged in to send notifications');
      return;
    }

    try {
      setLoading(true);
      
      // Debug the auth token in dev mode
      if (__DEV__) {
        const token = await SecureStore.getItemAsync('accessToken');
        // eslint-disable-next-line no-console
        console.log(`Using auth token: ${token ? token.substring(0, 10) + '...' : 'none'}`);
      }
      
      // Check for valid sentBy - this is a common cause of server errors
      if (!user.id) {
        throw new Error('User ID is missing. Cannot send notification without a valid sender ID.');
      }
      
      // Prepare the notification payload
      const notificationPayload = {
        title,
        body,
        sentBy: user.id, // Required by backend
        category,
        priority: isHighPriority ? 'high' : 'normal',
        // Make data optional - it might be causing the 500 error
        ...(category ? {
          data: {
            category,
            timestamp: new Date().toISOString(),
          }
        } : {}),
        // Only include receiverGroups if it's non-empty
        ...(receiverGroups.length > 0 ? { receiverGroups } : {}),
      };
      
      // Log the payload in development for debugging
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.log('Sending notification with payload:', JSON.stringify(notificationPayload, null, 2));
      }
      
      // Call the backend API to send the notification
      const response = await api.post('/notifications', notificationPayload);
      
      // Notification sent successfully - check for warnings
      if (response.data?.fcmWarning) {
        // Show warning that notification was saved but not sent
        Alert.alert(
          'Partial Success',
          'The notification was saved to the database but could not be sent to devices due to FCM configuration issues. Please check your Firebase configuration.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        // Full success message
        Alert.alert(
          'Success',
          'Notification has been sent to all users',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
      
      // Clear the form
      setTitle('');
      setBody('');
      setIsHighPriority(false);
      setReceiverGroups([]);
      
      return true;
    } catch (error: unknown) {
      console.error('Failed to send notification:', error);
      // Show more detailed error to help debugging
      let errorMsg = 'Failed to send the notification. Please try again.';
      
      // Cast to ApiError for type safety
      const apiError = error as ApiError;
      
      // If we have error details, show them
      if (apiError?.response?.data?.message) {
        errorMsg += `\n\nError: ${apiError.response.data.message}`;
      } else if (apiError?.message) {
        errorMsg += `\n\nError: ${apiError.message}`;
      }
      
      // Also log the user role to help debug permission issues
      if (__DEV__) {
        // Only log in development
        // We'll use this during debugging and remove it later
        // eslint-disable-next-line no-console
        console.log('Current user role:', user?.role);
      }
      
      Alert.alert(
        'Error',
        errorMsg
      );
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Category selection buttons
  const categories = [
    { id: 'announcement', label: 'Announcement' },
    { id: 'emergency', label: 'Emergency' },
    { id: 'schedule_change', label: 'Schedule Change' },
    { id: 'promotion', label: 'Promotion' },
  ];
  
  // Receiver groups
  const availableGroups = [
    { id: 'all', label: 'All Users' },
    { id: 'vip', label: 'VIP' },
    { id: 'staff', label: 'Staff' },
    { id: 'artist', label: 'Artists' },
    { id: 'vendor', label: 'Vendors' },
  ];
  
  const toggleReceiverGroup = (groupId: string) => {
    if (groupId === 'all') {
      // If "All Users" is selected, clear other selections
      setReceiverGroups([]);
      return;
    }
    
    setReceiverGroups(current => {
      // Check if this group is already selected
      const isSelected = current.includes(groupId);
      
      if (isSelected) {
        // Remove from selection
        return current.filter(id => id !== groupId);
      } else {
        // Add to selection and remove 'all' if it exists
        return [...current.filter(id => id !== 'all'), groupId];
      }
    });
  };

  // Modify the send notification function to refresh history after sending
  const sendNotificationAndRefresh = async () => {
    const success = await sendNotification();
    // After successfully sending, refresh the notification history
    if (success) {
      fetchNotificationHistory();
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.header}>
            <Text style={styles.heading}>Send Push Notification</Text>
            <Text style={styles.subheading}>
              This will send a notification to all users who have enabled notifications
            </Text>
            {/* Debug info - Only in DEV mode */}
            {__DEV__ && (
              <View style={styles.debugContainer}>
                <TouchableOpacity
                  style={styles.debugButton}
                  onPress={() => {
                    // Display user info for debugging
                    Alert.alert(
                      'User Role Info',
                      `User ID: ${user?.id || 'None'}\nRole: ${user?.role || 'None'}\nEmail: ${user?.email || 'None'}`
                    );
                  }}
                >
                  <Text style={styles.debugButtonText}>Debug User Role</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.debugButton, { backgroundColor: '#4682B4' }]}
                  onPress={() => showTokenDebugInfo()}
                >
                  <Text style={styles.debugButtonText}>Check Token</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.debugButton, { backgroundColor: '#2E8B57' }]}
                  onPress={() => compareRoles(user?.role)}
                >
                  <Text style={styles.debugButtonText}>Compare Roles</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.debugButton, { backgroundColor: '#8B008B' }]}
                  onPress={async () => {
                    try {
                      // Try sending a minimal notification for debugging
                      const minimalPayload = {
                        title: 'Test Notification',
                        body: 'This is a minimal test notification',
                        sentBy: user?.id // Required field
                      };
                      
                      // eslint-disable-next-line no-console
                      console.log('Sending minimal notification:', minimalPayload);
                      
                      const response = await api.post('/notifications', minimalPayload);
                      Alert.alert('Success', 'Minimal notification sent successfully');
                      // eslint-disable-next-line no-console
                      console.log('Response:', response.data);
                    } catch (error) {
                      // eslint-disable-next-line no-console
                      console.error('Error sending minimal notification:', error);
                      Alert.alert('Failed', 'Error sending minimal notification');
                    }
                  }}
                >
                  <Text style={styles.debugButtonText}>Test Minimal</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.debugButton, { backgroundColor: '#006400' }]}
                  onPress={async () => {
                    try {
                      // Try sending a notification with hard-coded values to bypass potential issues
                      const bareMinimalPayload = {
                        title: 'Emergency Test',
                        body: 'This is an emergency test notification',
                        sentBy: 'admin' // Using string instead of user ID
                      };
                      
                      // eslint-disable-next-line no-console
                      console.log('Sending bare minimal notification:', bareMinimalPayload);
                      
                      const response = await api.post('/notifications', bareMinimalPayload);
                      Alert.alert('Success', 'Bare minimal notification sent successfully');
                      // eslint-disable-next-line no-console
                      console.log('Response:', response.data);
                    } catch (error) {
                      // eslint-disable-next-line no-console
                      console.error('Error sending bare minimal notification:', error);
                      Alert.alert('Failed', 'Error sending bare minimal notification. The issue is likely on the backend.');
                    }
                  }}
                >
                  <Text style={styles.debugButtonText}>Bare Minimal</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.debugButton, { backgroundColor: '#483D8B' }]}
                  onPress={async () => {
                    try {
                      // Call the token count debug endpoint
                      Alert.alert('Checking', 'Fetching token count from server...');
                      const response = await api.get('/debug/notifications/token-count');
                      
                      if (response.data.count === 0) {
                        Alert.alert(
                          'No Push Tokens Found', 
                          'There are no push tokens registered in the system. This is likely why notifications are failing.'
                        );
                      } else {
                        Alert.alert(
                          'Push Tokens Found',
                          `Found ${response.data.count} registered device tokens.\n\nTokens by platform:\nAndroid: ${response.data.android || 0}\niOS: ${response.data.ios || 0}\nWeb: ${response.data.web || 0}`
                        );
                      }
                    } catch (error: unknown) {
                      // eslint-disable-next-line no-console
                      console.error('Error checking token count:', error);
                      
                      // Type guard for Axios errors
                      if (error && typeof error === 'object' && 'response' in error && 
                          error.response && typeof error.response === 'object' &&
                          'status' in error.response && error.response.status === 404) {
                        Alert.alert(
                          'Debug Endpoint Not Available',
                          'The debug endpoint is not available. Did you add the DebugModule to your backend?'
                        );
                      } else {
                        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
                        Alert.alert('Error', `Failed to check token count: ${errorMessage}`);
                      }
                    }
                  }}
                >
                  <Text style={styles.debugButtonText}>Check Tokens</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.debugButton, { backgroundColor: '#8A2BE2' }]}
                  onPress={async () => {
                    try {
                      // Call the check FCM config endpoint
                      Alert.alert('Checking', 'Verifying Firebase Cloud Messaging configuration...');
                      const response = await api.get('/debug/notifications/fcm-config');
                      
                      if (response.data.initialized) {
                        Alert.alert(
                          'FCM Configuration Valid', 
                          `Firebase Cloud Messaging is properly initialized.\n\n${response.data.note || ''}`
                        );
                      } else {
                        Alert.alert(
                          'FCM Configuration Issue',
                          `Firebase Cloud Messaging is not properly initialized.\n\nError: ${response.data.error || 'Unknown error'}\n\nPossible solution: Make sure your service account has the "Firebase Cloud Messaging Admin" role in the Google Cloud Console.`
                        );
                      }
                    } catch (error: unknown) {
                      // eslint-disable-next-line no-console
                      console.error('Error checking FCM configuration:', error);
                      
                      // Type guard for Axios errors
                      if (error && typeof error === 'object' && 'response' in error && 
                          error.response && typeof error.response === 'object' &&
                          'status' in error.response && error.response.status === 404) {
                        Alert.alert(
                          'Debug Endpoint Not Available',
                          'The FCM config debug endpoint is not available. Did you add the NotificationsDebugController to your backend?'
                        );
                      } else {
                        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
                        Alert.alert('Error', `Failed to check FCM configuration: ${errorMessage}`);
                      }
                    }
                  }}
                >
                  <Text style={styles.debugButtonText}>Check FCM Config</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.formContainer}>
            {/* Category Selection */}
            <Text style={styles.label}>Notification Type:</Text>
            <View style={styles.categoryContainer}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryButton,
                    category === cat.id && styles.categoryButtonActive,
                  ]}
                  onPress={() => setCategory(cat.id)}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      category === cat.id && styles.categoryTextActive,
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            {/* Priority Toggle */}
            <View style={styles.settingRow}>
              <Text style={styles.label}>High Priority</Text>
              <Switch
                value={isHighPriority}
                onValueChange={setIsHighPriority}
                trackColor={{ false: '#CCCCCC', true: '#3498db' }}
                thumbColor='#FFFFFF'
              />
            </View>
            <Text style={styles.settingDescription}>
              High priority notifications will appear more prominently on user devices
            </Text>
            
            {/* Receiver Groups Selection */}
            <Text style={styles.label}>Target Audience:</Text>
            <View style={styles.categoryContainer}>
              {availableGroups.map((group) => {
                // Check if this group is selected or if it's "All Users" and no specific groups are selected
                const isSelected = group.id === 'all' ? 
                  receiverGroups.length === 0 : 
                  receiverGroups.includes(group.id);
                  
                return (
                  <TouchableOpacity
                    key={group.id}
                    style={[
                      styles.categoryButton,
                      isSelected && styles.categoryButtonActive,
                    ]}
                    onPress={() => toggleReceiverGroup(group.id)}
                  >
                    <Text
                      style={[
                        styles.categoryText,
                        isSelected && styles.categoryTextActive,
                      ]}
                    >
                      {group.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={styles.settingDescription}>
              {receiverGroups.length === 0 ? 
                'Notification will be sent to all users' : 
                'Notification will only be sent to selected groups'}
            </Text>

            <Text style={styles.label}>Title:</Text>
            <TextInput
              style={styles.input}
              placeholder="Notification Title"
              value={title}
              onChangeText={setTitle}
              maxLength={100}
            />
            <Text style={styles.characterCount}>{title.length}/100</Text>

            <Text style={styles.label}>Message:</Text>
            <TextInput
              style={styles.textarea}
              placeholder="Notification message body"
              value={body}
              onChangeText={setBody}
              multiline
              numberOfLines={5}
              maxLength={500}
            />
            <Text style={styles.characterCount}>{body.length}/500</Text>

            <TouchableOpacity
              style={[styles.button, (!title || !body || loading) && styles.buttonDisabled]}
              onPress={() => {
                // Show confirmation dialog with notification details
                Alert.alert(
                  'Confirm Notification',
                  `Are you sure you want to send this notification?\n\nTitle: ${title}\n\nMessage: ${body}\n\nPriority: ${isHighPriority ? 'High' : 'Normal'}\n\nAudience: ${receiverGroups.length === 0 ? 'All Users' : receiverGroups.join(', ')}`,
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Send', style: 'destructive', onPress: sendNotificationAndRefresh }
                  ]
                )
              }}
              disabled={!title || !body || loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>
                  {receiverGroups.length === 0 ? 'Send to All Users' : 'Send to Selected Groups'}
                </Text>
              )}
            </TouchableOpacity>
            
            {/* Notification History Section */}
            <View style={styles.historySection}>
              <Text style={styles.historyTitle}>Recent Notifications</Text>
              
              {isLoadingHistory ? (
                <ActivityIndicator style={styles.historyLoader} />
              ) : notificationHistory.length > 0 ? (
                notificationHistory.map((item) => (
                  <NotificationHistoryItem
                    key={item.id}
                    title={item.title}
                    body={item.body}
                    sentAt={typeof item.sentAt === 'string' ? item.sentAt : item.sentAt._seconds ? new Date(item.sentAt._seconds * 1000).toISOString() : new Date().toISOString()}
                    category={item.category}
                    priority={item.priority}
                  />
                ))
              ) : (
                <Text style={styles.noHistoryText}>No recent notifications found</Text>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContainer: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subheading: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 12,
  },
  debugContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 8,
  },
  debugButton: {
    backgroundColor: '#FF6347',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  debugButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
    fontSize: 12,
  },
  formContainer: {
    width: '100%',
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#F9F9F9',
    marginBottom: 4,
  },
  textarea: {
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#F9F9F9',
    marginBottom: 4,
    height: 120,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    color: '#888888',
    textAlign: 'right',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#3498db',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    gap: 8,
  },
  categoryButton: {
    borderWidth: 1,
    borderColor: '#3498db',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  categoryButtonActive: {
    backgroundColor: '#3498db',
  },
  categoryText: {
    color: '#3498db',
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
    paddingVertical: 8,
  },
  settingDescription: {
    fontSize: 14,
    color: '#888888',
    marginBottom: 16,
  },
  historySection: {
    marginTop: 32,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  historyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  historyLoader: {
    marginVertical: 20,
  },
  noHistoryText: {
    fontSize: 16,
    color: '#888888',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 20,
  },
});

export default AdminNotificationsScreen;