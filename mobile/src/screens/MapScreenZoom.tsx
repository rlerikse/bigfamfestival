// Commit: Add placeholder Messages screen for bottom navigation
import React, { useRef, useEffect, useState } from 'react';
import { StyleSheet, SafeAreaView, Dimensions, Animated, Image } from 'react-native';
// PinchGestureHandler is a runtime dependency; projects using Expo usually have it installed.
// We import it here but keep typing loose to avoid hard dependency on its types.
import { PinchGestureHandler, PanGestureHandler, GestureHandlerRootView } from 'react-native-gesture-handler';
import { useTheme } from '../contexts/ThemeContext';
import MapImage from '../assets/images/bff25_CampingMap.png';

/**
 * MapScreen
 * Shows a pinch-zoomable camping map image. The image starts with a width equal to
 * the device screen width and is vertically centered within the screen.
 */
const MapScreen: React.FC = () => {
  const { theme } = useTheme();
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;

  // Animated scale value for pinch gestures
  const baseScale = useRef(new Animated.Value(1)).current;
  const pinchScale = useRef(new Animated.Value(1)).current;
  const scale = Animated.multiply(baseScale, pinchScale);

  // Animated translateY to vertically center the image on mount
  const translateY = useRef(new Animated.Value(0)).current;

  // Pan (drag) values
  const basePanX = useRef(new Animated.Value(0)).current;
  const basePanY = useRef(new Animated.Value(0)).current;
  const panX = useRef(new Animated.Value(0)).current;
  const panY = useRef(new Animated.Value(0)).current;
  // Rendered pan values (base + current) clamped continuously
  const displayPanX = useRef(new Animated.Value(0)).current;
  const displayPanY = useRef(new Animated.Value(0)).current;

  const [imageAspect, setImageAspect] = useState<number | null>(null);

  // Continuously update displayPan while gesture values change
  useEffect(() => {
    // listener ids
    const panXId = panX.addListener(({ value: panVal }) => {
      basePanX.stopAnimation((baseVal: number) => {
        baseScale.stopAnimation((baseValScale: number) => {
          pinchScale.stopAnimation((pinchVal: number) => {
            const scaleVal = baseValScale * pinchVal;
            const imgW = screenWidth;
            const imgH = imageAspect ? screenWidth / imageAspect : screenWidth * 0.75;
            const scaledW = imgW * scaleVal;
            const maxPanX = Math.max((scaledW - screenWidth) / 2, 0);
            const combined = baseVal + panVal;
            const clamped = Math.max(-maxPanX, Math.min(maxPanX, combined));
            displayPanX.setValue(clamped);
          });
        });
      });
    });

    const panYId = panY.addListener(({ value: panVal }) => {
      basePanY.stopAnimation((baseVal: number) => {
        baseScale.stopAnimation((baseValScale: number) => {
          pinchScale.stopAnimation((pinchVal: number) => {
            const scaleVal = baseValScale * pinchVal;
            const imgH = imageAspect ? screenWidth / imageAspect : screenWidth * 0.75;
            const scaledH = imgH * scaleVal;
            const maxPanY = Math.max((scaledH - screenHeight) / 2, 0);
            const combined = baseVal + panVal;
            const clamped = Math.max(-maxPanY, Math.min(maxPanY, combined));
            displayPanY.setValue(clamped);
          });
        });
      });
    });

    // Also update when basePanX/basePanY change (e.g., after gesture end)
    const basePanXId = basePanX.addListener(({ value: baseVal }) => {
      panX.stopAnimation((panVal: number) => {
        baseScale.stopAnimation((baseValScale: number) => {
          pinchScale.stopAnimation((pinchVal: number) => {
            const scaleVal = baseValScale * pinchVal;
            const imgW = screenWidth;
            const imgH = imageAspect ? screenWidth / imageAspect : screenWidth * 0.75;
            const scaledW = imgW * scaleVal;
            const maxPanX = Math.max((scaledW - screenWidth) / 2, 0);
            const combined = baseVal + (panVal || 0);
            const clamped = Math.max(-maxPanX, Math.min(maxPanX, combined));
            displayPanX.setValue(clamped);
          });
        });
      });
    });

    const basePanYId = basePanY.addListener(({ value: baseVal }) => {
      panY.stopAnimation((panVal: number) => {
        baseScale.stopAnimation((baseValScale: number) => {
          pinchScale.stopAnimation((pinchVal: number) => {
            const scaleVal = baseValScale * pinchVal;
            const imgH = imageAspect ? screenWidth / imageAspect : screenWidth * 0.75;
            const scaledH = imgH * scaleVal;
            const maxPanY = Math.max((scaledH - screenHeight) / 2, 0);
            const combined = baseVal + (panVal || 0);
            const clamped = Math.max(-maxPanY, Math.min(maxPanY, combined));
            displayPanY.setValue(clamped);
          });
        });
      });
    });

    return () => {
      panX.removeListener(panXId);
      panY.removeListener(panYId);
      basePanX.removeListener(basePanXId);
      basePanY.removeListener(basePanYId);
    };
  }, [panX, panY, basePanX, basePanY, baseScale, pinchScale, displayPanX, displayPanY, screenWidth, screenHeight, imageAspect]);

  // Static import for the bundled image asset
  const mapSource = MapImage;

  useEffect(() => {
    // Attempt to measure the image dimensions to preserve aspect ratio
    // If the source is a bundled asset (require(...) -> number), use resolveAssetSource
    // Otherwise fall back to Image.getSize for remote URIs
    try {
  const resolved = Image.resolveAssetSource ? Image.resolveAssetSource(mapSource) : null;
      if (resolved && resolved.width && resolved.height) {
        const width = resolved.width;
        const height = resolved.height;
        setImageAspect(width / height);
        const imgHeight = screenWidth / (width / height);
        const offsetY = Math.max((screenHeight - imgHeight) / 2, 0);
        translateY.setValue(offsetY);
      } else if (typeof mapSource === 'string') {
        Image.getSize(
          mapSource,
          (width, height) => {
            setImageAspect(width / height);
            const imgHeight = screenWidth / (width / height);
            const offsetY = Math.max((screenHeight - imgHeight) / 2, 0);
            translateY.setValue(offsetY);
          },
          () => {
            const defaultOffset = Math.max((screenHeight - (screenWidth * 0.75)) / 2, 0);
            translateY.setValue(defaultOffset);
          }
        );
      } else {
        // Fallback if we cannot resolve dimensions
        const defaultOffset = Math.max((screenHeight - (screenWidth * 0.75)) / 2, 0);
        translateY.setValue(defaultOffset);
      }
    } catch (e) {
      const defaultOffset = Math.max((screenHeight - (screenWidth * 0.75)) / 2, 0);
      translateY.setValue(defaultOffset);
    }
  }, [screenWidth, screenHeight, translateY, mapSource]);

  // Bind pinch gesture native event to the Animated pinchScale value
  const onPinchEvent = Animated.event(
    [{ nativeEvent: { scale: pinchScale } }],
    { useNativeDriver: true }
  );

  // Bind pan gesture native event to the Animated pan values
  const onPanEvent = Animated.event(
    [{ nativeEvent: { translationX: panX, translationY: panY } }],
    { useNativeDriver: true }
  );

  // (clamping logic implemented inline where needed)

  // When the gesture ends, merge pinchScale into baseScale and reset pinchScale to 1
  const onPinchStateChange = (event: unknown) => {
    // Guard and narrow the event shape to access nativeEvent safely
    const maybe = event as { nativeEvent?: { state?: number; scale?: number } };
    const END = 4; // GestureHandlerState change 'END'
    if (maybe.nativeEvent && maybe.nativeEvent.state === END) {
      // snapshot current baseScale and multiply
      baseScale.stopAnimation((current: number) => {
        const next = current * (maybe.nativeEvent?.scale ?? 1);
        baseScale.setValue(next);
        pinchScale.setValue(1);

        // after scale changes, clamp pan to avoid exposing edges
        pinchScale.stopAnimation(() => {
          const currentScale = next; // baseScale already updated
          // get numeric pan values then clamp
          basePanX.stopAnimation((panXVal: number) => {
            basePanY.stopAnimation((panYVal: number) => {
              const imgW = screenWidth;
              const imgH = imageAspect ? screenWidth / imageAspect : screenWidth * 0.75;
              const scaledW = imgW * currentScale;
              const scaledH = imgH * currentScale;
              const maxPanX = Math.max((scaledW - screenWidth) / 2, 0);
              const maxPanY = Math.max((scaledH - screenHeight) / 2, 0);
              const clampedX = Math.max(-maxPanX, Math.min(maxPanX, panXVal));
              const clampedY = Math.max(-maxPanY, Math.min(maxPanY, panYVal));
              basePanX.setValue(clampedX);
              basePanY.setValue(clampedY);
            });
          });
        });
      });
    }
  };

  const onPanStateChange = (event: unknown) => {
    const maybe = event as { nativeEvent?: { state?: number; translationX?: number; translationY?: number } };
    const END = 4;
    if (maybe.nativeEvent && maybe.nativeEvent.state === END) {
      const transX = maybe.nativeEvent?.translationX ?? 0;
      const transY = maybe.nativeEvent?.translationY ?? 0;

      // finalize by setting basePan to the clamped combined value and reset current pan
      basePanX.stopAnimation((currentX: number) => {
        basePanY.stopAnimation((currentY: number) => {
          baseScale.stopAnimation((baseVal: number) => {
            pinchScale.stopAnimation((pinchVal: number) => {
              const currentScale = baseVal * pinchVal;
              const nextX = currentX + transX;
              const nextY = currentY + transY;
              const imgW = screenWidth;
              const imgH = imageAspect ? screenWidth / imageAspect : screenWidth * 0.75;
              const scaledW = imgW * currentScale;
              const scaledH = imgH * currentScale;
              const maxPanX = Math.max((scaledW - screenWidth) / 2, 0);
              const maxPanY = Math.max((scaledH - screenHeight) / 2, 0);
              const clampedX = Math.max(-maxPanX, Math.min(maxPanX, nextX));
              const clampedY = Math.max(-maxPanY, Math.min(maxPanY, nextY));
              basePanX.setValue(clampedX);
              basePanY.setValue(clampedY);
              // reset transient pan values
              panX.setValue(0);
              panY.setValue(0);
              // set display values equal to base (so image doesn't jump)
              displayPanX.setValue(clampedX);
              displayPanY.setValue(clampedY);
            });
          });
        });
      });
    }
  };

  // Render
  const source = mapSource;

  const imgStyle = imageAspect
    ? { width: screenWidth, height: screenWidth / imageAspect }
    : { width: screenWidth, height: screenWidth * 0.75 };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <GestureHandlerRootView style={styles.flexFill}>
        <PanGestureHandler
          onGestureEvent={onPanEvent}
          onHandlerStateChange={onPanStateChange}
        >
          <Animated.View style={styles.flexFill}>
            <PinchGestureHandler
              onGestureEvent={onPinchEvent}
              onHandlerStateChange={onPinchStateChange}
            >
              <Animated.View style={[styles.centerContainer, { transform: [{ translateY }] }]}> 
                {/* image transforms: pan (base + current) and scale; centering translateY is applied by the wrapper */}
                <Animated.Image
                  source={source}
                  style={[imgStyle, { transform: [{ translateX: displayPanX }, { translateY: displayPanY }, { scale }], alignSelf: 'center' }]}
                  resizeMode="contain"
                />
              </Animated.View>
            </PinchGestureHandler>
          </Animated.View>
        </PanGestureHandler>
      </GestureHandlerRootView>
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flexFill: {
    flex: 1,
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: '100%',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 24,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default MapScreen;