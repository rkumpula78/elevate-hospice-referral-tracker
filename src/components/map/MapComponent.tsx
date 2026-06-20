import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { backfillOrgLocations } from '@/lib/geocode';
import MapFilters from './MapFilters';
import MapSearch from './MapSearch';
import MapListView from './MapListView';
import RoutePlanner from './RoutePlanner';
import MapStatsBar, { type ColorBy } from './MapStatsBar';
import { useMapOrganizations, filterOrganizations, toGeoJSON, DEFAULT_MAP_FILTERS, type MapFiltersState, type MapOrganization } from './useMapOrganizations';
import { buildPopupHTML } from './MapMarkerPopup';
import { ViewToggle } from '@/components/ui/view-toggle';

const RATING_COLORS: Record<string, string> = {
  A: '#22c55e',
  B: '#3b82f6',
  C: '#f59e0b',
  P: '#a855f7',
  D: '#9ca3af',
};

// Distinct, readable palette for color-by-marketer / color-by-type.
const PALETTE = [
  '#2563eb', '#16a34a', '#ea580c', '#db2777', '#7c3aed', '#0891b2',
  '#ca8a04', '#dc2626', '#4f46e5', '#059669', '#d97706', '#9333ea',
];

const FILTERS_STORAGE_KEY = 'territory-map-filters';

// Build a Mapbox circle-color expression for the chosen "color by" mode.
function buildColorExpression(colorBy: ColorBy, orgs: MapOrganization[]): any {
  if (colorBy === 'overdue') {
    return ['case', ['==', ['get', 'needs_visit'], true], '#ef4444', '#22c55e'];
  }
  if (colorBy === 'rating') {
    return ['match', ['get', 'account_rating'],
      'A', RATING_COLORS.A, 'B', RATING_COLORS.B, 'C', RATING_COLORS.C,
      'P', RATING_COLORS.P, 'D', RATING_COLORS.D, RATING_COLORS.C];
  }
  const key = colorBy === 'marketer' ? 'assigned_marketer' : 'type';
  const distinct = Array.from(new Set(orgs.map(o => (colorBy === 'marketer' ? (o.assigned_marketer || '__unassigned__') : o.type)))).filter(Boolean);
  if (distinct.length === 0) return '#9ca3af';
  const pairs: any[] = [];
  distinct.forEach((v, i) => { pairs.push(v, PALETTE[i % PALETTE.length]); });
  return ['match', ['get', key], ...pairs, '#9ca3af'];
}

function loadStoredFilters(): MapFiltersState | null {
  try {
    const raw = localStorage.getItem(FILTERS_STORAGE_KEY);
    if (!raw) return null;
    return { ...DEFAULT_MAP_FILTERS, ...JSON.parse(raw) };
  } catch {
    return null;
  }
}

