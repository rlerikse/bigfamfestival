# Shambala Festival App — Map Reverse Engineering Report

**Date:** 2026-07-14
**Author:** Samantha
**Purpose:** Reverse-engineer how Shambala implements its interactive map, recommend approach for BigFam
**Source:** Screen recording from Robert's Android phone + web research

---

## 1. Which Shambala?

There are two festivals with similar names:

| | **Shambala** (UK) | **Shambhala** (Canada) |
|---|---|---|
| Location | Northamptonshire (same region as BigFam!) | Salmo River Ranch, BC |
| App Developer | **TMSQR B.V.** (Leiden, Netherlands) | **Appmiral** (Antwerp, Belgium) |
| App Store ID | `id1255976495` | `id1228224979` |
| Size | 30.8 MB | 104.1 MB |
| Tech Stack | Native iOS/Android (TMSQR platform) | Native iOS/Android (Appmiral/GoLive platform) |

BigFam is in Brooklyn, Michigan (not Northamptonshire). **Shambhala Canada** ended up being the most relevant comparison — Robert grabbed a screen recording of the Android app. But the Canadian Shambhala app (via Appmiral) has a more documented and technically interesting map system, so I'm covering both.

---

## 2. Shambhala Canada App (Appmiral) — From Screen Recording

Robert grabbed a screen recording of the actual Shambhala app on Android. Here's exactly what it does:

### App Structure (Bottom Tab Bar)
- **News** — home screen with hero video, countdown timer, headliner carousel, Spotify integration, now-playing bar
- **Schedule** — horizontal timeline grid, stages as rows, day picker dropdown, filter button
- **Activities** — (not shown in recording)
- **Map** — dual-mode: list view + interactive map
- **More** — Favourites, Explore Artists, Image Map, Albums, Playlists, Food Vendors, Market Vendors, Lineup, Info & FAQs

### Map Section — List View (Default)
The Map tab opens to a **list view** by default, not the map itself:
- **Category filter tabs** at top: `Stages | Food | Beverages | Shops & Servi...` (scrollable)
- Each POI is a **full-width card** with:
  - Background photo of the location (atmospheric night shots)
  - **Bold name** overlaid (e.g. "The AMP Stage", "The Fractal Forest", "The Grove Stage")
  - **Description text** overlaid (e.g. "Located near the Artisan Market in Downtown Shambhala")
  - **Heart/favourite button** (unfilled by default)
  - Rounded corners, slight shadow
- Header bar has: search icon 🔍, map toggle icon 🗺️, filter/settings icon
- Persistent **now-playing bar** at bottom (artist + album art + play button)

### Map Section — Interactive Map View
Tapping the map icon in the header switches to the actual map:
- **Custom illustrated overlay map** — NOT standard map tiles. Flat colored polygons representing zones:
  - Green = forest/nature areas
  - Orange = vendor/market zones  
  - Pink = food areas
  - Yellow = paths/roads
  - Teal/dark green = tree-covered areas
  - Blue river running through (labeled "Salmo River")
- **POI markers** on top of the illustrated overlay:
  - 🛒 Shopping cart icon (orange background) = Market vendors
  - 🍴 Fork+knife icon (pink/red background) = Food
  - 🚌 Bus icon (dark background) = Transport/shuttle stops
  - 🅿️ P icon = Parking
  - ♿ Accessible parking icon
- **Bottom sheet** appears when tapping a POI:
  - Location name (bold)
  - Description
  - Photo thumbnail
  - Category tag (e.g. "FOOD" in red pill)
  - Heart/favourite button
  - Draggable handle at top
- **Compass** in top-left corner
- **Location/navigate button** in bottom-right (arrow icon)
- **Filter button** in top-right
- **Back arrow** to return to list view

### Search
- Universal search across POIs and vendors
- Results grouped: "POINTS OF INTEREST" (4 results) and "VENDOR" (1 result)
- Each result has thumbnail + name
- Typing "burger" found Blaze Burgers across both POI and vendor categories

