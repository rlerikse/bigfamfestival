# Big Fam Festival — Product Roadmap

_Last refined: 2026-08-12 (backlog refinement). Priority source: **Director meeting reprioritization, 2026-08-11 20:01 EDT** + this refinement pass._

## Guiding directive

> **Stability over new features.** Target a "bulletproof" build ~1 week pre-festival.
> New feature work is **deferred or paused** unless it is part of the P0 bulletproof scope.

Priorities below mirror the `priority:P0–P3` labels on each issue. The **Refinement note**
column captures what has changed since the issue was filed — especially work that landed on
`dev` during the 2026-08-11 friend-finder session (commits `0bb6170`, `aa802d6`).

---

## ⚠️ Release risk to resolve first

The **paused** friend-finder rework (#246) is **already merged to `dev`** (`0bb6170`), with
`SHOW_FRIEND_RADAR_HUD = true` and compass-default orientation **on**. Per #246 it must **not**
ship in a pre-festival build without a dedicated stability pass.

**Action before cutting a bulletproof build:** either (a) complete the #246 stability pass, or
(b) flag-gate the feature **off** on the release branch — set `SHOW_FRIEND_RADAR_HUD = false`
and restore `orientationMode` default to `'north'` in `MapScreen.tsx`. The API cold-start retry
(`aa802d6`) and the Mapbox token `.env`/routing fixes are safe to keep regardless.

---

## Milestone 1 — Pre-Festival Bulletproof (P0)

_All filed 2026-08-11 by the director reprioritization. This is the critical path to a shippable build._

| # | Item | Refinement note (2026-08-12) |
|---|------|------------------------------|
| #242 | Data ownership docs — legal/PII draft | Still required. **Non-builder** — routed to research (Dexter). Legal exposure per Kevin. No code. |
| #241 | Location privacy toggle — **per-friend, default OFF** | **Still fully needed.** The 2026-08-11 session only restored the *global* `shareMyLocation`/`shareMyCampsite` toggles — this asks for **per-friend, opt-in, default OFF**, which is not built. Privacy/legal gate; pairs with #242. |
| #240 | Interactive map: tap-to-show POI descriptions + live location dot + all geo-markers rendering | **Partially satisfied by paused work.** Session `0bb6170` fixed the live-location dot and on-map marker rendering (beige→MarkerView) and first-open centering — but that's inside the **paused** #246 commit. POI tap-descriptions (callouts) exist. Re-verify the non-friend parts independently of #246. |
| #239 | Verify schedule rendering iOS + Android | **Verification/regression only** — "considered done" per directors. Schedule has had 3 recent merges (perf #186, pull-to-refresh, genre filter), so confirm no regressions on both platforms. Low effort. |
| #238 | Home screen: reduce stage card width/height | Still needed. Small, isolated UI change (keep aspect ratio). |
| #236 | Android store questionnaire | Still needed. **Non-code** — help Robert complete the Play listing. Gate for Android launch. |
| #237 | iOS rebuild once bulletproof scope lands | Still needed. **Depends on** the rest of P0 landing; rebuild the stale iOS build before the ~1wk pre-festival target. |

---

## Milestone 2 — Post-bulletproof / high-value (P1)

| # | Item | Refinement note (2026-08-12) |
|---|------|------------------------------|
| #125 | BFF-130: admin map editor — cannot add/edit POIs (bug) | **Still valid & important.** Admins can't do full POI CRUD (name/desc/category won't save; can't add). Blocks content prep for the festival. Not touched recently. Consider promoting toward P0 if content must be edited pre-launch. |
| #127 | Notifications: audit & validate 100% (iOS + Android) | Still needed (Cam: must-work for festival). Not touched. Related: #161. |
| #122 | Map: save my campsite location | **Not done.** Sharing *toggles* were restored, but pin/save-campsite-to-Firestore is unbuilt. Prerequisite for #123. |
| #123 | Map: nav buttons — Take me to Big Fam / Take me home | **Unblocked** — walking-directions token bug fixed (`aa802d6`), so routing works now. Depends on #122 for "home". |
| #124 | Map: bottom-sheet POI filter with routing (Shambhala-style) | Routing now works (`aa802d6`). Still a **new feature** → stays deferred under the stability directive unless folded into #240. (This is the "Batch C" layers redesign.) |
| #121 | Artists: add artist type field (headliner/local/supporting) | Still needed, untouched. Data-model + Firestore migration + admin field + card badge. |
| #62 | BFF-52: Custom SMTP email deliverability | Still needed, untouched. Spec-backed. |
| #175 | admin: dev API base URL override (`.env.local`) | Still valid tech-debt/safety — admin defaults straight to **production** (risk of prod writes in local dev). Analogous to the mobile `.env` pattern added this session. |
| #159 | BFF-128: Live Wayfinder — Friend Radar + Directional Tracking | **Largely IMPLEMENTED but PAUSED** (see #246). Radar HUD, directional tracking, distance labels, units toggle, gyro-fused heading all landed in `0bb6170`. Remaining per body: continuous **live route recalculation** (still one-shot). **Re-tag as paused / link to #246.** |
| #131 | Map: icon alignment, compass functionality, friends person icon | **Mostly done but inside paused #246.** Compass reworked (gyro fusion + orientation modes); friend/self person icons added (MarkerView). Filters-icon **alignment** may still need a look. Overlaps #240/#246. |

---

## Milestone 3 — Future backlog (P2)

| # | Item | Refinement note (2026-08-12) |
|---|------|------------------------------|
| #151 | BFF-129: friend location/campsite map rendering + DM messaging | **Rendering half is now DONE** (friend/campsite markers render via MarkerView, in paused `0bb6170`). Remaining: **DM messaging** (MessagesScreen stub). Split note accordingly. |
| #128 | Map: styling improvements | **Placeholder — do not start.** Blocked on Robert's specific styling direction. Keep parked. |
| #58 | BFF-36: Medical Emergency Request | Festival-ops feature, untouched. Deferred. |
| #56 | BFF-33: Schedule Snapshot Sharing | Untouched. Deferred. |
| #55 | BFF-29: Staff/Volunteer Shift Management | Untouched. Overlaps #67. Deferred. |
| #41 | BFF-31: Vendor dashboard panel | Untouched. Deferred. |
| #40 | BFF-15: Role-specific panels (vendor/artist/staff/volunteer) | Untouched. Deferred; umbrella for #41/#55. |

---

## Milestone 4 — Nice-to-have / deferred (P3)

| # | Item | Refinement note (2026-08-12) |
|---|------|------------------------------|
| #245 | Custom Mapbox styling/terrain | Deferred — directors: default terrain is acceptable this year. Cosmetic. |
| #244 | Genre sort by prominence (not alphabetical) | Deferred — **open design question**, no prominence/popularity data model yet. Needs product discussion. |
| #243 | Heart-icon affordance — clarify "add to my schedule" | Deferred — UX/onboarding polish. |
| #162 | Backend realtime friend location refresh (30s → sub-5s) | Deferred **with** the paused Wayfinder (#159). No decision; needs backend scoping (poll vs push). |
| #161 | Notifications trigger delay (fires on nav) | Low-priority bug, likely device/path-specific. Investigate under #127. |
| #67 | Volunteer operations capability | Large future capability. Deferred. |
| #59 | BFF-38: QR Scanner Gate Entry | Spec-backed, deferred. |
| #54 | BFF-27: QR Code Ticket Display | Spec-backed, deferred. |

---

## Paused (explicit)

| # | Item | Note |
|---|------|------|
| #246 | Gyro-compass / friend-finder rework — **PAUSED** | Paused per director meeting 2026-08-11. Not abandoned. **Resume requires a dedicated stability test pass first**; do not fold into a pre-festival build without it. Tracks commits `0bb6170` (+ `aa802d6` token/routing fixes). Umbrella for the paused portions of #159, #131, #151, #162. |

---

## Recently landed (context — on `dev`, not yet released)

- **Schedule:** perf tuning (#186 / BFF-127), pull-to-refresh (BFF-124), genre filter (BFF-128) — merged.
- **Friend-finder session (`0bb6170`, PAUSED via #246):** gyro-fused true-north heading, compass
  calibration screen, on-map avatar fix (MarkerView), first-open center-on-user, global sharing
  toggles restored.
- **`aa802d6`:** Mapbox token now loads from `mobile/.env`; walking-directions token resolution fixed;
  idempotent API requests retry through Cloud Run cold starts.

---

## Proposed refinement actions (need your OK before I touch GitHub)

These are **not yet applied** — say the word and I'll do them:

1. **Link & re-tag paused work:** cross-link #159 / #131 / #151 / #162 to #246; add `status:paused`.
2. **#151 / #131 / #240:** add a comment noting the map-rendering / live-dot / person-icon parts are
   implemented (in paused `0bb6170`) so they aren't rebuilt.
3. **#241:** add a comment clarifying the restored toggles are *global*, and per-friend/default-OFF is
   still outstanding.
4. **Promote #125** (admin POI CRUD bug) toward P0 if content must be editable before launch — your call.
5. **Close candidates:** none outright — nothing is 100% done + released. (#159/#131 are done-but-paused,
   not closeable until the stability pass + release.)
