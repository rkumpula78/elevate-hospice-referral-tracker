
import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const MapComponent = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const initializeMap = async () => {
    if (!mapContainer.current) return;

    try {
      setIsLoading(true);
      setError(null);

      // Fetch Mapbox token from Supabase edge function
      const { data, error: functionError } = await supabase.functions.invoke('get-mapbox-token');
      
      if (functionError) {
        throw new Error('Failed to get Mapbox token: ' + functionError.message);
      }

      if (!data?.token) {
        throw new Error('Mapbox token not configured. Please add your MAPBOX_PUBLIC_TOKEN in Supabase secrets.');
      }

      mapboxgl.accessToken = data.token;
      
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: [-112.074, 33.448], // Phoenix, AZ area
        zoom: 10,
      });

      // Add navigation controls
      map.current.addControl(
        new mapboxgl.NavigationControl(),
        'top-right'
      );

      // Add some sample markers for referral sources
      const sampleLocations = [
        { name: 'Banner Health', coordinates: [-112.074, 33.448] },
        { name: 'Mayo Clinic', coordinates: [-111.974, 33.498] },
        { name: 'Phoenix VA Medical Center', coordinates: [-112.024, 33.528] },
        { name: 'St. Joseph Hospital', coordinates: [-112.054, 33.508] },
      ];

      sampleLocations.forEach(location => {
        if (map.current) {
          new mapboxgl.Marker({ color: '#3B82F6' })
            .setLngLat(location.coordinates as [number, number])
            .setPopup(
              new mapboxgl.Popup({ offset: 25 })
                .setHTML(`<h3 class="font-semibold">${location.name}</h3><p>Referral Source</p>`)
            )
            .addTo(map.current);
        }
      });

      setIsLoading(false);
    } catch (err) {
      console.error('Map initialization error:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize map');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initializeMap();

    return () => {
      map.current?.remove();
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span>Loading map...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Map Configuration Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">{error}</p>
            <p className="text-sm text-gray-600">
              Please make sure your Mapbox public token is properly configured in the Supabase secrets.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="absolute inset-0 rounded-lg" />
    </div>
  );
};

export default MapComponent;
