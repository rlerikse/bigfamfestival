// Show logo.png from assets/images if event image fails to load
const EventImageWithFallback: React.FC<{ imageUrl?: string; style?: object }> = ({ imageUrl, style }) => {
  const [error, setError] = React.useState(false);
  if (!imageUrl || error) {
    return (
      <Image
        source={require('../assets/images/bf-logo-trans.png')}
        style={style}
        resizeMode="contain"
      />
    );
  }
  return (
    <Image
      source={{ uri: getFullImageUrl(imageUrl) }}
      style={style}
      resizeMode="cover"
      onError={() => setError(true)}
    />
  );
};
// filepath: e:\repos\bigfamfestival\mobile\src\components\EventDetailsModal.tsx
import React from 'react';
import { Modal, View, Text, Image, TouchableOpacity, StyleSheet, Linking, ScrollView, TextProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScheduleEvent } from '../types/event';

// Debug logging utility for this component
const debugLog = (message: string, data?: any) => {
  // Basic console log, can be enhanced (e.g., with a logging library or conditional logging)
  console.log(`[EventDetailsModal DEBUG] ${message}`, data !== undefined ? data : '');
};

// Local SafeText component for robust text rendering
interface SafeTextProps extends TextProps {
  children: React.ReactNode;
}

const SafeText: React.FC<SafeTextProps> = ({ children, ...props }) => {
  const processChildren = (childNodes: React.ReactNode): React.ReactNode => {
    return React.Children.map(childNodes, (child, index) => {
      if (child === null || typeof child === 'undefined') {
        return null; // React <Text> can handle null children (renders nothing)
      }
      if (typeof child === 'string' || typeof child === 'number') {
        return child; // Strings and numbers are safe
      }
      // If the child is a React element
      if (React.isValidElement(child)) {
        // If the element is already a <Text> component, allow it.
        // This allows for nested <Text> components for varied styling.
        if (child.type === Text) {
          // It's already a Text component, so it's safe.
          // We might want to recursively process its children if it contains non-text elements,
          // but for now, assume nested Text is used correctly.
          return child;
        }
        // For any other type of element (View, Image, Icon etc.), it's not safe
        // to render it directly inside our parent <Text>. Convert to string.
        const elementName = typeof child.type === 'string' ? child.type : (child.type as any)?.displayName || (child.type as any)?.name || 'UnknownElement';
        debugLog(`SafeText: Child at index ${index} is an unsafe React element <${elementName}>. Converting to string.`, { child });
        return `[Element: ${elementName}]`; // Placeholder string for unsafe elements
      }
      
      // For other complex types (arrays, objects not elements, booleans), convert to string.
      let fallbackText = '';
      if (Array.isArray(child)) {
        // Recursively process array elements to make them safe for Text
        fallbackText = `[Array: ${child.map(c => typeof c === 'string' || typeof c === 'number' ? c : String(c)).join(', ')}]`;
        debugLog(`SafeText: Child at index ${index} is an Array. Converting to string.`, { originalChild: child, stringified: fallbackText });
      } else if (typeof child === 'object' && child !== null) {
        try {
          fallbackText = JSON.stringify(child);
          debugLog(`SafeText: Child at index ${index} is an Object. Stringified.`, { originalChild: child, stringified: fallbackText });
        } catch (e) {
          fallbackText = "[Object]";
          debugLog(`SafeText: Child at index ${index} is an Object. Failed to stringify.`, { originalChild: child, error: e });
        }
      } else if (typeof child === 'boolean') {
        fallbackText = String(child);
        debugLog(`SafeText: Child at index ${index} is a Boolean. Converting to string.`, { originalChild: child, stringified: fallbackText });
      } else {
        // Catch-all for any other unexpected types
        fallbackText = String(child);
        debugLog(`SafeText: Child at index ${index} is of unknown type. Converting to string.`, { originalChild: child, type: typeof child, stringified: fallbackText });
      }
      return fallbackText;
    });
  };

  try {
    const safeChildren = processChildren(children);
    return <Text {...props}>{safeChildren}</Text>;
  } catch (e: any) {
    debugLog('SafeText CRITICAL ERROR during rendering:', { error: e.message, originalChildren: children });
    // Provide a fallback style if props.style is problematic
    const fallbackStyle = props.style && typeof props.style === 'object' ? props.style : {};
    return <Text {...props} style={[{color: 'red'}, fallbackStyle]}>ERR</Text>;
  }
};


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

const formatTime = (timeString: string | undefined) => {
  if (!timeString) {
    debugLog('formatTime: Received undefined or empty timeString');
    return 'N/A';
  }

  try {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const period = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12; // Convert 0 to 12 for 12 AM
    return `${formattedHour}:${minutes} ${period}`;
  } catch (error) {
    debugLog('formatTime: Error formatting time', { timeString, error });
    return timeString; // Return original if error
  }
};

