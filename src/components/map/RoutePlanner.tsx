import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Route, X, Navigation, RotateCcw, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { MapOrganization } from './useMapOrganizations';

interface RoutePlannerProps {
  active: boolean;
  onToggle: () => void;
  stops: MapOrganization[];
  onRemoveStop: (id: string) => void;
  onClearStops: () => void;
  onRouteCalculated: (geometry: GeoJSON.LineString, duration: number, distance: number) => void;
}

const RoutePlanner = ({ active, onToggle, stops, onRemoveStop, onClearStops, onRouteCalculated }: RoutePlannerProps) => {
  const [loading, setLoading] = React.useState(false);
  const [routeInfo, setRouteInfo] = React.useState<{ duration: number; distance: number } | null>(null);
  const { toast } = useToast();

  const optimizeRoute = async () => {
    if (stops.length < 2) {
      toast({ title: 'Need at least 2 stops', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const coordinates = stops.map(s => [s.gps_longitude, s.gps_latitude]);
      const { data, error } = await supabase.functions.invoke('mapbox-directions', {
        body: { coordinates },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setRouteInfo({ duration: data.duration, distance: data.distance });
      onRouteCalculated(data.geometry, data.duration, data.distance);
    } catch (e: any) {
      toast({ title: 'Route error', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const openGoogleMaps = () => {
    if (stops.length < 2) return;
    const origin = `${stops[0].gps_latitude},${stops[0].gps_longitude}`;
    const dest = `${stops[stops.length - 1].gps_latitude},${stops[stops.length - 1].gps_longitude}`;
    const waypoints = stops.slice(1, -1).map(s => `${s.gps_latitude},${s.gps_longitude}`).join('|');
    const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}${waypoints ? `&waypoints=${waypoints}` : ''}`;
    window.open(url, '_blank');
  };

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.round((seconds % 3600) / 60);
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  };

  const formatDistance = (meters: number) => {
    const miles = meters / 1609.34;
    return `${miles.toFixed(1)} mi`;
  };

  return (
    <div className="absolute top-2 right-2 z-10">
      <Button
        variant={active ? 'default' : 'outline'}
        size="sm"
        onClick={onToggle}
        className="gap-2"
      >
        <Route className="h-4 w-4" />
        {active ? 'Exit Route Mode' : 'Plan Route'}
      </Button>

      {active && stops.length > 0 && (
        <Card className="mt-2 w-64 shadow-lg">
          <CardHeader className="py-2 px-3">
            <CardTitle className="text-sm flex items-center justify-between">
              Route ({stops.length} stops)
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { onClearStops(); setRouteInfo(null); }}>
                <RotateCcw className="h-3 w-3" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3 space-y-2">
            {stops.map((stop, i) => (
              <div key={stop.id} className="flex items-center gap-2 text-xs">
                <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold shrink-0">
                  {i + 1}
                </span>
                <span className="truncate flex-1">{stop.name}</span>
                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => { onRemoveStop(stop.id); setRouteInfo(null); }}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}

            {routeInfo && (
              <div className="text-xs text-muted-foreground border-t pt-2 space-y-1">
                <div>Drive time: <b>{formatDuration(routeInfo.duration)}</b></div>
                <div>Distance: <b>{formatDistance(routeInfo.distance)}</b></div>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <Button size="sm" className="flex-1 text-xs h-7" onClick={optimizeRoute} disabled={loading || stops.length < 2}>
                {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Get Route'}
              </Button>
              {routeInfo && (
                <Button size="sm" variant="outline" className="text-xs h-7 gap-1" onClick={openGoogleMaps}>
                  <Navigation className="h-3 w-3" />
                  Navigate
                </Button>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground">Click markers to add stops (2-8)</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RoutePlanner;
