
import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Phone, Building2, User, Edit, Calendar, AlertCircle, Clock, CheckCircle, Plus, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

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
  onSchedule
}: ReferralCardProps) => {
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
    const statusOrder = [
      'new_referral',
      'contact_attempted', 
      'information_gathering',
      'assessment_scheduled',
      'pending_admission',
      'admitted'
    ];
    const currentIndex = statusOrder.indexOf(status);
    return currentIndex >= 0 ? ((currentIndex + 1) / statusOrder.length) * 100 : 0;
  };

  const progressPercentage = getStatusProgress(referral.status);

  const handleSchedule = () => {
    if (onSchedule) {
      onSchedule(referral.id);
    }
  };

  return (
    <Card className="modern-card group relative overflow-hidden">
      <CardContent className="p-6">
        {/* Gradient accent line */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500"></div>
        
        {/* Patient Name - Most Prominent */}
        <div className="mb-4">
          <Link 
            to={`/referral/${referral.id}`}
            className="hover:text-primary transition-colors group-hover:underline"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-3 leading-tight">
              {referral.patient_name}
            </h2>
          </Link>
          
          {/* Patient Contact Information */}
          <div className="space-y-2">
            {referral.patient_phone && (
              <div className="flex items-center text-sm text-gray-600">
                <Phone className="w-4 h-4 mr-2 flex-shrink-0 text-blue-500" />
                <span className="font-medium">{referral.patient_phone}</span>
              </div>
            )}
            
            {(referral.patient_address || referral.patient_city || referral.patient_state) && (
              <div className="flex items-start text-sm text-gray-600">
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

        {/* Action Buttons - Smaller Size */}
        <div className="flex gap-2 mb-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onEdit(referral.id)} 
            className="modern-btn-secondary h-7 px-2 text-xs flex-1"
          >
            <Edit className="w-3 h-3 mr-1" />
            Edit
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleSchedule} 
            className="modern-btn-primary h-7 px-2 text-xs flex-1"
          >
            <Calendar className="w-3 h-3 mr-1" />
            Schedule
          </Button>
        </div>

        {/* Organization Section */}
        <div className="mb-4 p-4 rounded-xl bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-100">
          <div className="flex items-center">
            <Building2 className="w-5 h-5 text-blue-500 mr-3 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="font-medium text-gray-900 truncate">{referral.organizations?.name || 'Unknown Organization'}</div>
              <div className="text-sm text-gray-600">{referral.organizations?.type}</div>
            </div>
          </div>
        </div>

        {/* Diagnosis */}
        <div className="mb-4">
          <div className="text-sm text-gray-600 mb-1">Diagnosis</div>
          <div className="font-medium text-gray-900">{referral.diagnosis || 'Not specified'}</div>
        </div>

        {/* Status with Progress Bar */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 font-medium">Status</span>
            <Select
              value={referral.status || 'new_referral'}
              onValueChange={(value: string) => onStatusChange(referral.id, value)}
              disabled={isUpdatingStatus}
            >
              <SelectTrigger className="w-48 modern-filter">
                <Badge className={getStatusColor(referral.status || 'new_referral')}>
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
          
          {/* Modern Progress Bar */}
          {progressPercentage > 0 && (
            <div className="w-full bg-gray-200 rounded-full h-2 mb-3 overflow-hidden">
              <div 
                className="h-2 rounded-full transition-all duration-500 bg-gradient-to-r from-blue-500 to-blue-600"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          )}
        </div>

        {/* Priority Status - Below Main Status */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-gray-600 font-medium">Priority</span>
          <Select
            value={referral.priority || 'routine'}
            onValueChange={(value: string) => onPriorityChange(referral.id, value)}
            disabled={isUpdatingPriority}
          >
            <SelectTrigger className="w-28 h-8 modern-filter">
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
          <div className="text-sm text-gray-600 mb-4">
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
                <SelectTrigger className="w-full h-8 border-none p-0 focus:ring-0 focus:ring-offset-0">
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
