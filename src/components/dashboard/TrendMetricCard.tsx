import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { TrendingUp, TrendingDown, LucideIcon } from "lucide-react";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface TrendMetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor: string;
  iconBgColor: string;
  gradientFrom: string;
  gradientTo: string;
  trend?: number;
  comparisonText?: string;
  sparklineData?: Array<{ value: number }>;
  tooltipData?: {
    currentValue: string;
    previousValue: string;
    exactChange: string;
    dateRange: string;
  };
  onEdit?: () => void;
  editButton?: React.ReactNode;
}

export const TrendMetricCard = ({
  title,
  value,
  icon: Icon,
  iconColor,
  iconBgColor,
  gradientFrom,
  gradientTo,
  trend = 0,
  comparisonText = "vs last 30 days",
  sparklineData,
  tooltipData,
  editButton
}: TrendMetricCardProps) => {
  const isPositiveTrend = trend > 0;
  const isNegativeTrend = trend < 0;
  const hasSparkline = sparklineData && sparklineData.length > 0;
  const isMobile = useIsMobile();

  // Disable tooltips on mobile to prevent overlay issues
  const CardWrapper = isMobile ? 'div' : Tooltip;
  const TriggerWrapper = isMobile ? 'div' : TooltipTrigger;

  return (
    <CardWrapper>
      {!isMobile && <TriggerWrapper asChild>
        <Card className={cn(
          "relative overflow-hidden transition-all duration-200",
          "hover:shadow-lg cursor-pointer"
        )}>
          {/* Background Gradient */}
          <div className={cn(
            "hidden sm:block absolute top-0 right-0 w-32 h-32 rounded-full -mr-16 -mt-16",
            `bg-gradient-to-br ${gradientFrom} ${gradientTo}`
          )} />
          
          <CardHeader className="relative pb-2 p-3 sm:p-5 md:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={cn("p-2 rounded-lg", iconBgColor)}>
                  <Icon className={cn("h-5 w-5", iconColor)} />
                </div>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {title}
                </CardTitle>
              </div>
              {editButton}
            </div>
          </CardHeader>

          <CardContent className="relative p-3 sm:p-5 md:p-6 pt-0">
            <div className="space-y-2">
              {/* Value and Trend */}
              <div className="flex items-end justify-between">
                <div className="text-3xl font-bold text-foreground">
                  {value}
                </div>
                {trend !== 0 && (
                  <div className={cn(
                    "flex items-center gap-1 text-sm font-semibold px-2 py-1 rounded-md",
                    isPositiveTrend && "text-green-600 bg-green-50",
                    isNegativeTrend && "text-red-600 bg-red-50"
                  )}>
                    {isPositiveTrend ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    <span>
                      {isPositiveTrend ? '+' : ''}{trend}%
                    </span>
                  </div>
                )}
              </div>

              {/* Comparison Text */}
              <p className="text-xs text-muted-foreground">
                {comparisonText}
              </p>

              {/* Sparkline Chart */}
              {hasSparkline && (
                <div className="h-12 mt-2 -mx-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={sparklineData}>
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={false}
                        className="transition-opacity duration-200 opacity-40 hover:opacity-100"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </TriggerWrapper>}
      
      {isMobile && (
        <Card className={cn(
          "relative overflow-hidden transition-all duration-200",
          "hover:shadow-lg"
        )}>
          {/* Background Gradient */}
          <div className={cn(
            "hidden sm:block absolute top-0 right-0 w-32 h-32 rounded-full -mr-16 -mt-16",
            `bg-gradient-to-br ${gradientFrom} ${gradientTo}`
          )} />
          
          <CardHeader className="relative pb-2 p-3 sm:p-5 md:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={cn("p-2 rounded-lg", iconBgColor)}>
                  <Icon className={cn("h-5 w-5", iconColor)} />
                </div>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {title}
                </CardTitle>
              </div>
              {editButton}
            </div>
          </CardHeader>

          <CardContent className="relative p-3 sm:p-5 md:p-6 pt-0">
            <div className="space-y-2">
              {/* Value and Trend */}
              <div className="flex items-end justify-between">
                <div className="text-3xl font-bold text-foreground">
                  {value}
                </div>
                {trend !== 0 && (
                  <div className={cn(
                    "flex items-center gap-1 text-sm font-semibold px-2 py-1 rounded-md",
                    isPositiveTrend && "text-green-600 bg-green-50",
                    isNegativeTrend && "text-red-600 bg-red-50"
                  )}>
                    {isPositiveTrend ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    <span>
                      {isPositiveTrend ? '+' : ''}{trend}%
                    </span>
                  </div>
                )}
              </div>

              {/* Comparison Text */}
              <p className="text-xs text-muted-foreground">
                {comparisonText}
              </p>

              {/* Sparkline Chart */}
              {hasSparkline && (
                <div className="h-12 mt-2 -mx-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={sparklineData}>
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={false}
                        className="transition-opacity duration-200 opacity-40 hover:opacity-100"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {!isMobile && tooltipData && (
        <TooltipContent side="bottom" className="w-64 p-4">
          <div className="space-y-2">
            <div className="font-semibold text-sm border-b pb-2">
              Detailed Breakdown
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Current:</span>
                <span className="font-medium">{tooltipData.currentValue}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Previous:</span>
                <span className="font-medium">{tooltipData.previousValue}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Change:</span>
                <span className={cn(
                  "font-semibold",
                  tooltipData.exactChange.startsWith('+') ? "text-green-600" : 
                  tooltipData.exactChange.startsWith('-') ? "text-red-600" : ""
                )}>
                  {tooltipData.exactChange}
                </span>
              </div>
              <div className="flex justify-between pt-1 border-t">
                <span className="text-muted-foreground">Period:</span>
                <span className="font-medium">{tooltipData.dateRange}</span>
              </div>
            </div>
          </div>
        </TooltipContent>
      )}
    </CardWrapper>
  );
};
