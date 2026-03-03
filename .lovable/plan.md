

## Plan: Rebuild Map into Territory Management Tool

### Prerequisites
- **Mapbox token**: The user's token needs to be stored as a Supabase secret (`MAPBOX_PUBLIC_TOKEN`). The token was not included in the message — need it before implementation.
- **No schema migration needed**: `organizations` already has `gps_latitude` and `gps_longitude` columns.

### Phase 1: Real Org Markers + Popups + Filters

**1. Update edge function `get-mapbox-token/index.ts`**
- Fix CORS headers to include all required Supabase client headers
- Keep existing auth verification pattern

**2. Create `src/components/map/MapFilters.tsx`** (~80 lines)
- Collapsible panel with:
  - Account rating checkboxes (A/B/C/D)
  - Last visit filter (Overdue >14d, Recent <7d, All)
  - Organization type multi-select
- Emits filter state to parent

**3. Create `src/components/map/MapMarkerPopup.tsx`** (~40 lines)
- Renders HTML string for Mapbox popup: org name, rating badge, YTD referrals, last visit date, "View Details" link

**4. Rewrite `src/components/map/MapComponent.tsx`** (~300 lines)
- Remove manual token input flow entirely — only use edge function
- Fetch all organizations with `gps_latitude`/`gps_longitude` from Supabase
- Also fetch YTD referral counts and last activity dates (batch queries like OrganizationsList pattern)
- Use GeoJSON source with Mapbox GL clustering:
  - `cluster: true`, `clusterMaxZoom: 14`, `clusterRadius: 50`
  - Cluster circles with count labels
  - Unclustered points as colored circles (green/blue/amber/gray by rating)
- On marker click: show popup with org details + "View Details" link
- Apply filters from MapFilters to the GeoJSON source via `setFilter()`

**5. Create `src/components/map/useMapOrganizations.ts`** (~60 lines)
- Custom hook using TanStack Query to fetch organizations + metrics
- Returns filtered GeoJSON FeatureCollection based on active filters

### Phase 2: Route Planning

**6. Create `src/components/map/RoutePlanner.tsx`** (~120 lines)
- "Plan Route" toggle button on map
- When active, clicking markers adds them to a route list (3-8 stops)
- Shows numbered list of selected stops with remove buttons
- "Optimize Route" button calls Mapbox Directions API via a new edge function
- Draws blue polyline on map using `map.addSource`/`map.addLayer`
- Shows total drive time and distance
- "Start Navigation" button opens Google Maps with waypoints (`https://www.google.com/maps/dir/...`)

**7. Create edge function `supabase/functions/mapbox-directions/index.ts`** (~50 lines)
- Accepts array of coordinates
- Calls Mapbox Directions API using the stored token (server-side to protect token)
- Returns optimized route geometry, duration, distance

### Phase 3: Geocoding (future enhancement)
- For orgs with addresses but no lat/lng, batch geocode via Mapbox Geocoding API
- Store results back to `gps_latitude`/`gps_longitude`
- This is deferred since it requires writing back to DB and most orgs may not have addresses yet

---

### Technical Details

**Clustering approach**: Uses Mapbox GL JS native clustering via GeoJSON source (no external library). Each feature carries `account_rating`, `org_name`, `org_id` as properties for styling and popups.

**Color mapping** (reuses existing `AccountRatingBadge` convention):
- A → `#22c55e` (green-500)
- B → `#3b82f6` (blue-500)  
- C → `#f59e0b` (amber-500)
- D → `#9ca3af` (gray-400)

**Route optimization**: Mapbox Directions API with `overview=full&geometries=geojson` and waypoint optimization enabled.

**Files to create**: `MapFilters.tsx`, `MapMarkerPopup.tsx`, `useMapOrganizations.ts`, `RoutePlanner.tsx`, `supabase/functions/mapbox-directions/index.ts`

**Files to modify**: `src/components/map/MapComponent.tsx` (full rewrite), `supabase/config.toml` (add mapbox-directions function)

