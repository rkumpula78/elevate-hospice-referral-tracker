import React from 'react';
import { Button } from '@/components/ui/button';
import { FileX, Plus, LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  showResetFilters?: boolean;
  onResetFilters?: () => void;
  icon?: React.ReactNode | LucideIcon;
}

export const EmptyState = ({
  title,
  description,
  actionLabel,
  onAction,
  showResetFilters,
  onResetFilters,
  icon
}: EmptyStateProps) => {
  const renderIcon = () => {
    if (!icon) {
      return <FileX className="w-12 h-12 text-muted-foreground" />;
    }
    // If it's a Lucide icon component (function or forwardRef object), render it
    if (typeof icon === 'function' || (typeof icon === 'object' && icon !== null && '$$typeof' in icon && 'render' in icon)) {
      const IconComponent = icon as LucideIcon;
      return <IconComponent className="w-12 h-12 text-muted-foreground" />;
    }
    // Otherwise it's already a ReactNode
    return icon;
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="mb-4">
        {renderIcon()}
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-md">{description}</p>
      <div className="flex gap-2">
        {onAction && actionLabel && (
          <Button onClick={onAction}>
            <Plus className="w-4 h-4 mr-2" />
            {actionLabel}
          </Button>
        )}
        {showResetFilters && onResetFilters && (
          <Button variant="outline" onClick={onResetFilters}>
            Reset Filters
          </Button>
        )}
      </div>
    </div>
  );
};
