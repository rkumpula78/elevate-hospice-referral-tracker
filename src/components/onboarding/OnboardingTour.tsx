import React, { useState, useEffect } from 'react';
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride';
import { useIsMobile } from '@/hooks/use-mobile';

const ONBOARDING_KEY = 'onboarding_completed';

const tourSteps: Step[] = [
  {
    target: '[data-tour="dashboard-overview"]',
    content: "Welcome to Elevate Hospice! This is your dashboard showing today's key metrics and activity overview.",
    title: 'Dashboard Overview',
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '[data-tour="sidebar-nav"]',
    content: 'Navigate between Referrals, Organizations, Schedule, Training, and more from here.',
    title: 'Navigation',
    placement: 'right',
  },
  {
    target: '[data-tour="my-day-schedule"]',
    content: "See your scheduled visits and activities for today at a glance.",
    title: "Today's Schedule",
    placement: 'bottom',
  },
  {
    target: '[data-tour="my-day-overdue"]',
    content: 'Never miss a follow-up. Overdue items appear here highlighted so you can act fast.',
    title: 'Overdue Follow-ups',
    placement: 'bottom',
  },
  {
    target: '[data-tour="my-day-stats"]',
    content: 'Track your weekly progress — visits, referrals, and follow-ups all in one place.',
    title: 'Weekly Stats',
    placement: 'top',
  },
];

interface OnboardingTourProps {
  run?: boolean;
  onComplete?: () => void;
}

const OnboardingTour: React.FC<OnboardingTourProps> = ({ run: runProp, onComplete }) => {
  const [run, setRun] = useState(false);
  const isMobile = useIsMobile();
  const isMobileImmediate = typeof window !== 'undefined' && window.innerWidth < 768;
  useEffect(() => {
    // Disable onboarding tour on mobile — the overlay blocks interaction
    if (isMobile) {
      setRun(false);
      return;
    }
    if (runProp !== undefined) {
      setRun(runProp);
      return;
    }
    const completed = localStorage.getItem(ONBOARDING_KEY);
    if (!completed) {
      // Small delay to let DOM render tour targets
      const timer = setTimeout(() => setRun(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [runProp, isMobile]);

  const handleCallback = (data: CallBackProps) => {
    const { status } = data;
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      setRun(false);
      localStorage.setItem(ONBOARDING_KEY, 'true');
      onComplete?.();
    }
  };

  if (isMobile) return null;

  return (
    <Joyride
      steps={tourSteps}
      run={run}
      continuous
      showSkipButton
      showProgress
      scrollToFirstStep
      callback={handleCallback}
      locale={{
        back: 'Back',
        close: 'Close',
        last: 'Finish',
        next: 'Next',
        skip: 'Skip Tour',
      }}
      styles={{
        options: {
          primaryColor: 'hsl(217, 91%, 60%)',
          textColor: 'hsl(222, 47%, 11%)',
          backgroundColor: '#ffffff',
          overlayColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 10000,
          width: isMobile ? 280 : 380,
        },
        tooltip: {
          borderRadius: '10px',
          padding: isMobile ? '12px' : '16px',
          fontSize: isMobile ? '13px' : '14px',
        },
        tooltipTitle: {
          fontSize: isMobile ? '15px' : '16px',
          fontWeight: 600,
          color: 'hsl(222, 47%, 11%)',
        },
        tooltipContent: {
          padding: '8px 0',
        },
        buttonNext: {
          backgroundColor: 'hsl(217, 91%, 60%)',
          borderRadius: '6px',
          fontSize: '13px',
          padding: '8px 16px',
        },
        buttonBack: {
          color: 'hsl(215, 16%, 47%)',
          fontSize: '13px',
        },
        buttonSkip: {
          color: 'hsl(215, 16%, 47%)',
          fontSize: '12px',
        },
        spotlight: {
          borderRadius: '10px',
        },
      }}
      floaterProps={{
        disableAnimation: isMobile,
      }}
    />
  );
};

export { ONBOARDING_KEY };
export default OnboardingTour;
