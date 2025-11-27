import React, { useState, useEffect } from 'react';
import { X, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HospiceValue {
  title: string;
  description: string;
  teamPhrase: string;
}

const ELEVATE_VALUES: HospiceValue[] = [
  {
    title: 'Protect Dignity at Every Step',
    description: 'Every person is more than a patient. They are someone\'s mother, husband, daughter, friend.',
    teamPhrase: 'We see the person, not the chart.'
  },
  {
    title: 'Speak the Truth with Compassion',
    description: 'Families deserve clarity, not false comfort or euphemisms.',
    teamPhrase: 'Kind, clear, and honest.'
  },
  {
    title: 'Be Present, Not Just Professional',
    description: 'Technical skill matters—but so does being emotionally present.',
    teamPhrase: 'People before paperwork.'
  },
  {
    title: 'Own the Experience',
    description: 'The family will remember this chapter for life. Every interaction counts.',
    teamPhrase: 'This is our moment.'
  },
  {
    title: 'Leave People Better',
    description: 'Even in dying, there\'s healing—of relationships, fears, regrets.',
    teamPhrase: 'Healing happens here.'
  },
  {
    title: 'Practice Sacred Competence',
    description: 'Compassion without excellence isn\'t enough. At this level of care, mistakes cost trust.',
    teamPhrase: 'Heart and skill, never just one.'
  },
  {
    title: 'Communicate Like It\'s Life-or-Death—Because It Is',
    description: 'In hospice, clarity saves pain, prevents fear, and builds trust.',
    teamPhrase: 'Clear is kind. Assumptions are cruel.'
  },
  {
    title: 'Lead With Hope, Not False Promises',
    description: 'Hope doesn\'t mean denial—it means helping people find meaning, connection, and peace in the time they have.',
    teamPhrase: 'Real hope grows in honesty.'
  },
  {
    title: 'Protect the Team Like Family',
    description: 'Death work is emotional labor. If the team isn\'t safe, no one can serve well.',
    teamPhrase: 'We care for the caregivers.'
  },
  {
    title: 'Remember Why We\'re Here',
    description: 'This is not just a job. It\'s sacred ground.',
    teamPhrase: 'Every visit is holy ground.'
  }
];

const ValuesReminder: React.FC = () => {
  const [currentValue, setCurrentValue] = useState<HospiceValue | null>(null);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Check if user has dismissed the values reminder this session
    const isDismissed = sessionStorage.getItem('valuesReminderDismissed');
    
    if (isDismissed) {
      setIsVisible(false);
      return;
    }

    // Select a random value
    const randomIndex = Math.floor(Math.random() * ELEVATE_VALUES.length);
    setCurrentValue(ELEVATE_VALUES[randomIndex]);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    // Store dismissal in session storage
    sessionStorage.setItem('valuesReminderDismissed', 'true');
  };

  if (!isVisible || !currentValue) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 p-4 mb-6 shadow-sm relative rounded-lg animate-in fade-in duration-500">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleDismiss}
        className="absolute top-2 right-2 h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
        aria-label="Dismiss value reminder"
      >
        <X className="h-4 w-4" />
      </Button>
      
      <div className="flex items-start space-x-3 pr-8">
        <div className="flex-shrink-0 mt-1">
          <Heart className="text-blue-600 h-5 w-5" />
        </div>
        
        <div className="flex-1">
          <div className="mb-2">
            <h4 className="font-semibold text-gray-900 text-sm">
              Team Focus: {currentValue.title}
            </h4>
          </div>
          
          <p className="text-gray-700 text-sm mb-3 leading-relaxed">
            {currentValue.description}
          </p>
          
          <div className="flex items-center space-x-2">
            <div className="h-1 w-1 bg-indigo-600 rounded-full"></div>
            <span className="text-indigo-800 font-medium text-sm italic">
              "{currentValue.teamPhrase}"
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ValuesReminder; 