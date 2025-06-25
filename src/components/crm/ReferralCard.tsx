
import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Phone, Building2, User, Edit, Calendar, Check, X, ExternalLink, AlertCircle, Clock, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface ReferralCardProps {
  referral: any;
  marketers: string[];
  editingMarketer: string | null;
  tempMarketerValue: string;
  isUpdatingStatus: boolean;
  isUpdatingPriority: boolean;
  isUpdatingMarketer: boolean;
  onStatusChange: (id: string, status: string) => void;
  onPriorityChange: (id: string, priority: string) => void;
  onMarketerEdit: (id: string, currentMarketer: string | null) => void;
  onMarketerSave: (id: string) => void;
  onMarketerCancel: () => void;
  onTempMarketerChange: (value: string) => void;
  onEdit: (id: string) => void;
}

const ReferralCard = ({ 
  referral, 
  marketers,
  editingMarketer,
  tempMarketerValue,
  isUpdatingStatus,
  isUpdatingPriority,
  isUpdatingMarketer,
  onStatusChange,
  onPriorityChange,
  onMarketerEdit,
  onMarketerSave,
  onMarketerCancel,
  onTempMarketerChange,
  onEdit
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

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-l-4 border-l-primary/20 hover:border-l-primary">
      <CardContent className="p-6">
        {/* Header with Patient Name and Phone */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <Link 
              to={`/referral/${referral.id}`}
              className="hover:text-primary transition-colors group-hover:underline"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-1 flex items-center gap-2">
                {referral.patient_name}
                <ExternalLink className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
              </h3>
            </Link>
            {referral.patient_phone && (
              <div className="flex items-center text-sm text-gray-600 mb-2">
                <Phone className="w-4 h-4 mr-2" />
                <span className="font-medium">{referral.patient_phone}</span>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onEdit(referral.id)}>
              <Edit className="w-4 h-4 mr-1" />
              Edit
            </Button>
            <Button variant="outline" size="sm">
              <Calendar className="w-4 h-4 mr-1" />
              Schedule
            </Button>
          </div>
        </div>

        {/* Organization */}
        <div className="flex items-center mb-4 p-3 bg-gray-50 rounded-lg">
          <Building2 className="w-5 h-5 text-gray-500 mr-3" />
          <div>
            <div className="font-medium text-gray-900">{referral.organizations?.name || 'Unknown Organization'}</div>
            <div className="text-sm text-gray-600">{referral.organizations?.type}</div>
          </div>
        </div>

        {/* Diagnosis and Priority */}
        <div className="mb-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="text-sm text-gray-600 mb-1">Diagnosis</div>
              <div className="font-medium text-gray-900">{referral.diagnosis || 'Not specified'}</div>
            </div>
            <div className="ml-4">
              <Select
                value={referral.priority || 'routine'}
                onValueChange={(value: string) => onPriorityChange(referral.id, value)}
                disabled={isUpdatingPriority}
              >
                <SelectTrigger className="w-32">
                  <Badge className={cn("border", getPriorityColor(referral.priority || 'routine'))}>
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
          <div className="flex items-center">
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mr-3">
              <User className="w-4 h-4 text-primary" />
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Assigned Marketer</div>
              {editingMarketer === referral.id ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={tempMarketerValue}
                    onChange={(e) => onTempMarketerChange(e.target.value)}
                    placeholder="Enter marketer name"
                    className="w-40 h-8 text-sm"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        onMarketerSave(referral.id);
                      } else if (e.key === 'Escape') {
                        onMarketerCancel();
                      }
                    }}
                    autoFocus
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    onClick={() => onMarketerSave(referral.id)}
                    disabled={isUpdatingMarketer}
                  >
                    <Check className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    onClick={onMarketerCancel}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ) : (
                <div
                  className="font-medium text-gray-900 cursor-pointer hover:text-primary transition-colors"
                  onClick={() => onMarketerEdit(referral.id, referral.assigned_marketer)}
                >
                  {referral.assigned_marketer || (
                    <span className="text-gray-500 italic">Click to assign</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReferralCard;
