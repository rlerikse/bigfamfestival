import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { app } from './firebase';

/**
 * Convert a gs:// Storage URL to an HTTPS download URL.
 * If it's already an HTTPS URL, return as-is.
 */
export function getImageDisplayUrl(url: string | undefined | null): string | null {
  if (!url) return null;
  if (url.startsWith('https://')) return url;
  if (url.startsWith('gs://')) {
    // gs://bucket/path → https://firebasestorage.googleapis.com/v0/b/bucket/o/encoded-path?alt=media
    const match = url.match(/^gs:\/\/([^/]+)\/(.+)$/);
    if (match) {
      const bucket = match[1];
      const path = encodeURIComponent(match[2]);
      return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${path}?alt=media`;
    }
  }
  return url;
}

const storage = getStorage(app);

export function validateImageFile(file: File): string | null {
  const maxSize = 5 * 1024 * 1024; // 5MB
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!validTypes.includes(file.type)) return 'Invalid file type. Use JPEG, PNG, WebP, or GIF.';
  if (file.size > maxSize) return 'File too large. Max 5MB.';
  return null;
}

export async function uploadArtistImage(file: File, slug: string): Promise<string> {
  const ext = file.name.split('.').pop() || 'jpg';
  const storageRef = ref(storage, `artist_photos/artists/${slug}.${ext}`);
  await uploadBytes(storageRef, file);
  const downloadUrl = await getDownloadURL(storageRef);
  return downloadUrl;
}

export async function uploadEventImage(file: File, eventId: string): Promise<string> {
  const ext = file.name.split('.').pop() || 'jpg';
  const storageRef = ref(storage, `event_photos/${eventId}.${ext}`);
  await uploadBytes(storageRef, file);
  return await getDownloadURL(storageRef);
}

// POI marker logos/icons. Allows SVG in addition to the raster types, since
// stage/vendor logos are frequently vector. Kept separate from validateImageFile
// so the general image validator is unchanged.
export function validateMarkerFile(file: File): string | null {
  const maxSize = 2 * 1024 * 1024; // 2MB — markers should be small; Cypress flagged an oversized logo on #209
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
  if (!validTypes.includes(file.type)) return 'Invalid file type. Use PNG, JPEG, WebP, or SVG.';
  if (file.size > maxSize) return 'File too large. Max 2MB for marker logos.';
  return null;
}

// Uploads a POI marker image and returns its download URL. The POI id keys the
// path so re-uploading for the same POI overwrites in place (no orphan buildup).
export async function uploadPOIMarker(file: File, poiId: string): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
  const safeId = poiId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const storageRef = ref(storage, `poi_markers/${safeId}.${ext}`);
  await uploadBytes(storageRef, file);
  return await getDownloadURL(storageRef);
}
