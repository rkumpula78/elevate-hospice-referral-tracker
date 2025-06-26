
import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const MapComponent = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string>('');
  const [tokenInput, setTokenInput] = useState<string>('');
  const [isTokenSet, setIsTokenSet] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    // Try to get token from Supabase Edge Function
    const getMapboxToken = async () => {
      try {
        console.log('Attempting to get Mapbox token from edge function...');
        setIsLoading(true);
        setError('');
        
        const { data, error } = await supabase.functions.invoke('get-mapbox-token');
        
        console.log('Edge function response:', { data, error });
        
        if (error) {
          console.error('Edge function error:', error);
          setError(`Failed to get token from server: ${error.message}`);
        } else if (data && data.token) {
          console.log('Successfully got token from edge function');
          setMapboxToken(data.token);
          setIsTokenSet(true);
          initializeMap(data.token);
        } else {
          console.log('No token returned from edge function');
          setError('No token returned from server');
        }
      } catch (error) {
        console.error('Error calling edge function:', error);
        setError('Could not connect to server for token');
      } finally {
        setIsLoading(false);
      }
    };

    getMapboxToken();
  }, []);

  const initializeMap = (token: string) => {
    if (!mapContainer.current || map.current) return;

    try {
      console.log('Initializing map with token...');
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

      map.current.on('load', () => {
        console.log('Map loaded successfully');
        sampleLocations.forEach(location => {
          new mapboxgl.Marker()
            .setLngLat([location.lng, location.lat])
            .setPopup(new mapboxgl.Popup().setText(location.name))
            .addTo(map.current!);
        });
        
        toast({
          title: "Map Loaded",
          description: "Map has been successfully loaded with sample locations.",
        });
      });

      map.current.on('error', (e) => {
        console.error('Map error:', e);
        setError('Map failed to load. Please check your token.');
      });

    } catch (error) {
      console.error('Error initializing map:', error);
      setError('Failed to initialize map');
    }
  };

  const handleTokenSubmit = () => {
    if (tokenInput.trim()) {
      console.log('Using manually entered token');
      setMapboxToken(tokenInput);
      setIsTokenSet(true);
      setError('');
      initializeMap(tokenInput);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  if (!isTokenSet || error) {
    return (
      <div className="p-6">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Map Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
            <p className="text-sm text-muted-foreground">
              {error ? 
                "There was an issue loading the map automatically. Please enter your Mapbox public token manually." :
                "Please enter your Mapbox public token to view the map."
              }
            </p>
            <p className="text-xs text-muted-foreground">
              You can get this from your Mapbox account at <a href="https://mapbox.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">mapbox.com</a>.
            </p>
            <div className="space-y-2">
              <Input
                type="text"
                placeholder="Enter your Mapbox public token (pk.eyJ...)"
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
