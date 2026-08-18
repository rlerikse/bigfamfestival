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
export const MAX_MARKER_SIZE_BYTES = 2 * 1024 * 1024; // 2MB — markers should be small; Cypress flagged an oversized logo on #209

// Type-only check now — size is handled by compressMarkerFileIfNeeded() below
// instead of a hard rejection, so callers should compress before validating
// size (or just check file.size against MAX_MARKER_SIZE_BYTES after compressing).
export function validateMarkerFile(file: File): string | null {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
  if (!validTypes.includes(file.type)) return 'Invalid file type. Use PNG, JPEG, WebP, or SVG.';
  return null;
}

function replaceExtension(filename: string, ext: string): string {
  return filename.replace(/\.[^./]+$/, '') + '.' + ext;
}

/**
 * Re-encodes an oversized raster marker image (canvas -> WebP, stepping down
 * resolution and quality) until it fits under maxBytes, instead of just
 * rejecting the upload. SVG is untouched (vector, nothing to re-encode) and
 * files already under the limit are returned as-is. Falls back to the
 * smallest attempt produced if the target size can't be hit exactly, or to
 * the original file if the image can't be decoded at all — the caller should
 * still check the result's size afterward.
 */
export async function compressMarkerFileIfNeeded(file: File, maxBytes: number = MAX_MARKER_SIZE_BYTES): Promise<File> {
  if (file.size <= maxBytes || file.type === 'image/svg+xml') return file;

  const objectUrl = URL.createObjectURL(file);
  let img: HTMLImageElement;
  try {
    img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Could not decode image for compression'));
      el.src = objectUrl;
    });
  } catch (err) {
    console.error('Marker compression: failed to load image', err);
    URL.revokeObjectURL(objectUrl);
    return file;
  }

  // Markers render at ~20-40px on the map, so a 512px-max source is already
  // overkill resolution — most of the size win comes from this alone.
  const maxDim = 512;
  const baseScale = Math.min(1, maxDim / Math.max(img.width, img.height));
  const scaleSteps = [1, 0.75, 0.5, 0.35].map((s) => s * baseScale);
  const qualitySteps = [0.85, 0.7, 0.55, 0.4, 0.25];

  let smallest: Blob | null = null;
  for (const scale of scaleSteps) {
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(img.width * scale));
    canvas.height = Math.max(1, Math.round(img.height * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) continue;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    for (const quality of qualitySteps) {
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', quality));
      if (!blob) continue;
      if (!smallest || blob.size < smallest.size) smallest = blob;
      if (blob.size <= maxBytes) {
        URL.revokeObjectURL(objectUrl);
        return new File([blob], replaceExtension(file.name, 'webp'), { type: 'image/webp' });
      }
    }
  }
  URL.revokeObjectURL(objectUrl);
  // Never hit the target exactly (very unusual image) — still return the
  // smallest attempt rather than the original, so the caller's size check
  // after this at least sees the best possible result.
  return smallest ? new File([smallest], replaceExtension(file.name, 'webp'), { type: 'image/webp' }) : file;
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

// Uploads a zone/area icon image and returns its download URL. Separate path
// from poi_markers so zone icons and POI marker logos never collide even if
// a zone and a POI happen to share an id.
export async function uploadZoneIcon(file: File, zoneId: string): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
  const safeId = zoneId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const storageRef = ref(storage, `zone_icons/${safeId}.${ext}`);
  await uploadBytes(storageRef, file);
  return await getDownloadURL(storageRef);
}
