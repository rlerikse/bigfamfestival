# BFF-S3-07: Load Testing Framework

Load testing suite for the Big Fam Festival API using [k6](https://k6.io/).
Target: **4,000 concurrent users** against the dev environment.

## Prerequisites

```bash
# Install k6
brew install k6

# Verify
k6 version
```

## Test Scenarios

| Script | Purpose | Peak VUs | Duration |
|---|---|---|---|
| `attendee-flow.js` | Typical attendee journey (events → artists → schedule) | 4,000 | 16 min |
| `spike-test.js` | Sudden traffic spike (headliner announcement) | 4,000 | ~4 min |
| `stress-test.js` | Find breaking point (ramps to 10,000 VUs) | 10,000 | ~19 min |

## Usage

### Smoke Test (quick validation — 10 VUs)
```bash
cd backend
k6 run --env BASE_URL=http://localhost:8080/api/v1 --env PROFILE=smoke load-tests/attendee-flow.js
```

### Full Load Test (4,000 VUs)
```bash
# Against local dev
k6 run --env BASE_URL=http://localhost:8080/api/v1 load-tests/attendee-flow.js

# Against deployed dev environment
k6 run --env BASE_URL=https://bigfam-api-dev-xxxxx.run.app/api/v1 load-tests/attendee-flow.js
```

### Spike Test
```bash
k6 run --env BASE_URL=http://localhost:8080/api/v1 load-tests/spike-test.js
```

### Stress Test (find the ceiling)
```bash
k6 run --env BASE_URL=http://localhost:8080/api/v1 load-tests/stress-test.js
```

### With Authentication (for profile/schedule endpoints)
```bash
# Generate a test token first
node load-tests/generate-test-token.js > /tmp/k6-token.txt

# Run with token
k6 run \
  --env BASE_URL=http://localhost:8080/api/v1 \
  --env AUTH_TOKEN=$(cat /tmp/k6-token.txt) \
  load-tests/attendee-flow.js
```

### Export Results (JSON)
```bash
k6 run --out json=results/attendee-flow.json load-tests/attendee-flow.js
```

## Thresholds

Default pass/fail criteria:

| Metric | Threshold | Notes |
|---|---|---|
| `http_req_duration` p95 | < 500ms | Median user experience |
| `http_req_duration` p99 | < 1000ms | Tail latency |
| `http_req_failed` | < 1% | Error rate |
| `http_reqs` rate | > 100 rps | Minimum throughput |
| `event_list_duration` p95 | < 300ms | Events are the hottest endpoint |
| `artist_list_duration` p95 | < 300ms | Artists browsing |

Spike test uses relaxed thresholds (p95 < 2s, 5% error rate OK).
Stress test uses very relaxed thresholds — the goal is to find where things break.

## Results Directory

Test results are saved to `backend/load-tests/results/`. This directory is gitignored.

## Interpreting Results

After a run, k6 outputs a summary table. Key columns:

- **http_req_duration**: Response time distribution (avg, p90, p95, p99, max)
- **http_req_failed**: Percentage of failed requests
- **http_reqs**: Total request count and rate
- **vus**: Number of virtual users active
- **iteration_duration**: Full iteration time (one user's complete flow)

### What to look for:
1. **p95 over 500ms** → Firestore query optimization needed
2. **Error rate > 1%** → Check rate limiter config or Firestore connection limits
3. **Throughput plateau** → Backend is CPU or connection-bound
4. **Spike test failures** → Cloud Run autoscaling too slow (adjust min instances)

## Architecture Notes

- **Cloud Run autoscaling**: min instances = 0 by default (cold starts in spike test). For production, set min instances = 2+
- **Firestore**: Reads scale automatically but writes have per-document limits (1 write/sec/doc)
- **Rate limiter**: Default 100 req/60s per IP — k6 runs from a single IP so tests will trigger throttling. Temporarily increase or whitelist for load tests.
- **CORS**: Not relevant for k6 (no browser)
