import React, { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Calendar, Clock, User } from "lucide-react";
import { format } from "date-fns";
import ScheduleVisitDialog from "./ScheduleVisitDialog";
import EditVisitDialog from "./EditVisitDialog";

type VisitType = 'admission' | 'routine' | 'urgent' | 'discharge';

const VisitsList = () => {
  const [selectedType, setSelectedType] = useState<VisitType | 'all'>('all');
  const [selectedStaff, setSelectedStaff] = useState<string>('all');
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedVisitId, setSelectedVisitId] = useState<string | null>(null);

  const { data: visits, isLoading } = useQuery({
    queryKey: ['visits', selectedType, selectedStaff],
    queryFn: async () => {
      let query = supabase
        .from('visits')
        .select('*, referrals(first_name, last_name, patient_name)');

      if (selectedType !== 'all') {
        query = query.eq('visit_type', selectedType);
      }
      if (selectedStaff !== 'all') {
        query = query.eq('staff_name', selectedStaff);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  // Get unique staff for filter
  const { data: staff } = useQuery({
    queryKey: ['visit-staff'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('visits')
        .select('staff_name')
        .not('staff_name', 'is', null);
      
      if (error) throw error;
      const uniqueStaff = [...new Set(data.map(v => v.staff_name).filter(Boolean))];
      return uniqueStaff;
    }
  });

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'admission': return 'bg-blue-100 text-blue-800';
      case 'routine': return 'bg-green-100 text-green-800';
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'discharge': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleVisitClick = (visitId: string) => {
    setSelectedVisitId(visitId);
    setShowEditDialog(true);
  };

  if (isLoading) {
    return <div>Loading visits...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex space-x-2">
          <Select value={selectedType} onValueChange={(value: VisitType | 'all') => setSelectedType(value)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="admission">Admission</SelectItem>
              <SelectItem value="routine">Routine</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="discharge">Discharge</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedStaff} onValueChange={setSelectedStaff}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by staff" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Staff</SelectItem>
              {staff?.map((staffMember) => (
                <SelectItem key={staffMember} value={staffMember}>{staffMember}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setShowScheduleDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Schedule Visit
        </Button>
      </div>

      <div className="space-y-3">
        {visits?.map((visit) => (
          <div 
            key={visit.id} 
            className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => handleVisitClick(visit.id)}
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center space-x-2">
                 <h3 className="font-medium">
                   {visit.referrals ? `${visit.referrals.first_name || ''} ${visit.referrals.last_name || ''}`.trim() || visit.referrals.patient_name : 'General Visit'}
                 </h3>
                <Badge className={getTypeColor(visit.visit_type)}>
                  {visit.visit_type}
                </Badge>
                {visit.is_completed && (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    Completed
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="space-y-1 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>{format(new Date(visit.scheduled_date), 'PPP')}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span>{format(new Date(visit.scheduled_date), 'p')}</span>
                {visit.duration_minutes && (
                  <span className="text-gray-400">({visit.duration_minutes} min)</span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span>{visit.staff_name}</span>
              </div>
            </div>
            
            {visit.notes && (
              <p className="text-sm text-gray-600 mt-2 line-clamp-2">{visit.notes}</p>
            )}
          </div>
        ))}
      </div>

      {visits?.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No visits found matching your criteria.
        </div>
      )}

      <ScheduleVisitDialog 
        open={showScheduleDialog} 
        onOpenChange={setShowScheduleDialog} 
      />

      <EditVisitDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        visitId={selectedVisitId}
      />
    </div>
  );
};

export default VisitsList;