### Schedule View
- Horizontal scrolling timeline (30-min columns)
- Stage names as row headers (Nook's Hideaway, Sunburst Canopy, Live Creation, Culture Canopy, Circle Garden Theatre)
- Day picker dropdown ("TUESDAY")
- Events as blocks with heart/favourite
- Zoom button in bottom-right

### Other Notable Features
- **Explore Artists** — 2-column grid of artist cards with photos, names, heart buttons
- **Image Map** — separate static map option (likely the printable festival map)
- **Spotify integration** — "Connect Spotify" card, persistent now-playing bar throughout app
- **Privacy policy confirms Appmiral** — "BV Appmiral, Scheldestraat 11, 2000 Antwerp (Belgium)"
- **Geolocation** — privacy policy mentions 36-month location data retention with opt-in

---

## 3. Appmiral Platform Documentation

Appmiral offers **4 map types** according to their help docs. Shambhala uses a hybrid of Options 3+4:

| Option | Description | What Shambhala Uses |
|---|---|---|
| Static Map | Zoomable image, no interactivity | Available as "Image Map" in More menu |
| Pins Map | Standard map tiles + POI pins | Not primary |
| Polygon Map | Colored zone polygons on map | ✅ The colored zones visible in recording |
| Overlay Map | Custom illustration over real tiles | ✅ Combined with polygon approach |

---

## 4. Key UX Patterns Worth Stealing

From the actual recording, the best patterns for BigFam:

1. **List view as default** — users land on browsable cards, not a map. Less intimidating, works without GPS.
2. **Category tabs** — horizontal scrollable filter chips. Simple and effective.
3. **Full-width photo cards** — each POI has an atmospheric photo. Makes browsing feel rich.
4. **Map as secondary view** — toggle to map when you need spatial context. Smart hierarchy.
5. **Bottom sheet on POI tap** — draggable, shows photo + description + category tag + favourite.
6. **Persistent now-playing bar** — Spotify integration throughout the app. Nice touch but not essential for BigFam v1.
7. **Search across everything** — POIs, vendors, artists all in one search.
8. **Favourite/heart system** — lets users bookmark locations and artists.
9. **Flat illustrated map style** — not photorealistic. Simple colored polygons with clear zone differentiation. Easier to commission than a detailed illustration.

---

## 5. How to Apply This to BigFam

### Current State
Our `MapScreen.tsx` already has:
- ✅ Mapbox SDK integrated (`@rnmapbox/maps`)
- ✅ Centered on Boughton House coordinates `[-0.6595, 52.3227]`
- ✅ Dark/light theme switching
- ❌ No POI markers
- ❌ No custom overlay
- ❌ No stage → schedule linking
- ❌ No list view toggle
- ❌ No category filtering

### Recommended Implementation: "Overlay + POI" Hybrid

This is what the best festival apps do and what would work for BigFam:

#### Layer 1: Custom Map Overlay (like Shambhala/Appmiral Option 4)
```
Mapbox.ImageSource + Mapbox.RasterLayer
```
- Commission or create a **custom illustrated map** of the Boughton House grounds
- Geo-reference the illustration to real coordinates (4 corner coordinates)
- Overlay it on the Mapbox base tiles using `Mapbox.ImageSource`
- The illustrated map replaces satellite/street view at festival zoom levels
- At lower zoom levels, standard Mapbox tiles show for navigation to/from the festival

**Mapbox implementation:**
```tsx
<Mapbox.ImageSource
  id="festival-overlay"
  coordinates={[
    [-84.260, 42.066],  // top-left
    [-84.252, 42.066],  // top-right
    [-84.252, 42.059],  // bottom-right
    [-84.260, 42.059],  // bottom-left
  ]}
  url={require('../assets/maps/bigfam-festival-map.png')}
>
  <Mapbox.RasterLayer
    id="festival-overlay-layer"
    style={{ rasterOpacity: 0.85 }}
    belowLayerID="poi-markers"
  />
</Mapbox.ImageSource>
```

#### Layer 2: Interactive POI Markers
```
Mapbox.ShapeSource + Mapbox.SymbolLayer
```
- Define POIs as GeoJSON (from API or bundled)
- Custom marker icons per category (stage 🎵, food 🍔, toilets 🚻, first aid ⛑️, bar 🍺)
- Tap handler opens bottom sheet with details

**POI data structure:**
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": { "type": "Point", "coordinates": [-84.2560, 42.0627] },
      "properties": {
        "id": "main-stage",
        "name": "Main Stage",
        "category": "stage",
        "icon": "stage",
        "description": "The main performance area"
      }
    }
  ]
}
```

#### Layer 3: Stage → Schedule Linking (the killer feature from TMSQR)
- When user taps a stage marker, show a bottom sheet with:
  - Stage name + description
  - **Current/next artist performing** (pulled from schedule API)
  - Full schedule for that stage today
  - "Add to my schedule" button

#### Layer 4: Category Filter + List View Toggle
- Filter bar at top: All | Stages | Food | Bars | Amenities
- Toggle button: Map View ↔ List View
- List view shows POIs grouped by category with distance from user

#### Layer 5: User Location (Blue Dot)
- Already supported by Mapbox: `Mapbox.LocationPuck`
- Shows user's position on the festival map
- Requires location permission

### Implementation Priority

| Priority | Feature | Effort | Impact |
|---|---|---|---|
| P0 | POI markers with tap → bottom sheet | 2-3 days | High |
| P0 | Category filtering | 1 day | High |
| P1 | Custom map overlay image | 1 day code + design time | High (visual wow factor) |
| P1 | Stage → schedule linking | 2 days | Very high (killer feature) |
| P2 | List view toggle | 1 day | Medium |
| P2 | User location blue dot | 0.5 day | Medium |
| P3 | User-dropped pins (tent/meeting spot) | 2 days | Nice-to-have |
| P3 | Offline tile caching | 1 day | Important for festival (no signal) |

### What We Need from Robert/Festival Team
1. **Geo-accurate site plan** of Boughton House grounds (ideally with GPS corner coordinates)
2. **Custom illustrated map** design (or commission from Pixel/designer)
3. **POI list** with GPS coordinates for each location (stages, food, toilets, etc.)
4. **Stage IDs** that match the schedule API so we can link them

---

## 6. Offline Strategy (Critical for Festivals)

Both Shambala and Shambhala emphasize offline support. Festival sites have notoriously bad signal.

**Mapbox supports this natively:**
```tsx
// Pre-download tiles for the festival area
const offlinePack = await Mapbox.offlineManager.createPack({
  name: 'bigfam-festival',
  styleURL: Mapbox.StyleURL.Dark,
  bounds: [[-84.260, 42.059], [-84.252, 42.066]],
  minZoom: 13,
  maxZoom: 18,
});
```

Plus bundle the overlay image and POI GeoJSON in the app binary so they work without network.

---

## 7. Summary

**What Shambala does:** Standard map tiles + POI pins + stage-schedule linking + offline support. Clean, functional, not flashy.

**What the best festival apps do (Appmiral Overlay):** Custom illustrated map overlay on real map tiles + interactive POIs + blue dot + category filtering + list view + user pins.

**What BigFam should do:** Start with POI markers + category filtering (P0), then add the custom overlay image when design is ready (P1). The stage → schedule linking is the feature that makes it truly useful vs just a pretty map.

We already have Mapbox integrated. The foundation is there. The work is:
1. POI data model + API endpoint
2. Marker rendering + bottom sheet UI
3. Category filter bar
4. Custom overlay (pending design asset)
5. Schedule integration in the stage bottom sheet
