

import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Phone, Building2, User, Edit, Calendar, AlertCircle, Clock, CheckCircle, Plus, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { format, differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface ReferralCardProps {
  referral: any;
  marketers: string[];
  isUpdatingStatus: boolean;
  isUpdatingPriority: boolean;
  isUpdatingMarketer: boolean;
  onStatusChange: (id: string, status: string) => void;
  onPriorityChange: (id: string, priority: string) => void;
  onMarketerChange: (id: string, marketer: string) => void;
  onEdit: (id: string) => void;
  onSchedule?: (id: string) => void;
  isSelected?: boolean;
  onSelectChange?: (id: string, selected: boolean) => void;
}

const ReferralCard = ({ 
  referral, 
  marketers,
  isUpdatingStatus,
  isUpdatingPriority,
  isUpdatingMarketer,
  onStatusChange,
  onPriorityChange,
  onMarketerChange,
  onEdit,
  onSchedule,
  isSelected = false,
  onSelectChange,
}: ReferralCardProps) => {
  const isMobile = useIsMobile();
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new_referral': return 'modern-badge pending';
      case 'contact_attempted': return 'modern-badge routine';
      case 'information_gathering': return 'modern-badge routine';
      case 'assessment_scheduled': return 'modern-badge contacted';
      case 'pending_admission': return 'modern-badge pending';
      case 'admitted': return 'modern-badge contacted';
      case 'not_admitted_patient_choice': return 'modern-badge';
      case 'not_admitted_not_appropriate': return 'modern-badge';
      case 'not_admitted_lost_contact': return 'modern-badge';
      case 'deceased_prior_admission': return 'modern-badge';
      default: return 'modern-badge';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'new_referral': return 'New Referral';
      case 'contact_attempted': return 'Contact Attempted';
      case 'information_gathering': return 'Information Gathering';
      case 'assessment_scheduled': return 'Assessment Scheduled';
      case 'pending_admission': return 'Pending Admission';
      case 'admitted': return 'Admitted';
      case 'not_admitted_patient_choice': return 'Not Admitted - Patient Choice';
      case 'not_admitted_not_appropriate': return 'Not Admitted - Not Appropriate';
      case 'not_admitted_lost_contact': return 'Not Admitted - Lost Contact';
      case 'deceased_prior_admission': return 'Deceased Prior to Admission';
      default: return status;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'modern-badge urgent';
      case 'routine': return 'modern-badge routine';
      case 'low': return 'modern-badge';
      default: return 'modern-badge routine';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return <AlertCircle className="w-3 h-3" />;
      case 'routine': return <Clock className="w-3 h-3" />;
      case 'low': return <CheckCircle className="w-3 h-3" />;
      default: return <Clock className="w-3 h-3" />;
    }
  };

  const getStatusProgress = (status: string) => {
    const statusMap: Record<string, number> = {
      'new_referral': 10,
      'contact_attempted': 30,
      'information_gathering': 50,
      'assessment_scheduled': 70,
      'pending_admission': 85,
      'admitted': 100,
      'admitted_our_hospice': 100
    };
    
    // Return 0 for "not_admitted" statuses
    if (status?.startsWith('not_admitted') || status === 'deceased_prior_admission') {
      return 0;
    }
    
    return statusMap[status] || 0;
  };

  const getProgressBarColor = (status: string) => {
    const colorMap: Record<string, string> = {
      'new_referral': 'bg-gray-400',
      'contact_attempted': 'bg-yellow-400',
      'information_gathering': 'bg-blue-300',
      'assessment_scheduled': 'bg-blue-500',
      'pending_admission': 'bg-purple-500',
      'admitted': 'bg-green-500',
      'admitted_our_hospice': 'bg-green-500'
    };
    
    // Red for not admitted statuses
    if (status?.startsWith('not_admitted') || status === 'deceased_prior_admission') {
      return 'bg-red-400';
    }
    
    return colorMap[status] || 'bg-gray-400';
  };

  const getNextStage = (status: string) => {
    const stageFlow: Record<string, string> = {
      'new_referral': 'Contact Attempted',
      'contact_attempted': 'Information Gathering',
      'information_gathering': 'Assessment Scheduled',
      'assessment_scheduled': 'Pending Admission',
      'pending_admission': 'Admitted',
      'admitted': 'Completed',
      'admitted_our_hospice': 'Completed'
    };
    
    return stageFlow[status] || 'N/A';
  };

  const getDaysInStage = () => {
    if (!referral.updated_at && !referral.created_at) return 0;
    const baseDate = referral.updated_at || referral.created_at;
    return differenceInDays(new Date(), new Date(baseDate));
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return {
          text: '🔥 URGENT',
          className: 'bg-red-500 text-white border-red-600'
        };
      case 'routine':
        return {
          text: 'ROUTINE',
          className: 'bg-blue-500 text-white border-blue-600'
        };
      case 'low':
        return {
          text: 'LOW',
          className: 'bg-gray-400 text-white border-gray-500'
        };
      default:
        return {
          text: 'ROUTINE',
          className: 'bg-blue-500 text-white border-blue-600'
        };
    }
  };

  const isUrgent = referral.priority === 'urgent';
  const priorityBadge = getPriorityBadge(referral.priority || 'routine');

  const progressPercentage = getStatusProgress(referral.status);
  const progressBarColor = getProgressBarColor(referral.status);
  const nextStage = getNextStage(referral.status);
  const daysInStage = getDaysInStage();

  const handleSchedule = () => {
    if (onSchedule) {
      onSchedule(referral.id);
    }
  };

  return (
    <Card className={cn(
      "modern-card group relative overflow-hidden transition-all duration-300 ease-out cursor-pointer max-w-full",
      "hover:scale-[1.02] hover:shadow-lg hover:-translate-y-1",
      isUrgent && "border-2 border-red-500 shadow-lg shadow-red-100 hover:shadow-red-200",
      isSelected && "border-2 border-primary shadow-lg shadow-primary/20"
    )}>
      {/* Selection Checkbox */}
      {onSelectChange && (
        <div className="absolute top-3 left-3 z-20">
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) => onSelectChange(referral.id, checked as boolean)}
            className="h-5 w-5 border-2 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
      
      {/* Pulsing Red Dot for Urgent Items */}
      {isUrgent && (
        <div className="absolute -top-1 -right-1 z-10">
          <div className="relative">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <div className="absolute top-0 left-0 w-3 h-3 bg-red-500 rounded-full animate-ping" />
          </div>
        </div>
      )}
      <CardContent className="p-3 sm:p-4 md:p-6 pl-12 max-w-full overflow-x-hidden">
        {/* Gradient accent line */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500"></div>
        
        {/* Patient Name - Most Prominent */}
        <div className="mb-4">
          <Link 
            to={`/referral/${referral.id}`}
            className="hover:text-primary transition-colors group-hover:underline"
          >
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 leading-tight">
              {referral.patient_name}
            </h2>
          </Link>
          
          {/* Patient Contact Information */}
          <div className="space-y-2">
            {referral.patient_phone && (
              <div className="flex items-center text-xs sm:text-sm text-gray-600">
                <Phone className="w-4 h-4 mr-2 flex-shrink-0 text-blue-500" />
                <span className="font-medium">{referral.patient_phone}</span>
              </div>
            )}
            
            {(referral.patient_address || referral.patient_city || referral.patient_state) && (
              <div className="flex items-start text-xs sm:text-sm text-gray-600">
                <MapPin className="w-4 h-4 mr-2 flex-shrink-0 text-blue-500 mt-0.5" />
                <div className="min-w-0 flex-1">
                  {referral.patient_address && (
                    <div className="truncate">{referral.patient_address}</div>
                  )}
                  {(referral.patient_city || referral.patient_state) && (
                    <div className="truncate">
                      {[referral.patient_city, referral.patient_state].filter(Boolean).join(', ')}
                      {referral.patient_zip && ` ${referral.patient_zip}`}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons - Accessible Touch Targets */}
        <div className="flex gap-2 mb-4">
          {isMobile ? (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onEdit(referral.id)} 
                className="h-11 px-4 text-sm flex-1 bg-gray-100 hover:bg-gray-200 border-gray-300 text-gray-900 font-semibold shadow-sm active:scale-95 transition-all"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              
              <Button 
                variant="default" 
                size="sm" 
                onClick={handleSchedule} 
                className="h-11 px-4 text-sm flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-sm active:scale-95 transition-all"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Schedule
              </Button>
            </>
          ) : (
            <>
              <TooltipProvider>
                <Tooltip delayDuration={300}>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => onEdit(referral.id)} 
                      className="h-9 px-3 text-xs flex-1 bg-gray-100 hover:bg-gray-200 border-gray-300 text-gray-900 font-semibold shadow-sm active:scale-95 transition-all"
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Edit referral details</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip delayDuration={300}>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="default" 
                      size="sm" 
                      onClick={handleSchedule} 
                      className="h-9 px-3 text-xs flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-sm active:scale-95 transition-all"
                    >
                      <Calendar className="w-3 h-3 mr-1" />
                      Schedule
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Schedule a visit</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </>
          )}
        </div>

        {/* Organization Section */}
        <div className="mb-3 sm:mb-4 p-3 sm:p-4 rounded-xl bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-100">
          <div className="flex items-center">
            <Building2 className="w-5 h-5 text-blue-500 mr-3 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="font-medium text-gray-900 truncate">{referral.organizations?.name || 'Unknown Organization'}</div>
              <div className="text-xs sm:text-sm text-gray-600">{referral.organizations?.type}</div>
            </div>
          </div>
        </div>

        {/* Diagnosis */}
        <div className="mb-3 sm:mb-4">
          <div className="text-xs sm:text-sm text-gray-600 mb-1">Diagnosis</div>
          <div className="text-sm sm:text-base font-medium text-gray-900">{referral.diagnosis || 'Not specified'}</div>
        </div>

        {/* Status with Priority Badge and Progress Bar */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm text-gray-600 font-medium">Status</span>
              {/* Priority Badge */}
              <Badge className={cn(
                "text-[10px] sm:text-xs font-bold px-2 py-0.5 border animate-fade-in transition-all duration-300",
                priorityBadge.className,
                isUpdatingStatus && "animate-pulse"
              )}>
                {priorityBadge.text}
              </Badge>
            </div>
            <Select
              value={referral.status || 'new_referral'}
              onValueChange={(value: string) => onStatusChange(referral.id, value)}
              disabled={isUpdatingStatus}
            >
              <SelectTrigger className="w-full sm:w-48 h-11 sm:h-10 bg-white hover:bg-gray-50 border-2 border-gray-300 hover:border-gray-400 transition-all duration-200 max-w-full shadow-sm">
                <Badge className={cn(
                  getStatusColor(referral.status || 'new_referral'),
                  "animate-fade-in transition-all duration-300",
                  isUpdatingStatus && "animate-pulse"
                )}>
                  {getStatusLabel(referral.status || 'new_referral')}
                </Badge>
              </SelectTrigger>
              <SelectContent className="modern-dropdown">
                <SelectItem value="new_referral" className="modern-dropdown-item">New Referral</SelectItem>
                <SelectItem value="contact_attempted" className="modern-dropdown-item">Contact Attempted</SelectItem>
                <SelectItem value="information_gathering" className="modern-dropdown-item">Information Gathering</SelectItem>
                <SelectItem value="assessment_scheduled" className="modern-dropdown-item">Assessment Scheduled</SelectItem>
                <SelectItem value="pending_admission" className="modern-dropdown-item">Pending Admission</SelectItem>
                <SelectItem value="admitted" className="modern-dropdown-item">Admitted</SelectItem>
                <SelectItem value="not_admitted_patient_choice" className="modern-dropdown-item">Not Admitted - Patient Choice</SelectItem>
                <SelectItem value="not_admitted_not_appropriate" className="modern-dropdown-item">Not Admitted - Not Appropriate</SelectItem>
                <SelectItem value="not_admitted_lost_contact" className="modern-dropdown-item">Not Admitted - Lost Contact</SelectItem>
                <SelectItem value="deceased_prior_admission" className="modern-dropdown-item">Deceased Prior to Admission</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Enhanced Progress Bar with Color Coding */}
          {progressPercentage > 0 && (
            isMobile ? (
              <div className="space-y-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-500">Progress</span>
                  <span className="text-xs font-semibold text-gray-700">{progressPercentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className={cn(
                      "h-2.5 rounded-full transition-all duration-700 ease-in-out",
                      progressBarColor
                    )}
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>
            ) : (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-500">Progress</span>
                        <span className="text-xs font-semibold text-gray-700">{progressPercentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden cursor-help">
                        <div 
                          className={cn(
                            "h-2.5 rounded-full transition-all duration-700 ease-in-out",
                            progressBarColor
                          )}
                          style={{ width: `${progressPercentage}%` }}
                        />
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="bg-gray-900 text-white p-3 max-w-xs">
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">Current Stage</p>
                        <p className="text-sm font-semibold">{getStatusLabel(referral.status)}</p>
                      </div>
                      {nextStage !== 'Completed' && nextStage !== 'N/A' && (
                        <div>
                          <p className="text-xs text-gray-400 mb-0.5">Next Stage</p>
                          <p className="text-sm">{nextStage}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">Days in Current Stage</p>
                        <p className="text-sm">{daysInStage} {daysInStage === 1 ? 'day' : 'days'}</p>
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )
          )}
        </div>

        {/* Priority Status - Below Main Status */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs sm:text-sm text-gray-600 font-medium">Priority</span>
          <Select
            value={referral.priority || 'routine'}
            onValueChange={(value: string) => onPriorityChange(referral.id, value)}
            disabled={isUpdatingPriority}
          >
            <SelectTrigger className="w-full sm:w-28 h-11 sm:h-10 bg-white hover:bg-gray-50 border-2 border-gray-300 hover:border-gray-400 max-w-full shadow-sm transition-all">
              <Badge className={getPriorityColor(referral.priority || 'routine')}>
                {getPriorityIcon(referral.priority || 'routine')}
                <span className="ml-1 capitalize text-xs">{referral.priority || 'routine'}</span>
              </Badge>
            </SelectTrigger>
            <SelectContent className="modern-dropdown">
              <SelectItem value="urgent" className="modern-dropdown-item">Urgent</SelectItem>
              <SelectItem value="routine" className="modern-dropdown-item">Routine</SelectItem>
              <SelectItem value="low" className="modern-dropdown-item">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Referral Date */}
        {referral.referral_date && (
          <div className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
            Referred: {format(new Date(referral.referral_date), 'MMM dd, yyyy')}
          </div>
        )}

        {/* Assigned Marketer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center flex-1 min-w-0">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-gray-500 mb-1">Assigned Marketer</div>
              <Select
                value={referral.assigned_marketer || 'unassigned'}
                onValueChange={(value: string) => {
                  onMarketerChange(referral.id, value === 'unassigned' ? '' : value);
                }}
                disabled={isUpdatingMarketer}
              >
                <SelectTrigger className="w-full h-10 sm:h-8 border-none p-0 focus:ring-0 focus:ring-offset-0">
                  <SelectValue>
                    <span className={cn(
                      "font-medium transition-colors text-sm",
                      referral.assigned_marketer ? "text-gray-900" : "text-gray-500 italic"
                    )}>
                      {referral.assigned_marketer || "Click to assign"}
                    </span>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="modern-dropdown">
                  <SelectItem value="unassigned" className="modern-dropdown-item">
                    <span className="text-gray-500 italic">Unassigned</span>
                  </SelectItem>
                  {marketers?.map((marketer: string) => (
                    <SelectItem key={marketer} value={marketer} className="modern-dropdown-item">{marketer}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReferralCard;
