import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import {
  BASE_URL,
  THRESHOLDS,
  FULL_LOAD_STAGES,
  SMOKE_STAGES,
  authHeaders,
  publicHeaders,
} from './config.js';

/**
 * BFF-S3-07: Attendee Flow Load Test
 *
 * Simulates the typical festival attendee journey:
 *   1. Health check (app cold start)
 *   2. Browse events (public — heaviest traffic)
 *   3. Browse artists (public)
 *   4. Get stages list (public)
 *   5. View single event (public)
 *   6. Get own profile (authenticated)
 *   7. Get own schedule (authenticated)
 *
 * Run:
 *   k6 run --env BASE_URL=https://your-dev-url/api/v1 load-tests/attendee-flow.js
 *   k6 run --env BASE_URL=http://localhost:8080/api/v1 --env PROFILE=smoke load-tests/attendee-flow.js
 */

// Custom metrics
const eventListDuration = new Trend('event_list_duration', true);
const artistListDuration = new Trend('artist_list_duration', true);
const profileDuration = new Trend('profile_duration', true);
const scheduleDuration = new Trend('schedule_duration', true);
const errorRate = new Rate('errors');

// Select profile from env
const profile = __ENV.PROFILE || 'full';
const stages = profile === 'smoke' ? SMOKE_STAGES : FULL_LOAD_STAGES;

export const options = {
  stages,
  thresholds: {
    ...THRESHOLDS,
    'event_list_duration': ['p(95)<300'],
    'artist_list_duration': ['p(95)<300'],
    'profile_duration': ['p(95)<500'],
    'schedule_duration': ['p(95)<500'],
  },
};

export default function () {
  // 1. Health check — simulates app cold start connectivity check
  {
    const res = http.get(`${BASE_URL}/health/ready`, { headers: publicHeaders() });
    check(res, { 'health: status 200': (r) => r.status === 200 }) || errorRate.add(1);
  }

  sleep(0.5 + Math.random());

  // 2. Browse events — the #1 traffic endpoint at a festival
  {
    const res = http.get(`${BASE_URL}/events`, { headers: publicHeaders() });
    check(res, {
      'events: status 200': (r) => r.status === 200,
      'events: returns array': (r) => {
        try { return Array.isArray(JSON.parse(r.body)); } catch { return false; }
      },
    }) || errorRate.add(1);
    eventListDuration.add(res.timings.duration);
  }

  sleep(0.5 + Math.random());

  // 3. Browse artists
  {
    const res = http.get(`${BASE_URL}/artists`, { headers: publicHeaders() });
    check(res, { 'artists: status 200': (r) => r.status === 200 }) || errorRate.add(1);
    artistListDuration.add(res.timings.duration);
  }

  sleep(0.3 + Math.random() * 0.5);

  // 4. Get stages
  {
    const res = http.get(`${BASE_URL}/events/stages`, { headers: publicHeaders() });
    check(res, { 'stages: status 200': (r) => r.status === 200 }) || errorRate.add(1);
  }

  sleep(0.3 + Math.random() * 0.5);

  // 5. View a single event (simulate tapping on one)
  {
    // First get the list, then pick a random event
    const listRes = http.get(`${BASE_URL}/events`, { headers: publicHeaders() });
    try {
      const events = JSON.parse(listRes.body);
      if (events.length > 0) {
        const event = events[Math.floor(Math.random() * events.length)];
        const res = http.get(`${BASE_URL}/events/${event.id}`, { headers: publicHeaders() });
        check(res, { 'event detail: status 200': (r) => r.status === 200 }) || errorRate.add(1);
      }
    } catch {
      errorRate.add(1);
    }
  }

  sleep(0.5 + Math.random());

  // 6-7: Authenticated endpoints — only if token is provided
  const headers = authHeaders();
  if (headers.Authorization) {
    // 6. Get own profile
    {
      const res = http.get(`${BASE_URL}/users/profile`, { headers });
      check(res, { 'profile: status 200': (r) => r.status === 200 }) || errorRate.add(1);
      profileDuration.add(res.timings.duration);
    }

    sleep(0.3 + Math.random() * 0.5);

    // 7. Get own schedule
    {
      const res = http.get(`${BASE_URL}/schedule`, { headers });
      check(res, { 'schedule: status 200': (r) => r.status === 200 }) || errorRate.add(1);
      scheduleDuration.add(res.timings.duration);
    }
  }

  // Think time — simulate user reading content between page transitions
  sleep(1 + Math.random() * 3);
}
