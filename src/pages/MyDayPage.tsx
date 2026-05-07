import React from 'react';
import { format } from 'date-fns';
import PageLayout from '@/components/layout/PageLayout';
import MyDayView from '@/components/dashboard/MyDayView';
import { useAuth } from '@/hooks/useAuth';

const MyDayPage = () => {
  const { displayName } = useAuth();
  const firstName = (displayName || '').split(' ')[0] || 'there';

  return (
    <PageLayout
      title={`Good ${getGreeting()}, ${firstName}`}
      subtitle={format(new Date(), "EEEE, MMMM d")}
    >
      <MyDayView />
    </PageLayout>
  );
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

export default MyDayPage;
