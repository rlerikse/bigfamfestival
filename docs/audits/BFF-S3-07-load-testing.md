# BFF-S3-07: Load Testing Setup

**Date:** 2026-04-14  
**Author:** Koda  
**Branch:** BFF-S3-07-load-testing → dev

---

## Summary

k6 load testing framework targeting 4,000 concurrent users against the Big Fam API. Three test scenarios covering normal usage, spike traffic, and stress/breaking point analysis.

---

## Files Added

| File | Purpose |
|---|---|
| `load-tests/config.js` | Shared config: BASE_URL, thresholds, ramp profiles, auth helpers |
| `load-tests/attendee-flow.js` | Full attendee journey (health → events → artists → schedule) at 4,000 VUs |
| `load-tests/spike-test.js` | Sudden spike: 0 → 4,000 VUs in 30s, hold 2 min |
| `load-tests/stress-test.js` | Breaking point finder: ramps to 10,000 VUs |
| `load-tests/generate-test-token.js` | Firebase test token generator for authenticated endpoints |
| `load-tests/README.md` | Usage docs, thresholds, architecture notes |
| `load-tests/results/.gitignore` | Results dir (gitignored — output only) |

---

## Thresholds

| Metric | Target | Notes |
|---|---|---|
| p95 response time | < 500ms | Normal load |
| p99 response time | < 1000ms | Tail latency |
| Error rate | < 1% | Acceptable failure rate |
| Throughput | > 100 rps | Minimum sustained rate |
| Events endpoint p95 | < 300ms | Hottest public endpoint |

---

## Known Considerations

1. **Rate limiter**: Default 100 req/60s per IP will trigger on single-source k6 runs. Must temporarily increase or whitelist load test IP.
2. **Cloud Run cold starts**: Min instances = 0 causes cold start penalties in spike test. Production should set min instances ≥ 2.
3. **Firestore per-document write limit**: 1 write/sec/doc. Schedule and profile writes may bottleneck under high write concurrency.
4. **Firebase Auth token**: Authenticated tests require a valid token. generate-test-token.js provides a starting point but may need a real user token for full auth flow.

---

## Validation

Smoke test executed locally confirming k6 scripts compile and execute correctly. All metrics report, thresholds evaluate, and custom metrics track per-endpoint latency.
