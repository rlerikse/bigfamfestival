import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import { uploadMyLocation } from '../services/friendService';

/**
 * Background location task.
 *
 * Registered at module load (TaskManager requires task definitions to exist at
 * the top level, before React renders). The LocationSharingProvider starts /
 * stops the actual updates via startLocationUpdatesAsync/stopLocationUpdatesAsync.
 *
 * Each delivered batch of fixes uploads the most recent point via
 * uploadMyLocation. Fails soft — a failed upload is logged, never thrown, so the
 * OS doesn't kill the task.
 */

export const BACKGROUND_LOCATION_TASK = 'bigfam-background-location';

TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
  if (error) {
    console.warn('[LocationTask] Background task error:', error);
    return;
  }
  const { locations } = (data ?? {}) as { locations?: Location.LocationObject[] };
  if (!locations || locations.length === 0) return;

  // Only the freshest fix matters for "where are you now".
  const latest = locations[locations.length - 1];
  try {
    await uploadMyLocation(latest.coords.latitude, latest.coords.longitude);
  } catch (err) {
    console.warn('[LocationTask] Background upload failed (will retry next fix):', err);
  }
});
