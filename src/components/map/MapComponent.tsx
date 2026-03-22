import React, { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import MapFilters from './MapFilters';
import RoutePlanner from './RoutePlanner';
import { useMapOrganizations, filterOrganizations, toGeoJSON, type MapFiltersState, type MapOrganization } from './useMapOrganizations';
import { buildPopupHTML, getMarkerColor } from './MapMarkerPopup';

const RATING_COLORS: Record<string, string> = {
  A: '#22c55e',
  B: '#3b82f6',
  C: '#f59e0b',
  D: '#9ca3af',
};

const MapComponent = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState<MapFiltersState>({ ratings: [], lastVisit: 'all', orgTypes: [] });
  const [routeActive, setRouteActive] = useState(false);
  const [routeStops, setRouteStops] = useState<MapOrganization[]>([]);
  const { toast } = useToast();
  const { organizations, orgTypes, isLoading: orgsLoading } = useMapOrganizations();

  const filteredOrgs = filterOrganizations(organizations, filters);

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

    // Add empty source - will be updated when data arrives
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

      // Individual points
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
          'circle-radius': 8,
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

        // Handle route mode
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

  // Update GeoJSON source when filtered data changes
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    const source = m.getSource('organizations') as mapboxgl.GeoJSONSource | undefined;
    if (source) {
      source.setData(toGeoJSON(filteredOrgs));
    }
  }, [filteredOrgs]);

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

  if (isLoading || orgsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading map...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center p-6">
          <p className="text-destructive font-medium">{error}</p>
          <p className="text-sm text-muted-foreground mt-2">Ensure the MAPBOX_PUBLIC_TOKEN secret is configured.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full" style={{ height: '100%', minHeight: '500px' }}>
      <div ref={mapContainer} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, minHeight: '500px' }} className="rounded-lg" />
      <div className="absolute top-2 left-2 z-10">
        <MapFilters
          filters={filters}
          onChange={setFilters}
          orgTypes={orgTypes}
          orgCount={filteredOrgs.length}
        />
      </div>
      <RoutePlanner
        active={routeActive}
        onToggle={() => { setRouteActive(!routeActive); if (routeActive) { setRouteStops([]); clearRoute(); } }}
        stops={routeStops}
        onRemoveStop={(id) => { setRouteStops(prev => prev.filter(s => s.id !== id)); clearRoute(); }}
        onClearStops={() => { setRouteStops([]); clearRoute(); }}
        onRouteCalculated={handleRouteCalculated}
      />
    </div>
  );
};

export default MapComponent;