const MapComponent = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState<MapFiltersState>(() => loadStoredFilters() ?? DEFAULT_MAP_FILTERS);
  const [colorBy, setColorBy] = useState<ColorBy>('rating');
  const [routeActive, setRouteActive] = useState(false);
  const [routeStops, setRouteStops] = useState<MapOrganization[]>([]);
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [backfilling, setBackfilling] = useState(false);
  const [backfillProgress, setBackfillProgress] = useState<{ done: number; total: number } | null>(null);
  const { toast } = useToast();
  const { isAdmin, displayName } = useAuth();
  const queryClient = useQueryClient();
  const { organizations, orgTypes, marketers, missingCoordsCount, isLoading: orgsLoading } = useMapOrganizations();

  const currentMarketerName = displayName || null;
  const filteredOrgs = useMemo(
    () => filterOrganizations(organizations, filters, currentMarketerName),
    [organizations, filters, currentMarketerName],
  );

  // Distinct, sorted cities for the City filter.
  const cities = useMemo(
    () => Array.from(new Set(organizations.map(o => o.city).filter(Boolean) as string[])).sort(),
    [organizations],
  );

  // Persist filters across visits.
  useEffect(() => {
    try { localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(filters)); } catch { /* ignore */ }
  }, [filters]);

  // First-time default: field marketers (non-admins) start scoped to their own accounts.
  // Capture whether stored filters existed at mount, before the persist effect writes.
  const hadStoredFilters = useRef(loadStoredFilters() !== null);
  const appliedDefaultRef = useRef(false);
  useEffect(() => {
    if (appliedDefaultRef.current || hadStoredFilters.current) return;
    if (!isAdmin && currentMarketerName) {
      appliedDefaultRef.current = true;
      setFilters(prev => ({ ...prev, myAccountsOnly: true }));
    }
  }, [isAdmin, currentMarketerName]);

  // Fly to an organization on search select
  const handleSearchSelect = useCallback((org: MapOrganization) => {
    const m = map.current;
    if (!m) return;
    m.flyTo({ center: [org.gps_longitude, org.gps_latitude], zoom: 14, duration: 1500 });
    // Open popup after fly
    setTimeout(() => {
      new mapboxgl.Popup({ offset: 15 })
        .setLngLat([org.gps_longitude, org.gps_latitude])
        .setHTML(buildPopupHTML({
          id: org.id,
          name: org.name,
          account_rating: org.account_rating || 'C',
          ytd_referrals: org.ytd_referrals,
          last_visit_date: org.last_visit_date,
          type: org.type,
          assigned_marketer: org.assigned_marketer,
          next_scheduled_visit: org.next_scheduled_visit,
        }))
        .addTo(m);
    }, 1600);
  }, []);

  // Initialize map
  useEffect(() => {
    const init = async () => {
      try {
        setIsLoading(true);
        const { data, error: fnError } = await supabase.functions.invoke('get-mapbox-token');
        if (fnError || !data?.token) {
          setError('Map service not configured. Contact your administrator.');
          return;
        }
        if (!mapContainer.current || map.current) return;

        mapboxgl.accessToken = data.token;
        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/light-v11',
          center: [-111.9, 33.4],
          zoom: 10,
        });

        map.current.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), 'top-right');

        map.current.on('load', () => {
          setupLayers();
        });
      } catch {
        setError('Failed to load map');
      } finally {
        setIsLoading(false);
      }
    };
    init();

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  const setupLayers = useCallback(() => {
    const m = map.current;
    if (!m) return;

    if (!m.getSource('organizations')) {
      m.addSource('organizations', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50,
      });

      // Cluster circles
      m.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'organizations',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': ['step', ['get', 'point_count'], '#51bbd6', 10, '#f1f075', 30, '#f28cb1'],
          'circle-radius': ['step', ['get', 'point_count'], 18, 10, 24, 30, 30],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff',
        },
      });

      // Cluster count
      m.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'organizations',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-font': ['DIN Pro Medium', 'Arial Unicode MS Bold'],
          'text-size': 13,
        },
      });

      // "Needs visit" pulsing ring — rendered behind main points
      m.addLayer({
        id: 'needs-visit-ring',
        type: 'circle',
        source: 'organizations',
        filter: ['all', ['!', ['has', 'point_count']], ['==', ['get', 'needs_visit'], true]],
        paint: {
          'circle-color': 'transparent',
          'circle-radius': [
            'match', ['get', 'account_rating'],
            'A', 16, 'B', 13, 'C', 11, 'D', 9, 11,
          ],
          'circle-stroke-width': 3,
          'circle-stroke-color': '#ef4444',
          'circle-stroke-opacity': 0.6,
        },
      });

      // Individual points — sized by rating
      m.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: 'organizations',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': [
            'match', ['get', 'account_rating'],
            'A', RATING_COLORS.A,
            'B', RATING_COLORS.B,
            'C', RATING_COLORS.C,
            'D', RATING_COLORS.D,
            RATING_COLORS.C,
          ],
          'circle-radius': [
            'match', ['get', 'account_rating'],
            'A', 12, 'B', 9, 'C', 7, 'D', 5, 7,
          ],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff',
        },
      });

      // Click on cluster to zoom
      m.on('click', 'clusters', (e) => {
        const features = m.queryRenderedFeatures(e.point, { layers: ['clusters'] });
        if (!features.length) return;
        const clusterId = features[0].properties?.cluster_id;
        (m.getSource('organizations') as mapboxgl.GeoJSONSource).getClusterExpansionZoom(clusterId, (err, zoom) => {
          if (err) return;
          m.easeTo({ center: (features[0].geometry as any).coordinates, zoom: zoom! });
        });
      });

      // Click on point for popup or route
      m.on('click', 'unclustered-point', (e) => {
        if (!e.features?.length) return;
        const feature = e.features[0];
        const coords = (feature.geometry as any).coordinates.slice();
        const props = feature.properties as any;

        if (routeActiveRef.current) {
          const org = organizationsRef.current.find(o => o.id === props.id);
          if (org) {
            setRouteStops(prev => {
              if (prev.find(s => s.id === org.id)) return prev;
              if (prev.length >= 8) {
                toast({ title: 'Maximum 8 stops', variant: 'destructive' });
                return prev;
              }
              return [...prev, org];
            });
          }
          return;
        }

        new mapboxgl.Popup({ offset: 15 })
          .setLngLat(coords)
          .setHTML(buildPopupHTML({
            id: props.id,
            name: props.name,
            account_rating: props.account_rating,
            ytd_referrals: props.ytd_referrals,
            last_visit_date: props.last_visit_date,
            type: props.type,
            assigned_marketer: props.assigned_marketer,
            next_scheduled_visit: props.next_scheduled_visit,
          }))
          .addTo(m);
      });

      // Cursor styles
      m.on('mouseenter', 'clusters', () => { m.getCanvas().style.cursor = 'pointer'; });
      m.on('mouseleave', 'clusters', () => { m.getCanvas().style.cursor = ''; });
      m.on('mouseenter', 'unclustered-point', () => { m.getCanvas().style.cursor = 'pointer'; });
      m.on('mouseleave', 'unclustered-point', () => { m.getCanvas().style.cursor = ''; });
    }
  }, []);

  // Keep refs for event handlers
  const routeActiveRef = useRef(routeActive);
  routeActiveRef.current = routeActive;
  const organizationsRef = useRef(organizations);
  organizationsRef.current = organizations;

  // Update GeoJSON source + auto-fit to the filtered results when data changes
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    const source = m.getSource('organizations') as mapboxgl.GeoJSONSource | undefined;
    if (!source) return;
    source.setData(toGeoJSON(filteredOrgs));

    if (filteredOrgs.length === 1) {
      const o = filteredOrgs[0];
      m.easeTo({ center: [o.gps_longitude, o.gps_latitude], zoom: 13, duration: 800 });
    } else if (filteredOrgs.length > 1) {
      const bounds = new mapboxgl.LngLatBounds();
      filteredOrgs.forEach(o => bounds.extend([o.gps_longitude, o.gps_latitude]));
      m.fitBounds(bounds, { padding: 80, maxZoom: 13, duration: 800 });
    }
    // 0 results: leave the current view as-is (empty-state fallback).
  }, [filteredOrgs]);

  // Recolor points when the "color by" mode (or the underlying data) changes.
  useEffect(() => {
    const m = map.current;
    if (!m || !m.getLayer('unclustered-point')) return;
    m.setPaintProperty('unclustered-point', 'circle-color', buildColorExpression(colorBy, organizations));
  }, [colorBy, organizations, isLoading, orgsLoading]);

  const handleRouteCalculated = useCallback((geometry: GeoJSON.LineString, duration: number, distance: number) => {
    const m = map.current;
    if (!m) return;

    if (m.getSource('route')) {
      (m.getSource('route') as mapboxgl.GeoJSONSource).setData({
        type: 'Feature',
        properties: {},
        geometry,
      });
    } else {
      m.addSource('route', {
        type: 'geojson',
        data: { type: 'Feature', properties: {}, geometry },
      });
      m.addLayer({
        id: 'route-line',
        type: 'line',
        source: 'route',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': '#3b82f6', 'line-width': 4, 'line-opacity': 0.8 },
      });
    }
  }, []);

  const clearRoute = useCallback(() => {
    const m = map.current;
    if (!m) return;
    if (m.getLayer('route-line')) m.removeLayer('route-line');
    if (m.getSource('route')) m.removeSource('route');
  }, []);

  const handleBackfill = useCallback(async () => {
    setBackfilling(true);
    setBackfillProgress({ done: 0, total: 0 });
    try {
      const result = await backfillOrgLocations((done, total) => setBackfillProgress({ done, total }));
      toast({
        title: 'Location backfill complete',
        description: `${result.updated} updated, ${result.failed} failed of ${result.total}.`,
      });
      queryClient.invalidateQueries({ queryKey: ['map-organizations'] });
      queryClient.invalidateQueries({ queryKey: ['map-missing-coords'] });
      queryClient.invalidateQueries({ queryKey: ['map-org-types'] });
    } catch (e: any) {
      toast({ title: 'Backfill failed', description: e?.message || 'Unknown error', variant: 'destructive' });
    } finally {
      setBackfilling(false);
      setBackfillProgress(null);
    }
  }, [toast, queryClient]);

  return (
    <div className="relative w-full" style={{ height: '100%', minHeight: '500px' }}>
      {/* Map container always rendered */}
      <div
        ref={mapContainer}
        style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, minHeight: '500px',
          display: viewMode === 'card' ? 'block' : 'none',
        }}
        className="rounded-lg"
      />

      {/* List view */}
      {viewMode === 'list' && (
        <div className="absolute inset-0 z-10">
          <MapListView organizations={filteredOrgs} />
        </div>
      )}

      {/* Loading overlay */}
      {(isLoading || orgsLoading) && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/80 rounded-lg">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading map...</p>
          </div>
        </div>
      )}

      {/* Error overlay */}
      {error && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/80 rounded-lg">
          <div className="text-center p-6">
            <p className="text-destructive font-medium">{error}</p>
            <p className="text-sm text-muted-foreground mt-2">Ensure the MAPBOX_PUBLIC_TOKEN secret is configured.</p>
          </div>
        </div>
      )}

      {/* Controls */}
      {!isLoading && !orgsLoading && !error && (
        <>
          <div className="absolute top-2 left-2 z-10 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <MapSearch organizations={organizations} onSelect={handleSearchSelect} />
              <ViewToggle view={viewMode} onViewChange={setViewMode} />
            </div>
            {viewMode === 'card' && (
              <MapFilters
                filters={filters}
                onChange={setFilters}
                orgTypes={orgTypes}
                marketers={marketers}
                cities={cities}
                orgCount={filteredOrgs.length}
                showMyAccounts={!!currentMarketerName}
              />
            )}
          </div>
          {viewMode === 'card' && (
            <RoutePlanner
              active={routeActive}
              onToggle={() => { setRouteActive(!routeActive); if (routeActive) { setRouteStops([]); clearRoute(); } }}
              stops={routeStops}
              onRemoveStop={(id) => { setRouteStops(prev => prev.filter(s => s.id !== id)); clearRoute(); }}
              onClearStops={() => { setRouteStops([]); clearRoute(); }}
              onRouteCalculated={handleRouteCalculated}
            />
          )}
          {viewMode === 'card' && (
            <MapStatsBar
              orgs={filteredOrgs}
              colorBy={colorBy}
              onColorByChange={setColorBy}
              missingCoordsCount={missingCoordsCount}
              isAdmin={isAdmin}
              onBackfill={handleBackfill}
              backfilling={backfilling}
              backfillProgress={backfillProgress}
            />
          )}
        </>
      )}
    </div>
  );
};

export default MapComponent;
