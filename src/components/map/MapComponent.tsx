
import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

const MapComponent = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string>('');
  const [tokenInput, setTokenInput] = useState<string>('');
  const [isTokenSet, setIsTokenSet] = useState(false);

  useEffect(() => {
    // Try to get token from Supabase Edge Function
    const getMapboxToken = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-mapbox-token');
        if (data && data.token) {
          setMapboxToken(data.token);
          setIsTokenSet(true);
          initializeMap(data.token);
        }
      } catch (error) {
        console.log('Could not get token from edge function, will require manual input');
      }
    };

    getMapboxToken();
  }, []);

  const initializeMap = (token: string) => {
    if (!mapContainer.current || map.current) return;

    mapboxgl.accessToken = token;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [-111.9, 33.4], // Phoenix, AZ area
      zoom: 10,
    });

    // Add navigation controls
    map.current.addControl(
      new mapboxgl.NavigationControl({
        visualizePitch: true,
      }),
      'top-right'
    );

    // Add sample markers for organizations
    const sampleLocations = [
      { lng: -111.9262, lat: 33.4734, name: 'Paradise Valley Estates' },
      { lng: -111.8868, lat: 33.5092, name: 'HonorHealth Thompson Peak' },
      { lng: -111.9013, lat: 33.4629, name: 'Scottsdale Memory Care' },
    ];

    sampleLocations.forEach(location => {
      new mapboxgl.Marker()
        .setLngLat([location.lng, location.lat])
        .setPopup(new mapboxgl.Popup().setText(location.name))
        .addTo(map.current!);
    });
  };

  const handleTokenSubmit = () => {
    if (tokenInput.trim()) {
      setMapboxToken(tokenInput);
      setIsTokenSet(true);
      initializeMap(tokenInput);
    }
  };

  if (!isTokenSet) {
    return (
      <div className="p-6">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Mapbox Token Required</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Please enter your Mapbox public token to view the map. You can get this from your Mapbox account at mapbox.com.
            </p>
            <div className="space-y-2">
              <Input
                type="text"
                placeholder="Enter your Mapbox public token"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
              />
              <Button onClick={handleTokenSubmit} className="w-full">
                Load Map
              </Button>
            </div>
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
