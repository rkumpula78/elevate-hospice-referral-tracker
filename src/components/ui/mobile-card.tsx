import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface MobileOptimizedCardProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
}

export const MobileOptimizedCard = ({
  title,
  description,
  children,
  className,
  headerClassName,
  contentClassName,
}: MobileOptimizedCardProps) => {
  const isMobile = useIsMobile();

  return (
    <Card className={cn(
      "transition-all",
      isMobile && "shadow-sm border-border/50",
      className
    )}>
      {(title || description) && (
        <CardHeader className={cn(
          isMobile && "pb-3",
          headerClassName
        )}>
          {title && (
            <CardTitle className={cn(
              "text-foreground",
              isMobile ? "text-lg" : "text-xl"
            )}>
              {title}
            </CardTitle>
          )}
          {description && (
            <CardDescription className={cn(
              isMobile && "text-sm"
            )}>
              {description}
            </CardDescription>
          )}
        </CardHeader>
      )}
      <CardContent className={cn(
        isMobile && "px-4 pb-4",
        contentClassName
      )}>
        {children}
      </CardContent>
    </Card>
  );
};
