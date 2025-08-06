import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertTriangle, Calendar, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { BenefitPeriodFormatter } from "@/lib/benefitPeriodLogic";
import { format } from "date-fns";

interface F2FVisitIndicatorProps {
  f2fRequired: boolean;
  f2fDeadline?: Date;
  f2fCompleted?: boolean;
  f2fCompletedDate?: Date;
  benefitPeriodNumber?: number;
  compact?: boolean;
  showTooltip?: boolean;
}

const F2FVisitIndicator: React.FC<F2FVisitIndicatorProps> = ({
  f2fRequired,
  f2fDeadline,
  f2fCompleted = false,
  f2fCompletedDate,
  benefitPeriodNumber,
  compact = false,
  showTooltip = true
}) => {
  if (!f2fRequired) {
    return null;
  }

  const currentDate = new Date();
  const daysUntilDeadline = f2fDeadline 
    ? Math.ceil((f2fDeadline.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  // Determine status and styling
  let status: 'completed' | 'overdue' | 'urgent' | 'warning' | 'normal';
  let icon: React.ReactNode;
  let badgeVariant: 'default' | 'destructive' | 'outline' | 'secondary';
  let badgeClass = '';

  if (f2fCompleted) {
    status = 'completed';
    icon = <CheckCircle className="h-3 w-3" />;
    badgeVariant = 'outline';
    badgeClass = 'bg-green-50 text-green-700 border-green-200';
  } else if (daysUntilDeadline < 0) {
    status = 'overdue';
    icon = <AlertTriangle className="h-3 w-3" />;
    badgeVariant = 'destructive';
  } else if (daysUntilDeadline === 0) {
    status = 'urgent';
    icon = <AlertCircle className="h-3 w-3" />;
    badgeVariant = 'destructive';
    badgeClass = 'bg-red-100 text-red-800 border-red-300 animate-pulse';
  } else if (daysUntilDeadline <= 3) {
    status = 'urgent';
    icon = <AlertTriangle className="h-3 w-3" />;
    badgeVariant = 'destructive';
    badgeClass = 'bg-orange-50 text-orange-700 border-orange-200';
  } else if (daysUntilDeadline <= 7) {
    status = 'warning';
    icon = <Clock className="h-3 w-3" />;
    badgeVariant = 'outline';
    badgeClass = 'bg-yellow-50 text-yellow-700 border-yellow-200';
  } else {
    status = 'normal';
    icon = <Calendar className="h-3 w-3" />;
    badgeVariant = 'outline';
    badgeClass = 'bg-blue-50 text-blue-700 border-blue-200';
  }

  const getStatusText = () => {
    if (f2fCompleted) {
      return compact ? 'F2F ✓' : 'F2F Complete';
    }
    
    if (daysUntilDeadline < 0) {
      const overdueDays = Math.abs(daysUntilDeadline);
      return compact ? `F2F -${overdueDays}d` : `F2F Overdue (${overdueDays} days)`;
    }
    
    if (daysUntilDeadline === 0) {
      return compact ? 'F2F Due' : 'F2F Due TODAY';
    }
    
    if (compact) {
      return `F2F ${daysUntilDeadline}d`;
    }
    
    return `F2F Due (${daysUntilDeadline} days)`;
  };

  const getTooltipContent = () => {
    const periodText = benefitPeriodNumber ? `Benefit Period ${benefitPeriodNumber}` : '';
    
    if (f2fCompleted && f2fCompletedDate) {
      return (
        <div>
          <div className="font-medium">Face-to-Face Visit Completed</div>
          <div className="text-xs text-gray-300">
            Completed: {format(f2fCompletedDate, 'MMM dd, yyyy')}
          </div>
          {periodText && (
            <div className="text-xs text-gray-300">{periodText}</div>
          )}
        </div>
      );
    }

    if (!f2fDeadline) {
      return (
        <div>
          <div className="font-medium">Face-to-Face Visit Required</div>
          {periodText && (
            <div className="text-xs text-gray-300">{periodText}</div>
          )}
        </div>
      );
    }

    return (
      <div>
        <div className="font-medium">Face-to-Face Visit Required</div>
        <div className="text-xs text-gray-300">
          Deadline: {format(f2fDeadline, 'MMM dd, yyyy')}
        </div>
        <div className="text-xs text-gray-300">
          {BenefitPeriodFormatter.formatF2FDeadline(f2fDeadline)}
        </div>
        {periodText && (
          <div className="text-xs text-gray-300">{periodText}</div>
        )}
      </div>
    );
  };

  const indicator = (
    <Badge 
      variant={badgeVariant}
      className={`inline-flex items-center gap-1 ${badgeClass}`}
    >
      {icon}
      {getStatusText()}
    </Badge>
  );

  if (!showTooltip) {
    return indicator;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {indicator}
        </TooltipTrigger>
        <TooltipContent>
          {getTooltipContent()}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default F2FVisitIndicator;