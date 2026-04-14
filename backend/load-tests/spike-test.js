import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import {
  BASE_URL,
  THRESHOLDS,
  SMOKE_STAGES,
  publicHeaders,
} from './config.js';

/**
 * BFF-S3-07: Spike Test
 *
 * Simulates a sudden spike in traffic — e.g., headliner announcement
 * or festival gates opening. Tests system behavior under sudden load.
 *
 * Profile: 0 → 4000 VUs in 30 seconds, hold for 2 minutes, then drop.
 *
 * Run:
 *   k6 run --env BASE_URL=https://your-dev-url/api/v1 load-tests/spike-test.js
 */

const errorRate = new Rate('errors');
const eventsDuration = new Trend('events_duration', true);

export const options = {
  stages: [
    { duration: '10s', target: 100 },    // Quick warm-up
    { duration: '30s', target: 4000 },   // SPIKE — 0 to 4000 in 30s
    { duration: '2m',  target: 4000 },   // Hold at peak
    { duration: '30s', target: 100 },    // Rapid cooldown
    { duration: '30s', target: 0 },      // Drain
  ],
  thresholds: {
    ...THRESHOLDS,
    // Spike test is more lenient on latency — we care about not crashing
    'http_req_duration': ['p(95)<2000', 'p(99)<5000'],
    'http_req_failed': ['rate<0.05'],  // Up to 5% error rate acceptable during spike
  },
};

export default function () {
  // Hammer the two hottest endpoints — events and health
  const batch = http.batch([
    ['GET', `${BASE_URL}/events`, null, { headers: publicHeaders() }],
    ['GET', `${BASE_URL}/health/ready`, null, { headers: publicHeaders() }],
    ['GET', `${BASE_URL}/artists`, null, { headers: publicHeaders() }],
  ]);

  check(batch[0], { 'events: 200': (r) => r.status === 200 }) || errorRate.add(1);
  check(batch[1], { 'health: 200': (r) => r.status === 200 }) || errorRate.add(1);
  check(batch[2], { 'artists: 200': (r) => r.status === 200 }) || errorRate.add(1);

  eventsDuration.add(batch[0].timings.duration);

  sleep(0.1 + Math.random() * 0.5);
}
