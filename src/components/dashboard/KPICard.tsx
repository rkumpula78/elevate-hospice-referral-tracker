import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { type LucideIcon, Edit2 } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  unit: string;
  trend: number;
  Icon: LucideIcon;
  color: 'green' | 'blue' | 'purple' | 'orange';
  onEdit?: () => void;
  isLoading: boolean;
  trendDirection?: 'up' | 'down'; // 'up' means positive trend is good, 'down' means negative trend is good
}

const colorStyles = {
  green: {
    gradient: 'from-green-50 to-green-100',
    bg: 'bg-green-100',
    text: 'text-green-700',
    trendPositive: 'text-green-600',
    trendNegative: 'text-red-600',
  },
  blue: {
    gradient: 'from-blue-50 to-blue-100',
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    trendPositive: 'text-green-600',
    trendNegative: 'text-red-600',
  },
  purple: {
    gradient: 'from-purple-50 to-purple-100',
    bg: 'bg-purple-100',
    text: 'text-purple-700',
    trendPositive: 'text-green-600', // For response time, lower is better
    trendNegative: 'text-red-600',
  },
  orange: {
    gradient: 'from-orange-50 to-orange-100',
    bg: 'bg-orange-100',
    text: 'text-orange-700',
    trendPositive: 'text-green-600',
    trendNegative: 'text-red-600',
  },
};

const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  unit,
  trend,
  Icon,
  color,
  onEdit,
  isLoading,
  trendDirection = 'up',
}) => {
  const styles = colorStyles[color];

  const isPositiveTrend = trendDirection === 'up' ? trend > 0 : trend < 0;

  const trendTextClass = cn({
    [styles.trendPositive]: isPositiveTrend,
    [styles.trendNegative]: !isPositiveTrend,
  });

  return (
    <Card className="relative overflow-hidden">
      <div className={cn("absolute top-0 right-0 w-32 h-32 bg-gradient-to-br rounded-full -mr-16 -mt-16", styles.gradient)} />
      <CardHeader className="relative pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn("p-2 rounded-lg", styles.bg)}>
              <Icon className={cn("h-5 w-5", styles.text)} />
            </div>
            <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
          </div>
          {onEdit && (
            <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={onEdit}>
              <Edit2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="relative">
        <div className="flex items-end justify-between">
          <div>
            {isLoading ? (
              <>
                <Skeleton className="h-8 w-24 mb-1" />
                <Skeleton className="h-4 w-16" />
              </>
            ) : (
              <>
                <div className="text-3xl font-bold text-gray-900">{value}</div>
                <p className="text-sm text-gray-500 mt-1">{unit}</p>
              </>
            )}
          </div>
          {!isLoading && trend !== 0 && (
            <div className={cn("flex items-center gap-1 text-sm font-medium", trendTextClass)}>
              {trend > 0 && trendDirection === 'up' ? '+' : ''}
              {trendDirection === 'down' && trend > 0 ? '+' : ''}
              {trend}%
              {isPositiveTrend ? '↗️' : '↘️'}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default KPICard;
