export const ENV = detectEnv();

function detectEnv(): 'production' | 'development' | 'unknown' {
  const host = typeof window !== 'undefined' ? window.location.hostname : '';
  if (host.includes('admin.bigfam') || host.includes('bigfam-admin') || host.includes('bigfamfestival.web.app')) return 'production';
  if (host === 'localhost' || host === '127.0.0.1') return 'development';
  return 'unknown';
}

export const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  'https://bigfam-api-production-292369452544.us-central1.run.app/api/v1';

export const FIREBASE_PROJECT_ID = 'bigfamfestival';

export const STAGES = ['Apogee', 'Bayou', 'Gallery'] as const;

export const USER_ROLES = ['admin', 'artist', 'vendor', 'volunteer', 'attendee'] as const;
