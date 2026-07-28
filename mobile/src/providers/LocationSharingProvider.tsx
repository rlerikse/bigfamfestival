import React, { useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { useAuth } from '../contexts/AuthContext';
import { uploadMyLocation } from '../services/friendService';
import { BACKGROUND_LOCATION_TASK } from '../tasks/locationTask';

/**
 * LocationSharingProvider — app-wide live-location uploader.
 *
 * When the signed-in user has `shareMyLocation === true`, uploads their position
 * to the backend (`POST /friends/location`) so friends' `GET /friends/locations`
 * actually returns data. Without this the app only tracked location locally.
 *
 * Strategy:
 *  - Foreground fix pushed immediately on enable (friends see you right away).
 *  - If background-location permission is granted, we run a background task
 *    (startLocationUpdatesAsync) so updates continue when the app is
 *    backgrounded — with a persistent Android foreground-service notification
 *    (required by the OS). Coarser cadence (~30s / ~50m) to save battery.
 *  - If background permission is denied/unavailable, we fall back to a
 *    foreground-only watchPositionAsync (~25s / ~10m).
 *  - Everything fails soft: errors are logged, never thrown.
 *  - Starts/stops reactively on the toggle + auth state.
 */

const FG_MIN_UPLOAD_INTERVAL_MS = 25_000;
const FG_MOVEMENT_DISTANCE_M = 10;
const BG_TIME_INTERVAL_MS = 30_000;
const BG_DISTANCE_M = 50;

async function stopBackgroundUpdates(): Promise<void> {
  try {
    const started = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
    if (started) {
      await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
    }
  } catch (err) {
    console.warn('[LocationSharing] Failed to stop background updates:', err);
  }
}

export const LocationSharingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const shareEnabled = !!user?.shareMyLocation && !!user?.id;
  const lastUploadRef = useRef<number>(0);

  useEffect(() => {
    if (!shareEnabled) {
      // Ensure any lingering background task is stopped when sharing is off.
      void stopBackgroundUpdates();
      return;
    }

    let fgSub: Location.LocationSubscription | undefined;
    let cancelled = false;
    let usingBackground = false;

    const pushForeground = async (lat: number, lng: number) => {
      const now = Date.now();
      if (now - lastUploadRef.current < FG_MIN_UPLOAD_INTERVAL_MS) return;
      lastUploadRef.current = now;
      try {
        await uploadMyLocation(lat, lng);
      } catch (err) {
        lastUploadRef.current = now - FG_MIN_UPLOAD_INTERVAL_MS / 2;
        console.warn('[LocationSharing] Foreground upload failed (will retry):', err);
      }
    };

    (async () => {
      try {
        const fg = await Location.requestForegroundPermissionsAsync();
        if (fg.status !== 'granted' || cancelled) return;

        // Immediate first fix so friends see us right away.
        try {
          const initial = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          if (!cancelled) await pushForeground(initial.coords.latitude, initial.coords.longitude);
        } catch {
          /* ignore initial-fix failure; watchers will catch up */
        }

        // Try to upgrade to background updates.
        try {
          const bg = await Location.requestBackgroundPermissionsAsync();
          if (bg.status === 'granted' && !cancelled) {
            const alreadyRunning = await Location.hasStartedLocationUpdatesAsync(
              BACKGROUND_LOCATION_TASK,
            );
            if (!alreadyRunning) {
              await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
                accuracy: Location.Accuracy.Balanced,
                timeInterval: BG_TIME_INTERVAL_MS,
                distanceInterval: BG_DISTANCE_M,
                pausesUpdatesAutomatically: true,
                showsBackgroundLocationIndicator: true,
                foregroundService: {
                  notificationTitle: 'Big Fam Festival — location sharing on',
                  notificationBody: 'Sharing your location with friends. Turn off in Settings.',
                  notificationColor: '#6BBF59',
                },
              });
            }
            usingBackground = true;
          }
        } catch (err) {
          console.warn('[LocationSharing] Background start failed, using foreground only:', err);
        }

        // If background didn't take, run the foreground watcher.
        if (!usingBackground && !cancelled) {
          fgSub = await Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.Balanced,
              timeInterval: FG_MIN_UPLOAD_INTERVAL_MS,
              distanceInterval: FG_MOVEMENT_DISTANCE_M,
            },
            (loc) => {
              void pushForeground(loc.coords.latitude, loc.coords.longitude);
            },
          );
        }
      } catch (err) {
        console.error('[LocationSharing] Failed to start location sharing:', err);
      }
    })();

    return () => {
      cancelled = true;
      fgSub?.remove();
      void stopBackgroundUpdates();
    };
  }, [shareEnabled]);

  return <>{children}</>;
};
