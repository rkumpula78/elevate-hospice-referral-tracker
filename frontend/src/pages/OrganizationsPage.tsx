
import React from 'react';
import PageLayout from "@/components/layout/PageLayout";
import OrganizationsList from "@/components/crm/OrganizationsList";

const OrganizationsPage = () => {
  return (
    <PageLayout 
      title="Organizations" 
      subtitle="Manage referral sources and partner organizations"
    >
      <OrganizationsList />
    </PageLayout>
  );
};

export default OrganizationsPage;
