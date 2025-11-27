import React from 'react';
import { Button } from './button';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FloatingActionButtonProps {
  onClick: () => void;
  label?: string;
  icon?: React.ReactNode;
  className?: string;
}

export const FloatingActionButton = ({ 
  onClick, 
  label = 'Add', 
  icon,
  className 
}: FloatingActionButtonProps) => {
  return (
    <Button
      onClick={onClick}
      className={cn(
        "fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg",
        "hover:shadow-xl transition-all duration-300 ease-in-out",
        "hover:scale-110 active:scale-95",
        "bg-primary hover:bg-primary/90",
        "touch-manipulation",
        className
      )}
      size="icon"
      aria-label={label}
    >
      {icon || <Plus className="h-6 w-6" />}
    </Button>
  );
};
