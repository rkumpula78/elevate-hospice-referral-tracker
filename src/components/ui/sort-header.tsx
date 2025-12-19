
import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

interface SortHeaderProps {
  label: string;
  field: string;
  currentSort: { field: string; direction: 'asc' | 'desc' } | null;
  onSort: (field: string) => void;
}

export const SortHeader = ({ label, field, currentSort, onSort }: SortHeaderProps) => {
  const getSortIcon = () => {
    if (currentSort?.field === field) {
      return currentSort.direction === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />;
    }
    return <ChevronsUpDown className="w-4 h-4" />;
  };

  return (
    <Button
      variant="ghost"
      className="h-auto p-0 font-medium text-left justify-start"
      onClick={() => onSort(field)}
    >
      {label}
      {getSortIcon()}
    </Button>
  );
};
