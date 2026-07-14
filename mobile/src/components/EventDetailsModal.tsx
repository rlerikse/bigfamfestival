import React, { useState, useEffect } from 'react';
import { Modal, View, Text, Image, TouchableOpacity, StyleSheet, Linking, ScrollView, TextProps, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScheduleEvent } from '../types/event';
import { getArtistsBySlugs, ArtistProfile } from '../services/artistService';

// Debug logging utility for this component
// eslint-disable-next-line @typescript-eslint/no-empty-function
const debugLog = (_message: string, _data?: any) => {};


// Local SafeText component for robust text rendering
interface SafeTextProps extends TextProps {
  children: React.ReactNode;
}

const SafeText: React.FC<SafeTextProps> = ({ children, ...props }) => {
  // Fast path: if children is a string or number, skip processing
  if (typeof children === 'string' || typeof children === 'number' || children === null || children === undefined) {
    return <Text {...props}>{children}</Text>;
  }
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
    // Parse as local date to avoid UTC→local timezone shift (e.g. Sep 25 UTC → Sep 24 EDT)
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    // Format: "Friday, September 25, 2026"
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

// Show logo.png from assets/images if event image fails to load
const EventImageWithFallback: React.FC<{ imageUrl?: string; style?: object }> = ({ imageUrl, style }) => {
  const [error, setError] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const resolvedUrl = imageUrl ? getFullImageUrl(imageUrl) : undefined;
  if (!resolvedUrl || error) {
    return (
      <Image
        source={require('../assets/images/bf-logo-trans.png')}
        style={style}
        resizeMode="contain"
      />
    );
  }
  return (
    <View style={style}>
      {loading && (
        <View style={{ ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a2e' }}>
          <ActivityIndicator size="large" color="#D4A574" />
        </View>
      )}
      <Image
        source={{ uri: resolvedUrl }}
        style={{ width: '100%', height: '100%' }}
        resizeMode="cover"
        onLoad={() => setLoading(false)}
        onError={() => setError(true)}
      />
    </View>
  );
};

const EventDetailsModal: React.FC<EventDetailsModalProps> = ({
  isVisible,
  onClose,
  event,
  isInSchedule,
  onToggleSchedule,
}) => {
  const [artists, setArtists] = useState<ArtistProfile[]>([]);
  const [bioExpanded, setBioExpanded] = useState(false);

  // Fetch artist profiles when event changes
  useEffect(() => {
    setBioExpanded(false);
    if (!event || !event.artists || event.artists.length === 0) {
      setArtists([]);
      return;
    }
    let cancelled = false;
    getArtistsBySlugs(event.artists).then((results) => {
      if (!cancelled) {
        setArtists(results.filter((a): a is ArtistProfile => a !== null));
      }
    });
    return () => { cancelled = true; };
  }, [event?.id]);

  if (!event) {
    return null;
  }

  // Resolve display data: prefer artist data over event-level data
  const primaryArtist = artists[0] ?? null;
  const resolvedImageUrl = event.imageUrl || primaryArtist?.imageUrl;
  const resolvedDescription = primaryArtist?.bio || (typeof event.description === 'string' ? event.description : null);
  const resolvedSocials = {
    soundcloudUrl: primaryArtist?.soundcloudUrl || (event as any).soundcloud_url,
    spotifyUrl: primaryArtist?.spotifyUrl || (event as any).spotify_url,
    facebookUrl: primaryArtist?.facebookUrl || (event as any).facebook_url,
    instagramUrl: primaryArtist?.instagramUrl || (event as any).instagram_url,
    websiteUrl: primaryArtist?.websiteUrl || (event as any).website_url,
  };

  // Ensure event properties used for display are strings or provide fallbacks
  const eventName = typeof event.name === 'string' ? event.name : "Event Name N/A";
  const eventStage = typeof event.stage === 'string' ? event.stage : "Stage N/A";
  const startTimeFormatted = formatTime(event.startTime);
  const endTimeFormatted = formatTime(event.endTime ?? undefined);
  const dateFormatted = formatDate(event.date);
  const description = resolvedDescription || null;


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
                <EventImageWithFallback imageUrl={resolvedImageUrl} style={styles.eventImage} />
                <View style={styles.gradientOverlay}>
                  <SafeText style={styles.eventName}>{eventName}</SafeText>
                  {artists.length > 0 && artists.map(a => a.name).join(' b2b ') !== eventName && (
                    <SafeText style={styles.artistNames}>
                      {artists.map(a => a.name).join(' b2b ')}
                    </SafeText>
                  )}
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
                
                {/* Display genres if available */}
                {(event.genres && event.genres.length > 0) && (
                  <SafeText style={styles.genresText}>
                    {event.genres.join(' • ')}
                  </SafeText>
                )}
                
                {description ? (
                  <>
                    <Text style={styles.bioText} numberOfLines={bioExpanded ? undefined : 3}>{description}</Text>
                    {description.length > 100 && (
                      <TouchableOpacity onPress={() => setBioExpanded(!bioExpanded)} hitSlop={{ top: 10, bottom: 10, left: 20, right: 20 }}>
                        <Text style={styles.readMoreText}>{bioExpanded ? 'Read Less' : 'Read More...'}</Text>
                      </TouchableOpacity>
                    )}
                  </>
                ) : null}


                <View style={styles.actionsContainer}>
                  <View style={styles.socialIconsContainer}>
                    {/* Social links resolved from artist profiles */}
                    {resolvedSocials.soundcloudUrl && typeof resolvedSocials.soundcloudUrl === 'string' && (
                      <TouchableOpacity 
                        onPress={() => handleSocialLink(resolvedSocials.soundcloudUrl)} 
                        style={styles.socialIcon}
                      >
                        <Ionicons name="logo-soundcloud" size={24} color="#fff" />
                      </TouchableOpacity>
                    )}
                    
                    {resolvedSocials.facebookUrl && typeof resolvedSocials.facebookUrl === 'string' && (
                      <TouchableOpacity 
                        onPress={() => handleSocialLink(resolvedSocials.facebookUrl)} 
                        style={styles.socialIcon}
                      >
                        <Ionicons name="logo-facebook" size={24} color="#fff" />
                      </TouchableOpacity>
                    )}
                    
                    {resolvedSocials.instagramUrl && typeof resolvedSocials.instagramUrl === 'string' && (
                      <TouchableOpacity 
                        onPress={() => handleSocialLink(resolvedSocials.instagramUrl)} 
                        style={styles.socialIcon}
                      >
                        <Ionicons name="logo-instagram" size={24} color="#fff" />
                      </TouchableOpacity>
                    )}
                    
                    {resolvedSocials.spotifyUrl && typeof resolvedSocials.spotifyUrl === 'string' && (
                      <TouchableOpacity 
                        onPress={() => handleSocialLink(resolvedSocials.spotifyUrl)} 
                        style={styles.socialIcon}
                      >
                        <Ionicons name="musical-notes" size={24} color="#fff" />
                      </TouchableOpacity>
                    )}
                    
                    {resolvedSocials.websiteUrl && typeof resolvedSocials.websiteUrl === 'string' && (
                      <TouchableOpacity 
                        onPress={() => handleSocialLink(resolvedSocials.websiteUrl)} 
                        style={styles.socialIcon}
                      >
                        <Ionicons name="globe-outline" size={24} color="#fff" />
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
                      color={isInSchedule ? "#B87333" : "#fff"} 
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
  artistNames: {
    fontSize: 16,
    color: '#ddd',
    textAlign: 'center',
    paddingHorizontal: 15,
    marginTop: 4,
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
  genresText: {
    fontSize: 14,
    color: '#B87333', // Copper color to match the heart
    fontWeight: '500',
    marginBottom: 15,
    fontStyle: 'italic',
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
  websiteLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 6,
  },
  websiteLinkText: {
    fontSize: 14,
    color: '#aaa',
    textDecorationLine: 'underline',
  },
  readMoreText: {
    fontSize: 13,
    color: 'rgba(184, 115, 51, 0.6)',
    textAlign: 'center',
    marginTop: 10,
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
