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

const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
};

const getFullImageUrl = (imagePath?: string) => {
  if (!imagePath) {
    return 'https://via.placeholder.com/300x200.png?text=No+Image';
  }
  return `https://big-fam-app.S3.us-east-2.amazonaws.com/${imagePath}`;
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

  const handleSocialLink = (url: string) => {
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
          <ScrollView contentContainerStyle={styles.scrollContentContainer}>            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <Image source={{ uri: getFullImageUrl(event.imageUrl) }} style={styles.eventImage} />
            <View style={styles.contentContainer}>
              <Text style={styles.eventName}>{event.name}</Text>
              <Text style={styles.eventDetailText}>Stage: {event.stage}</Text>
              <Text style={styles.eventDetailText}>
                Time: {formatTime(event.startTime)} - {formatTime(event.endTime)}
              </Text>
              <Text style={styles.bioHeaderText}>Bio:</Text>
              <Text style={styles.bioText}>{event.description}</Text>
              <View style={styles.actionsContainer}>                <TouchableOpacity onPress={() => onToggleSchedule(event)} style={styles.heartButton}>
                  <Ionicons name={isInSchedule ? "heart" : "heart-outline"} size={24} color={isInSchedule ? "red" : "#fff"} />
                </TouchableOpacity>
                <View style={styles.socialIconsContainer}>                  {(event as EventWithSocial).soundcloud_url && (
                    <TouchableOpacity onPress={() => handleSocialLink((event as EventWithSocial).soundcloud_url!)} style={styles.socialIcon}>
                      <Ionicons name="logo-soundcloud" size={24} color="#fff" />
                    </TouchableOpacity>
                  )}
                  {(event as EventWithSocial).facebook_url && (
                    <TouchableOpacity onPress={() => handleSocialLink((event as EventWithSocial).facebook_url!)} style={styles.socialIcon}>
                      <Ionicons name="logo-facebook" size={24} color="#fff" />
                    </TouchableOpacity>
                  )}
                  {(event as EventWithSocial).instagram_url && (
                    <TouchableOpacity onPress={() => handleSocialLink((event as EventWithSocial).instagram_url!)} style={styles.socialIcon}>
                      <Ionicons name="logo-instagram" size={24} color="#fff" />
                    </TouchableOpacity>
                  )}
                  {(event as EventWithSocial).spotify_url && (
                    <TouchableOpacity onPress={() => handleSocialLink((event as EventWithSocial).spotify_url!)} style={styles.socialIcon}>
                      <Ionicons name="musical-notes" size={24} color="#fff" />
                    </TouchableOpacity>
                  )}
                </View>
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
  eventImage: {
    width: '100%',
    height: 250, // Larger image
  },
  contentContainer: {
    padding: 20,
  },
  eventName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  eventDetailText: {
    fontSize: 18,
    color: '#ccc',
    marginBottom: 8,
  },
  bioHeaderText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 15,
    marginBottom: 5,
  },
  bioText: {
    fontSize: 16,
    color: '#ddd',
    lineHeight: 22,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#444',
  },
  heartButton: {
    padding: 10,
  },
  socialIconsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start', // Align to the start, next to heart
    alignItems: 'center',
    marginLeft: 15, // Space between heart and social icons
  },
  socialIcon: {
    marginHorizontal: 10, // Space between social icons
  },
});

export default EventDetailsModal;
