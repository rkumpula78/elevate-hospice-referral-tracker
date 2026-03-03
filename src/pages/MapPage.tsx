import React from 'react';
import PageLayout from "@/components/layout/PageLayout";
import MapComponent from "@/components/map/MapComponent";

const MapPage = () => {
  return (
    <PageLayout 
      title="Territory Map" 
      subtitle="View and manage your organization territory with route planning"
    >
      <div className="h-[calc(100vh-12rem)]">
        <MapComponent />
      </div>
    </PageLayout>
  );
};

export default MapPage;
