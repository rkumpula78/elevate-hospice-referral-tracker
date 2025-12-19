import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { cn } from '@/lib/utils';

export const OfflineIndicator = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOnlineToast, setShowOnlineToast] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOnlineToast(true);
      setTimeout(() => setShowOnlineToast(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOnlineToast(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && !showOnlineToast) return null;

  return (
    <div
      className={cn(
        "fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg transition-all duration-300",
        !isOnline 
          ? "bg-destructive text-destructive-foreground" 
          : "bg-green-500 text-white"
      )}
    >
      {!isOnline ? (
        <>
          <WifiOff className="w-5 h-5" />
          <div>
            <p className="font-semibold text-sm">No Internet Connection</p>
            <p className="text-xs">Some features may not work properly</p>
          </div>
        </>
      ) : (
        <>
          <Wifi className="w-5 h-5" />
          <p className="font-semibold text-sm">Back Online</p>
        </>
      )}
    </div>
  );
};
