/**
 * BFF-S3-07: Load Testing — k6 Configuration
 *
 * Shared config and helpers for all load test scenarios.
 * See README.md in this directory for setup and usage.
 */

// Default target — override with K6_BASE_URL env var
export const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080/api/v1';

// Firebase Auth token for authenticated requests.
// Generate a test token before running:
//   node scripts/generate-test-token.js > /tmp/k6-token.txt
// Then run k6 with: k6 run -e AUTH_TOKEN=$(cat /tmp/k6-token.txt) ...
export const AUTH_TOKEN = __ENV.AUTH_TOKEN || '';

/**
 * Standard thresholds for the Big Fam API.
 * Target: handle 4,000 concurrent users.
 */
export const THRESHOLDS = {
  // 95th percentile response time under 500ms
  'http_req_duration': ['p(95)<500', 'p(99)<1000'],
  // Less than 1% error rate
  'http_req_failed': ['rate<0.01'],
  // At least 100 requests per second throughput
  'http_reqs': ['rate>100'],
};

/**
 * Ramp-up profile targeting 4,000 concurrent VUs.
 * Stages:
 *   1. Warm-up:  0 → 100 VUs over 1 min
 *   2. Ramp:   100 → 1000 VUs over 3 min
 *   3. Load:  1000 → 4000 VUs over 5 min
 *   4. Sustain: 4000 VUs for 5 min (steady state)
 *   5. Cool:  4000 → 0 VUs over 2 min
 */
export const FULL_LOAD_STAGES = [
  { duration: '1m',  target: 100 },
  { duration: '3m',  target: 1000 },
  { duration: '5m',  target: 4000 },
  { duration: '5m',  target: 4000 },
  { duration: '2m',  target: 0 },
];

/**
 * Smoke test profile — quick validation with low load.
 */
export const SMOKE_STAGES = [
  { duration: '30s', target: 10 },
  { duration: '1m',  target: 10 },
  { duration: '30s', target: 0 },
];

/**
 * Soak test profile — moderate load over extended period.
 */
export const SOAK_STAGES = [
  { duration: '2m',  target: 500 },
  { duration: '30m', target: 500 },
  { duration: '2m',  target: 0 },
];

/**
 * Build standard headers for authenticated requests.
 */
export function authHeaders() {
  const headers = {
    'Content-Type': 'application/json',
  };
  if (AUTH_TOKEN) {
    headers['Authorization'] = `Bearer ${AUTH_TOKEN}`;
  }
  return headers;
}

/**
 * Build headers for public endpoints (no auth).
 */
export function publicHeaders() {
  return {
    'Content-Type': 'application/json',
  };
}
