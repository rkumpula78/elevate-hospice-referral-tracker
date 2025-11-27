
import React from 'react';
import PageLayout from "@/components/layout/PageLayout";
import MapComponent from "@/components/map/MapComponent";

const MapPage = () => {
  return (
    <PageLayout 
      title="Map" 
      subtitle="View referral sources and patient locations"
    >
      <div className="h-[calc(100vh-12rem)]">
        <MapComponent />
      </div>
    </PageLayout>
  );
};

export default MapPage;
