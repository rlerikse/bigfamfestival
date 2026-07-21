import React, { useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { useAuth } from '../contexts/AuthContext';
import { uploadMyLocation } from '../services/friendService';

/**
 * LocationSharingProvider — app-wide live-location uploader.
 *
 * When the signed-in user has `shareMyLocation === true`, this watches their
 * position and POSTs it to the backend (`POST /friends/location`) so friends'
 * `GET /friends/locations` actually returns something. Without this, the app
 * only tracked location locally and never uploaded it — which is why the
 * friends-location feature always came back empty.
 *
 * Behavior:
 *  - Foreground only (battery/privacy): uses watchPositionAsync, no background task.
 *  - Uploads on meaningful movement (>=10m) and at most ~every 25s (throttle).
 *  - Starts/stops reactively when the toggle or auth state changes.
 *  - Fails soft: an upload error is logged, never thrown (no crash, retry on
 *    the next tick).
 */

const MIN_UPLOAD_INTERVAL_MS = 25_000;
const MOVEMENT_DISTANCE_M = 10;

export const LocationSharingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const shareEnabled = !!user?.shareMyLocation && !!user?.id;
  const lastUploadRef = useRef<number>(0);

  useEffect(() => {
    if (!shareEnabled) return;

    let sub: Location.LocationSubscription | undefined;
    let cancelled = false;

    const push = async (lat: number, lng: number) => {
      const now = Date.now();
      if (now - lastUploadRef.current < MIN_UPLOAD_INTERVAL_MS) return;
      lastUploadRef.current = now;
      try {
        await uploadMyLocation(lat, lng);
      } catch (err) {
        // Soft-fail: reset throttle a bit so we retry sooner next movement.
        lastUploadRef.current = now - MIN_UPLOAD_INTERVAL_MS / 2;
        console.warn('[LocationSharing] Upload failed (will retry):', err);
      }
    };

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted' || cancelled) return;

        // Push an immediate first fix so friends see us right away.
        try {
          const initial = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          if (!cancelled) await push(initial.coords.latitude, initial.coords.longitude);
        } catch {
          /* ignore initial fix failure; the watcher will catch up */
        }

        sub = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: MIN_UPLOAD_INTERVAL_MS,
            distanceInterval: MOVEMENT_DISTANCE_M,
          },
          (loc) => {
            void push(loc.coords.latitude, loc.coords.longitude);
          },
        );
      } catch (err) {
        console.error('[LocationSharing] Failed to start location watch:', err);
      }
    })();

    return () => {
      cancelled = true;
      sub?.remove();
    };
  }, [shareEnabled]);

  return <>{children}</>;
};
