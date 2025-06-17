
import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin } from 'lucide-react';

const MapComponent = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState('');
  const [isTokenSet, setIsTokenSet] = useState(false);

  const initializeMap = () => {
    if (!mapContainer.current || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;
    
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
  };

  const handleTokenSubmit = () => {
    if (mapboxToken.trim()) {
      setIsTokenSet(true);
      initializeMap();
    }
  };

  useEffect(() => {
    return () => {
      map.current?.remove();
    };
  }, []);

  if (!isTokenSet) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Map Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              To use the map feature, please enter your Mapbox public token. 
              You can get one for free at{' '}
              <a 
                href="https://mapbox.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                mapbox.com
              </a>
            </p>
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Enter your Mapbox public token"
                value={mapboxToken}
                onChange={(e) => setMapboxToken(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleTokenSubmit()}
              />
              <Button onClick={handleTokenSubmit} className="w-full">
                Initialize Map
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
