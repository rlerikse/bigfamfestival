// filepath: e:\repos\bigfamfestival\mobile\src\components\EventDetailsModal.tsx
import React from 'react';
import { Modal, View, Text, Image, TouchableOpacity, StyleSheet, Linking, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScheduleEvent } from '../types/event';

// Extended interface for events with social media properties
interface EventWithSocial extends ScheduleEvent {
  soundcloud_url?: string;
  facebook_url?: string;
  instagram_url?: string;
  spotify_url?: string;
}

interface EventDetailsModalProps {
  isVisible: boolean;
  onClose: () => void;
  event: ScheduleEvent | null;
  isInSchedule: boolean;
  onToggleSchedule: (event: ScheduleEvent) => void;
}

const formatTime = (timeString: string) => {
  // Handle time strings in "HH:MM" format directly, without need for Date object
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours, 10);
  const period = hour >= 12 ? 'PM' : 'AM';
  const formattedHour = hour % 12 || 12; // Convert 0 to 12 for 12 AM
  return `${formattedHour}:${minutes} ${period}`;
};

const formatDate = (dateString: string) => {
  // Format date (YYYY-MM-DD) to a more readable format
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    // Format: "Sunday, September 28, 2025"
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  } catch (error) {
    console.error("Error formatting date:", error);
    return dateString; // Return original string if there's an error
  }
};

const getFullImageUrl = (imagePath?: string) => {
  if (!imagePath) {
    return 'https://via.placeholder.com/300x200.png?text=No+Image'; // Default placeholder
  }

  if (imagePath.startsWith('gs://')) {
    const gsPath = imagePath.substring(5);
    const firstSlashIndex = gsPath.indexOf('/');
    if (firstSlashIndex > 0) {
      const bucket = gsPath.substring(0, firstSlashIndex);
      const objectPath = gsPath.substring(firstSlashIndex + 1);
      return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(objectPath)}?alt=media`;
    }
    // Fallback for malformed gs:// path
    return 'https://via.placeholder.com/300x200.png?text=Invalid+Image+Path';
  } else if (imagePath.startsWith('http')) { // Handles http and https
    return imagePath;
  } else {
    // Assume S3 path if not gs:// or http(s)
    return `https://big-fam-app.S3.us-east-2.amazonaws.com/${imagePath}`;
  }
};

const EventDetailsModal: React.FC<EventDetailsModalProps> = ({
  isVisible,
  onClose,
  event,
  isInSchedule,
  onToggleSchedule,
}) => {
  if (!event) {
    return null;
  }

  const handleSocialLink = (url: string | undefined) => {
    if (!url) return;
    Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <ScrollView contentContainerStyle={styles.scrollContentContainer}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            
            <View style={styles.imageContainer}>
              <Image 
                source={{ uri: getFullImageUrl(event.imageUrl) }} 
                style={styles.eventImage} 
              />
              <View style={styles.gradientOverlay}>
                <Text style={styles.eventName}>{event.name}</Text>
              </View>
            </View>
            
            <View style={styles.contentContainer}>
              <TouchableOpacity 
                onPress={() => Linking.openURL(`big-fam://map?stage=${encodeURIComponent(event.stage)}`)}
              >
                <Text style={styles.stageText}>{event.stage}</Text>
              </TouchableOpacity>
              
              <Text style={styles.timeText}>
                {formatTime(event.startTime)} - {formatTime(event.endTime)}
              </Text>
              
              <Text style={styles.dateText}>
                {formatDate(event.date)}
              </Text>
              
              <Text style={styles.bioText}>{event.description || "No description available"}</Text>
              
              <View style={styles.actionsContainer}>
                <View style={styles.socialIconsContainer}>
                  {(event as EventWithSocial).soundcloud_url && (
                    <TouchableOpacity 
                      onPress={() => handleSocialLink((event as EventWithSocial).soundcloud_url)} 
                      style={styles.socialIcon}
                    >
                      <Ionicons name="logo-soundcloud" size={24} color="#fff" />
                    </TouchableOpacity>
                  )}
                  
                  {(event as EventWithSocial).facebook_url && (
                    <TouchableOpacity 
                      onPress={() => handleSocialLink((event as EventWithSocial).facebook_url)} 
                      style={styles.socialIcon}
                    >
                      <Ionicons name="logo-facebook" size={24} color="#fff" />
                    </TouchableOpacity>
                  )}
                  
                  {(event as EventWithSocial).instagram_url && (
                    <TouchableOpacity 
                      onPress={() => handleSocialLink((event as EventWithSocial).instagram_url)} 
                      style={styles.socialIcon}
                    >
                      <Ionicons name="logo-instagram" size={24} color="#fff" />
                    </TouchableOpacity>
                  )}
                  
                  {(event as EventWithSocial).spotify_url && (
                    <TouchableOpacity 
                      onPress={() => handleSocialLink((event as EventWithSocial).spotify_url)} 
                      style={styles.socialIcon}
                    >
                      <Ionicons name="musical-notes" size={24} color="#fff" />
                    </TouchableOpacity>
                  )}
                </View>
                <TouchableOpacity 
                  onPress={() => onToggleSchedule(event)} 
                  style={styles.heartButton}
                >
                  <Ionicons 
                    name={isInSchedule ? "heart" : "heart-outline"} 
                    size={24} 
                    color={isInSchedule ? "red" : "#fff"} 
                  />
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxHeight: '85%',
    backgroundColor: '#222', // Dark background for the modal
    borderRadius: 15,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#444',
  },
  scrollContentContainer: {
    paddingBottom: 20, // Ensure space for last elements
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 8,
    borderRadius: 20,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 300, // Taller image for the top half
  },
  eventImage: {
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 90, // Adjusted height: 120px - 30px (10% of 300px image height)
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
    paddingBottom: 10,
  },
  contentContainer: {
    padding: 20,
  },
  eventName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    paddingHorizontal: 15,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10
  },
  stageText: {
    fontSize: 18,
    color: '#ccc',
    marginBottom: 10,
    fontStyle: 'italic',
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  dateText: {
    fontSize: 16,
    color: '#ccc',
    fontStyle: 'italic',
    marginBottom: 15, // Adjusted margin
    textAlign: 'center',
  },
  timeText: {
    fontSize: 22,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 5, // Adjusted margin
    textAlign: 'center',
  },
  bioText: {
    fontSize: 15,
    color: '#ddd',
    lineHeight: 22,
    fontStyle: 'italic',
    marginTop: 10,
    textAlign: 'center', // Added textAlign center
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between', // Align items to space them out
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#444',
  },
  heartButton: {
    padding: 10,
    // Removed marginLeft: 'auto' as justifyContent: 'space-between' on parent handles it
  },
  socialIconsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start', 
    alignItems: 'center',
    // Removed marginLeft as actionsContainer now handles spacing
  },
  socialIcon: {
    marginHorizontal: 10, // Space between social icons
  },
});

export default EventDetailsModal;