const formatDate = (dateString: string | undefined) => {
  if (!dateString) {
    debugLog('formatDate: Received undefined or empty dateString');
    return 'Date N/A';
  }
  
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
    debugLog('getFullImageUrl: imagePath is undefined or empty, using default placeholder.');
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
    debugLog('getFullImageUrl: Malformed gs:// path, using fallback placeholder.', { imagePath });
    // Fallback for malformed gs:// path
    return 'https://via.placeholder.com/300x200.png?text=Invalid+Image+Path';
  } else if (imagePath.startsWith('http')) { // Handles http and https
    return imagePath;
  } else {
    debugLog('getFullImageUrl: Assuming S3 path.', { imagePath });
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
  // Ensure event properties used for display are strings or provide fallbacks
  const eventName = typeof event.name === 'string' ? event.name : "Event Name N/A";
  const eventStage = typeof event.stage === 'string' ? event.stage : "Stage N/A";
  const startTimeFormatted = formatTime(event.startTime);
  const endTimeFormatted = formatTime(event.endTime ?? undefined);
  const dateFormatted = formatDate(event.date);
  const description = typeof event.description === 'string' ? event.description : "No description available";


  debugLog('Rendering EventDetailsModal for:', { eventName: eventName, eventId: event.id });

  const handleSocialLink = (url: string | undefined) => {
    if (!url) {
      debugLog('handleSocialLink: URL is undefined or empty.');
      return;
    }
    debugLog('handleSocialLink: Attempting to open URL:', { url });
    Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
  };

  try {

    // Variables eventName, eventStage, etc. are already defined above with fallbacks

    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={isVisible}
        onRequestClose={() => {
          debugLog('Modal onRequestClose triggered.');
          onClose();
        }}
      >
        <View style={styles.overlay}>
          <View style={styles.modalContainer}>
            <ScrollView contentContainerStyle={styles.scrollContentContainer}>
              <TouchableOpacity style={styles.closeButton} onPress={() => {
                debugLog('Close button pressed.');
                onClose();
              }}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
              <View style={styles.imageContainer}>
                <EventImageWithFallback imageUrl={event.imageUrl} style={styles.eventImage} />
                <View style={styles.gradientOverlay}>
                  <SafeText style={styles.eventName}>{eventName}</SafeText>
                </View>
              </View>
              
              <View style={styles.contentContainer}>
                <TouchableOpacity 
                  onPress={() => {
                    const stageToEncode = typeof event.stage === 'string' ? event.stage : "Unknown Stage";
                    const mapUrl = `big-fam://map?stage=${encodeURIComponent(stageToEncode)}`;
                    debugLog('Stage link pressed, attempting to open URL:', { mapUrl });
                    Linking.openURL(mapUrl).catch(err => debugLog("Couldn't load map page", {url: mapUrl, err}));
                  }}
                >
                  <SafeText style={styles.stageText}>{eventStage}</SafeText>
                </TouchableOpacity>
                
                <SafeText style={styles.timeText}>
                  {/* Ensure the combined string is safe */}
                  {`${String(startTimeFormatted)} - ${String(endTimeFormatted)}`}
                </SafeText>
                
                <SafeText style={styles.dateText}>
                  {dateFormatted}
                </SafeText>
                
                <SafeText style={styles.bioText}>{description}</SafeText>
                
                <View style={styles.actionsContainer}>
                  <View style={styles.socialIconsContainer}>
                    {/* Social links remain the same, ensure URLs are strings */}
                    {(event as EventWithSocial).soundcloud_url && typeof (event as EventWithSocial).soundcloud_url === 'string' && (
                      <TouchableOpacity 
                        onPress={() => handleSocialLink((event as EventWithSocial).soundcloud_url)} 
                        style={styles.socialIcon}
                      >
                        <Ionicons name="logo-soundcloud" size={24} color="#fff" />
                      </TouchableOpacity>
                    )}
                    
                    {(event as EventWithSocial).facebook_url && typeof (event as EventWithSocial).facebook_url === 'string' && (
                      <TouchableOpacity 
                        onPress={() => handleSocialLink((event as EventWithSocial).facebook_url)} 
                        style={styles.socialIcon}
                      >
                        <Ionicons name="logo-facebook" size={24} color="#fff" />
                      </TouchableOpacity>
                    )}
                    
                    {(event as EventWithSocial).instagram_url && typeof (event as EventWithSocial).instagram_url === 'string' && (
                      <TouchableOpacity 
                        onPress={() => handleSocialLink((event as EventWithSocial).instagram_url)} 
                        style={styles.socialIcon}
                      >
                        <Ionicons name="logo-instagram" size={24} color="#fff" />
                      </TouchableOpacity>
                    )}
                    
                    {(event as EventWithSocial).spotify_url && typeof (event as EventWithSocial).spotify_url === 'string' && (
                      <TouchableOpacity 
                        onPress={() => handleSocialLink((event as EventWithSocial).spotify_url)} 
                        style={styles.socialIcon}
                      >
                        <Ionicons name="musical-notes" size={24} color="#fff" />
                      </TouchableOpacity>
                    )}
                  </View>
                  <TouchableOpacity 
                    onPress={() => {
                      debugLog('Toggle schedule button pressed.', { eventName: event.name, isInSchedule });
                      onToggleSchedule(event); // event is guaranteed to be non-null here
                    }} 
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
  } catch (e: any) {
    debugLog('CRITICAL ERROR rendering EventDetailsModal:', { error: e.message, eventId: event?.id, stack: e.stack });
    // Attempt to render a minimal fallback within the modal structure if possible, or return null
    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={isVisible}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={[styles.modalContainer, {padding: 20, alignItems: 'center', justifyContent: 'center'}]}>
                    <SafeText style={{color: 'white', fontSize: 18, marginBottom: 10}}>Error Displaying Event Details</SafeText>
                    <SafeText style={{color: 'grey', fontSize: 14, textAlign: 'center', marginBottom: 20}}>
                        We encountered an issue loading the details for this event. Please try again later.
                    </SafeText>
                    <TouchableOpacity onPress={onClose} style={{backgroundColor: '#555', paddingVertical: 10, paddingHorizontal:20, borderRadius: 5}}>
                        <SafeText style={{color: 'white'}}>Close</SafeText>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
  }
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
