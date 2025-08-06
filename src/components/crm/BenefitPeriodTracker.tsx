import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Calendar, Clock, AlertTriangle, CheckCircle, Info, ChevronDown, ChevronUp } from "lucide-react";
import { BenefitPeriodCalculator, BenefitPeriodFormatter, type BenefitPeriod } from "@/lib/benefitPeriodLogic";
import F2FVisitIndicator from "./F2FVisitIndicator";
import { format } from "date-fns";

interface BenefitPeriodTrackerProps {
  admissionDate: Date | null;
  patientName: string;
  showAllPeriods?: boolean;
  compact?: boolean;
}

const BenefitPeriodTracker: React.FC<BenefitPeriodTrackerProps> = ({
  admissionDate,
  patientName,
  showAllPeriods = false,
  compact = false
}) => {
  const [expandedView, setExpandedView] = useState(false);

  if (!admissionDate) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex items-center justify-center h-32">
          <div className="text-center text-gray-500">
            <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No admission date available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentPeriod = BenefitPeriodCalculator.getCurrentBenefitPeriod(admissionDate);
  const allPeriods = BenefitPeriodCalculator.calculateBenefitPeriods(admissionDate);
  const hasOverdueF2F = BenefitPeriodCalculator.hasOverdueF2F(admissionDate);
  const daysUntilF2F = BenefitPeriodCalculator.getDaysUntilF2FDeadline(admissionDate);

  const getCurrentPeriodProgress = () => {
    if (currentPeriod.daysElapsed === 0) return 0;
    return Math.min((currentPeriod.daysElapsed / currentPeriod.totalDays) * 100, 100);
  };

  const renderPeriodCard = (period: BenefitPeriod, isCurrent: boolean = false) => {
    const progressPercentage = period.status === 'completed' 
      ? 100 
      : Math.min((period.daysElapsed / period.totalDays) * 100, 100);

    return (
      <div 
        key={period.number}
        className={`p-4 rounded-lg border ${
          isCurrent 
            ? 'border-blue-200 bg-blue-50' 
            : period.status === 'completed' 
              ? 'border-gray-200 bg-gray-50' 
              : 'border-gray-100'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Badge 
              variant={isCurrent ? "default" : "outline"}
              className={BenefitPeriodFormatter.getPeriodStatusColor(period)}
            >
              Period {period.number}
            </Badge>
            {period.f2fRequired && (
              <F2FVisitIndicator
                f2fRequired={period.f2fRequired}
                f2fDeadline={period.f2fDeadline}
                benefitPeriodNumber={period.number}
                compact={compact}
              />
            )}
          </div>
          <div className="text-sm text-gray-600">
            {period.certificationDays} days
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>
              {format(period.startDate, 'MMM dd')} - {format(period.endDate, 'MMM dd, yyyy')}
            </span>
            <span className="text-gray-600">
              {period.status === 'current' && (
                <>Day {period.daysElapsed} of {period.totalDays}</>
              )}
              {period.status === 'completed' && (
                <span className="text-green-600">Completed</span>
              )}
              {period.status === 'upcoming' && (
                <span className="text-blue-600">Upcoming</span>
              )}
            </span>
          </div>

          <Progress value={progressPercentage} className="h-2" />

          {period.status === 'current' && (
            <div className="flex justify-between text-xs text-gray-500">
              <span>{period.daysElapsed} days elapsed</span>
              <span>{period.daysRemaining} days remaining</span>
            </div>
          )}
        </div>

        {period.f2fDeadline && period.status === 'current' && (
          <div className="mt-3 pt-3 border-t">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4" />
              <span>F2F Deadline: {format(period.f2fDeadline, 'MMM dd, yyyy')}</span>
            </div>
            <div className="text-xs text-gray-600 ml-6">
              {BenefitPeriodFormatter.formatF2FDeadline(period.f2fDeadline)}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              Benefit Period {currentPeriod.number}
            </Badge>
            <div className="text-sm text-gray-600">
              Day {currentPeriod.daysElapsed} of {currentPeriod.totalDays}
            </div>
          </div>
          {currentPeriod.f2fRequired && (
            <F2FVisitIndicator
              f2fRequired={currentPeriod.f2fRequired}
              f2fDeadline={currentPeriod.f2fDeadline}
              benefitPeriodNumber={currentPeriod.number}
              compact
            />
          )}
        </div>
        <Progress value={getCurrentPeriodProgress()} className="h-2" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Benefit Period Tracking</CardTitle>
            <CardDescription>
              Medicare benefit periods for {patientName}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {hasOverdueF2F && (
              <Badge variant="destructive" className="animate-pulse">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Overdue F2F
              </Badge>
            )}
            {daysUntilF2F >= 0 && daysUntilF2F <= 7 && !hasOverdueF2F && (
              <Badge variant="outline" className="text-orange-600 border-orange-200">
                <Clock className="h-3 w-3 mr-1" />
                F2F Due in {daysUntilF2F} days
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Current Period Summary */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-blue-900">
              Current: Benefit Period {currentPeriod.number}
            </h3>
            <div className="flex items-center gap-2">
              {currentPeriod.f2fRequired && (
                <F2FVisitIndicator
                  f2fRequired={currentPeriod.f2fRequired}
                  f2fDeadline={currentPeriod.f2fDeadline}
                  benefitPeriodNumber={currentPeriod.number}
                />
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm text-blue-800">
              <span>
                {format(currentPeriod.startDate, 'MMM dd')} - {format(currentPeriod.endDate, 'MMM dd, yyyy')}
              </span>
              <span>
                Day {currentPeriod.daysElapsed} of {currentPeriod.totalDays} days
              </span>
            </div>
            <Progress 
              value={getCurrentPeriodProgress()} 
              className="h-3 bg-blue-100" 
            />
            <div className="flex justify-between text-xs text-blue-700">
              <span>{currentPeriod.daysElapsed} days elapsed</span>
              <span>{currentPeriod.daysRemaining} days remaining</span>
            </div>
          </div>
        </div>

        {/* F2F Alert */}
        {currentPeriod.f2fDeadline && (
          <div className={`p-3 rounded-lg border ${
            hasOverdueF2F 
              ? 'bg-red-50 border-red-200' 
              : daysUntilF2F <= 7 
                ? 'bg-orange-50 border-orange-200'
                : 'bg-blue-50 border-blue-200'
          }`}>
            <div className="flex items-start gap-2">
              {hasOverdueF2F ? (
                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
              ) : (
                <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
              )}
              <div>
                <div className={`font-medium ${
                  hasOverdueF2F ? 'text-red-800' : 'text-blue-800'
                }`}>
                  Face-to-Face Visit {hasOverdueF2F ? 'Overdue' : 'Required'}
                </div>
                <div className={`text-sm ${
                  hasOverdueF2F ? 'text-red-700' : 'text-blue-700'
                }`}>
                  Deadline: {format(currentPeriod.f2fDeadline, 'MMM dd, yyyy')} 
                  {hasOverdueF2F && (
                    <span className="ml-2 font-medium">
                      ({Math.abs(daysUntilF2F)} days overdue)
                    </span>
                  )}
                  {!hasOverdueF2F && daysUntilF2F >= 0 && (
                    <span className="ml-2">
                      ({daysUntilF2F} days remaining)
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* All Periods View Toggle */}
        {(showAllPeriods || expandedView) && allPeriods.length > 1 && (
          <>
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">All Benefit Periods</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpandedView(!expandedView)}
                >
                  {expandedView ? (
                    <>
                      <ChevronUp className="h-4 w-4 mr-1" />
                      Collapse
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4 mr-1" />
                      Expand All
                    </>
                  )}
                </Button>
              </div>
              
              {expandedView && (
                <div className="space-y-3">
                  {allPeriods.map((period) => 
                    renderPeriodCard(period, period.number === currentPeriod.number)
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {!showAllPeriods && !expandedView && allPeriods.length > 1 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExpandedView(true)}
            className="w-full"
          >
            <Info className="h-4 w-4 mr-2" />
            View All {allPeriods.length} Benefit Periods
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default BenefitPeriodTracker;