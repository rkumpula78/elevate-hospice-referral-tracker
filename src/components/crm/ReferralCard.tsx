
import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Phone, Building2, User, Edit, Calendar, AlertCircle, Clock, CheckCircle, Plus } from "lucide-react";
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
  onAddMarketer?: () => void;
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
  onAddMarketer
}: ReferralCardProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new_referral': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'contact_attempted': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'information_gathering': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'assessment_scheduled': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'pending_admission': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'admitted': return 'bg-green-100 text-green-800 border-green-200';
      case 'not_admitted_patient_choice': return 'bg-red-100 text-red-800 border-red-200';
      case 'not_admitted_not_appropriate': return 'bg-red-100 text-red-800 border-red-200';
      case 'not_admitted_lost_contact': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'deceased_prior_admission': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
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
      case 'urgent': return 'bg-red-500 text-white border-red-600';
      case 'routine': return 'bg-blue-500 text-white border-blue-600';
      case 'low': return 'bg-gray-500 text-white border-gray-600';
      default: return 'bg-gray-500 text-white border-gray-600';
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
    <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-l-4 border-l-primary/20 hover:border-l-primary">
      <CardContent className="p-6">
        {/* Header with Patient Name and Actions */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <Link 
              to={`/referral/${referral.id}`}
              className="hover:text-primary transition-colors group-hover:underline"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-1 truncate">
                {referral.patient_name}
              </h3>
            </Link>
            {referral.patient_phone && (
              <div className="flex items-center text-sm text-gray-600 mb-2">
                <Phone className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="font-medium">{referral.patient_phone}</span>
              </div>
            )}
          </div>
          <div className="flex gap-1 ml-4 flex-shrink-0">
            <Button variant="outline" size="sm" onClick={() => onEdit(referral.id)} className="h-8 px-2">
              <Edit className="w-3 h-3" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleSchedule} className="h-8 px-2">
              <Calendar className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* Organization */}
        <div className="flex items-center mb-4 p-3 bg-gray-50 rounded-lg">
          <Building2 className="w-5 h-5 text-gray-500 mr-3 flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="font-medium text-gray-900 truncate">{referral.organizations?.name || 'Unknown Organization'}</div>
            <div className="text-sm text-gray-600">{referral.organizations?.type}</div>
          </div>
        </div>

        {/* Diagnosis and Priority */}
        <div className="mb-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0 mr-4">
              <div className="text-sm text-gray-600 mb-1">Diagnosis</div>
              <div className="font-medium text-gray-900">{referral.diagnosis || 'Not specified'}</div>
            </div>
            <div className="flex-shrink-0">
              <Select
                value={referral.priority || 'routine'}
                onValueChange={(value: string) => onPriorityChange(referral.id, value)}
                disabled={isUpdatingPriority}
              >
                <SelectTrigger className="w-32 h-8">
                  <Badge className={cn("border text-xs", getPriorityColor(referral.priority || 'routine'))}>
                    {getPriorityIcon(referral.priority || 'routine')}
                    <span className="ml-1 capitalize">{referral.priority || 'routine'}</span>
                  </Badge>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="routine">Routine</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Status with Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Status</span>
            <Select
              value={referral.status || 'new_referral'}
              onValueChange={(value: string) => onStatusChange(referral.id, value)}
              disabled={isUpdatingStatus}
            >
              <SelectTrigger className="w-48">
                <Badge className={cn("border text-sm", getStatusColor(referral.status || 'new_referral'))}>
                  {getStatusLabel(referral.status || 'new_referral')}
                </Badge>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new_referral">New Referral</SelectItem>
                <SelectItem value="contact_attempted">Contact Attempted</SelectItem>
                <SelectItem value="information_gathering">Information Gathering</SelectItem>
                <SelectItem value="assessment_scheduled">Assessment Scheduled</SelectItem>
                <SelectItem value="pending_admission">Pending Admission</SelectItem>
                <SelectItem value="admitted">Admitted</SelectItem>
                <SelectItem value="not_admitted_patient_choice">Not Admitted - Patient Choice</SelectItem>
                <SelectItem value="not_admitted_not_appropriate">Not Admitted - Not Appropriate</SelectItem>
                <SelectItem value="not_admitted_lost_contact">Not Admitted - Lost Contact</SelectItem>
                <SelectItem value="deceased_prior_admission">Deceased Prior to Admission</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Progress Bar */}
          {progressPercentage > 0 && (
            <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
              <div 
                className="bg-primary rounded-full h-2 transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          )}
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
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
              <User className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-gray-500 mb-1">Assigned Marketer</div>
              <Select
                value={referral.assigned_marketer || 'unassigned'}
                onValueChange={(value: string) => {
                  if (value === 'add_new') {
                    onAddMarketer?.();
                  } else {
                    onMarketerChange(referral.id, value === 'unassigned' ? '' : value);
                  }
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
                <SelectContent>
                  <SelectItem value="unassigned">
                    <span className="text-gray-500 italic">Unassigned</span>
                  </SelectItem>
                  {marketers?.map((marketer: string) => (
                    <SelectItem key={marketer} value={marketer}>{marketer}</SelectItem>
                  ))}
                  <SelectItem value="add_new">
                    <div className="flex items-center text-primary">
                      <Plus className="w-4 h-4 mr-2" />
                      Add New Marketer
                    </div>
                  </SelectItem>
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
