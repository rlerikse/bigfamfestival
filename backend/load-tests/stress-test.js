import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import {
  BASE_URL,
  THRESHOLDS,
  authHeaders,
  publicHeaders,
} from './config.js';

/**
 * BFF-S3-07: Stress Test — Find Breaking Point
 *
 * Ramps well past 4,000 VUs to find where the system degrades or breaks.
 * Used to identify the hard ceiling for capacity planning.
 *
 * Run:
 *   k6 run --env BASE_URL=https://your-dev-url/api/v1 load-tests/stress-test.js
 */

const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '2m',  target: 1000 },
    { duration: '3m',  target: 2000 },
    { duration: '3m',  target: 4000 },
    { duration: '3m',  target: 6000 },   // Past target — looking for degradation
    { duration: '3m',  target: 8000 },   // Way past target — find the ceiling
    { duration: '2m',  target: 10000 },  // Absolute max — expect failures here
    { duration: '3m',  target: 0 },      // Recovery
  ],
  thresholds: {
    // Relaxed — we WANT to find the break point
    'http_req_duration': ['p(95)<3000'],
    'http_req_failed': ['rate<0.10'],
  },
};

export default function () {
  // Mix of public and potentially-authenticated requests
  const res = http.get(`${BASE_URL}/events`, { headers: publicHeaders() });
  check(res, { 'events: not 5xx': (r) => r.status < 500 }) || errorRate.add(1);

  sleep(0.5 + Math.random());

  const healthRes = http.get(`${BASE_URL}/health/ready`, { headers: publicHeaders() });
  check(healthRes, { 'health: not 5xx': (r) => r.status < 500 }) || errorRate.add(1);

  sleep(0.2 + Math.random() * 0.5);
}
