import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useAppSettings } from '../contexts/AppSettingsContext';
import { updateUserProfile, uploadProfilePicture } from '../services/userService';
import TopNavBar from '../components/TopNavBar';

const ProfileScreen = () => {
  const { user, updateUser, logout } = useAuth();
  const { theme, isDark } = useTheme();
  const { scheduleNotificationsEnabled, toggleScheduleNotifications, globalNotificationsEnabled, toggleGlobalNotifications } = useAppSettings();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  // Sharing preferences - commented out for later implementation
  // const [shareMyCampsite, setShareMyCampsite] = useState(user?.shareMyCampsite || false);
  // const [shareMyLocation, setShareMyLocation] = useState(user?.shareMyLocation || false);
  const [profileImage, setProfileImage] = useState<string | null>(user?.profilePictureUrl || null);
  const [isImageUploading, setIsImageUploading] = useState(false);

  const handleEditToggle = () => {
    if (isEditing) {
      // Save changes
      handleSaveProfile();
    }
    setIsEditing(!isEditing);
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const updatedData = {
        name,
        phone,
        // Sharing preferences commented out
        // shareMyCampsite,
        // shareMyLocation,
      };
      
      await updateUserProfile(user.id, updatedData);
      
      // Update user context
      updateUser(updatedData);
      
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Update Failed', 'Could not update profile. Please try again.');
    } finally {
      setIsLoading(false);
      setIsEditing(false);
    }
  };

  const handleSelectProfileImage = async () => {
    if (!user) return;
    
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your photo library to change your profile picture.');
      return;
    }
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const selectedImage = result.assets[0];
      
      setIsImageUploading(true);
      try {
        const imageUrl = await uploadProfilePicture(user.id, selectedImage.uri);
        setProfileImage(imageUrl);
        updateUser({ profilePictureUrl: imageUrl });
      } catch (error) {
        console.error('Error uploading profile picture:', error);
        Alert.alert('Upload Failed', 'Could not upload profile picture. Please try again.');
      } finally {
        setIsImageUploading(false);
      }
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: () => logout() },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <TopNavBar whiteIcons={isDark} />
  <ScrollView contentContainerStyle={[styles.content, { paddingTop: 100 }]}> 

        <View style={styles.profileImageContainer}>
          <View style={[styles.profileImageWrapper, { borderColor: theme.border }]}>
            {isImageUploading ? (
              <ActivityIndicator size="large" color={theme.primary} />
            ) : profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.profileImage} />
            ) : (
              <View style={[styles.profileImagePlaceholder, { backgroundColor: theme.muted }]}>
                <Text style={styles.profileImagePlaceholderText}>
                  {user?.name ? user.name.charAt(0).toUpperCase() : '?'}
                </Text>
              </View>
            )}
          </View>
          {isEditing && (
            <TouchableOpacity
              style={[styles.changePhotoButton, { backgroundColor: theme.primary }]}
              onPress={handleSelectProfileImage}
            >
              <Text style={styles.changePhotoButtonText}>Change Photo</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.infoContainer}>
          <View style={[styles.infoSection, { borderColor: theme.border }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Account Information</Text>
              <TouchableOpacity
                style={[styles.editButton, isEditing && { backgroundColor: theme.primary }]}
                onPress={handleEditToggle}
                disabled={isLoading}
              >
                {isEditing ? (
                  <Text style={[styles.editButtonText, { color: '#FFFFFF' }]}>Save</Text>
                ) : (
                  <Ionicons name="pencil" size={22} color={isDark ? '#FFFFFF' : theme.primary} />
                )}
              </TouchableOpacity>
            </View>
            
            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: theme.muted }]}>Name</Text>
              {isEditing ? (
                <TextInput
                  style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter your name"
                  placeholderTextColor={theme.muted}
                />
              ) : (
                <Text style={[styles.fieldValue, { color: theme.text }]}>{user?.name}</Text>
              )}
            </View>
            
            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: theme.muted }]}>Email</Text>
              <Text style={[styles.fieldValue, { color: theme.text }]}>{user?.email}</Text>
            </View>
            
            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: theme.muted }]}>Phone</Text>
              {isEditing ? (
                <TextInput
                  style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="Enter your phone number"
                  placeholderTextColor={theme.muted}
                  keyboardType="phone-pad"
                />
              ) : (
                <Text style={[styles.fieldValue, { color: theme.text }]}>{user?.phone || 'Not set'}</Text>
              )}
            </View>
            
            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: theme.muted }]}>Ticket Type</Text>
              <Text style={[styles.fieldValue, { color: theme.text }]}>{user?.ticketType || 'Need Ticket'}</Text>
            </View>
            
            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: theme.muted }]}>Role</Text>
              <Text style={[styles.fieldValue, { color: theme.text }]}>
                {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Attendee'}
              </Text>
            </View>
          </View>

          <View style={[styles.infoSection, { borderColor: theme.border }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Notification Preferences</Text>

            {user && user.id !== 'guest-user' ? (
              <>
                <View style={styles.switchField}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <Ionicons name="calendar-outline" size={20} color={theme.primary} style={{ marginRight: 8 }} />
                    <Text style={[styles.fieldLabel, { color: theme.text }]}>Schedule Notifications</Text>
                  </View>
                  <Switch
                    value={scheduleNotificationsEnabled}
                    onValueChange={toggleScheduleNotifications}
                    trackColor={{ false: theme.border, true: theme.primary }}
                    thumbColor={'#FFFFFF'}
                  />
                </View>
                <Text style={[styles.switchDescription, { color: theme.muted }]}> 
                  Get notified 15 minutes before events in your schedule
                </Text>

                <View style={styles.switchField}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <Ionicons name="globe-outline" size={20} color={theme.primary} style={{ marginRight: 8 }} />
                    <Text style={[styles.fieldLabel, { color: theme.text }]}>Global Notifications</Text>
                  </View>
                  <Switch
                    value={globalNotificationsEnabled}
                    onValueChange={toggleGlobalNotifications}
                    trackColor={{ false: theme.border, true: theme.primary }}
                    thumbColor={'#FFFFFF'}
                  />
                </View>
                <Text style={[styles.switchDescription, { color: theme.muted }]}> 
                  Enable to receive public festival-wide notifications and announcements
                </Text>
              </>
            ) : (
              <Text style={[styles.switchDescription, { color: theme.muted }]}> 
                Login with an account to enable notification preferences
              </Text>
            )}
          </View>

          {/* Sharing Preferences - commented out for later implementation
          <View style={[styles.infoSection, { borderColor: theme.border }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Sharing Preferences</Text>
            
            <View style={styles.switchField}>
              <Text style={[styles.fieldLabel, { color: theme.text }]}>Share My Campsite</Text>
              <Switch
                value={shareMyCampsite}
                onValueChange={setShareMyCampsite}
                disabled={!isEditing}
                trackColor={{ false: theme.border, true: theme.primary }}
                thumbColor={'#FFFFFF'}
              />
            </View>
            
            <Text style={[styles.switchDescription, { color: theme.muted }]}>
              When enabled, your campsite location will be visible to your friends
            </Text>
            
            <View style={styles.switchField}>
              <Text style={[styles.fieldLabel, { color: theme.text }]}>Share My Location</Text>
              <Switch
                value={shareMyLocation}
                onValueChange={setShareMyLocation}
                disabled={!isEditing}
                trackColor={{ false: theme.border, true: theme.primary }}
                thumbColor={'#FFFFFF'}
              />
            </View>
            
            <Text style={[styles.switchDescription, { color: theme.muted }]}>
              When enabled, your real-time location will be visible to your friends
            </Text>
          </View>
          */}

          <TouchableOpacity
            style={[styles.logoutButton, { borderColor: theme.border }]}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={22} color={theme.error} />
            <Text style={[styles.logoutButtonText, { color: theme.error }]}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 36,
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  editButtonText: {
    fontWeight: '600',
  },
  profileImageContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  profileImageWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  profileImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImagePlaceholderText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  changePhotoButton: {
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  changePhotoButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  infoContainer: {
    width: '100%',
  },
  infoSection: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  field: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  fieldValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
  },
  switchField: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  switchDescription: {
    fontSize: 13,
    marginBottom: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ProfileScreen;
