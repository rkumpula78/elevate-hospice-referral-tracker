
import React, { useState } from 'react';
import { Calendar, momentLocalizer, View } from 'react-big-calendar';
import moment from 'moment';
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import ScheduleVisitDialog from "./ScheduleVisitDialog";
import EditVisitDialog from "./EditVisitDialog";
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

type VisitType = 'admission' | 'routine' | 'urgent' | 'discharge';

const CalendarView = () => {
  const [selectedType, setSelectedType] = useState<VisitType | 'all'>('all');
  const [selectedStaff, setSelectedStaff] = useState<string>('all');
  const [view, setView] = useState<View>('month');
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedVisitId, setSelectedVisitId] = useState<string | null>(null);

  const { data: visits, isLoading } = useQuery({
    queryKey: ['visits', selectedType, selectedStaff],
    queryFn: async () => {
      let query = supabase
        .from('visits')
        .select(`
          *, 
          patients(first_name, last_name),
          referrals!visits_patient_id_fkey(referring_facility)
        `);

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

  const handleEventClick = (event: any) => {
    setSelectedVisitId(event.id);
    setShowEditDialog(true);
  };

  const handleSelectEvent = (event: any) => {
    handleEventClick(event);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'admission': return '#3b82f6'; // blue
      case 'routine': return '#10b981'; // green
      case 'urgent': return '#ef4444'; // red
      case 'discharge': return '#f59e0b'; // yellow
      default: return '#6b7280'; // gray
    }
  };

  const createEventTitle = (visit: any) => {
    // Try to get patient name first
    if (visit.patients?.first_name || visit.patients?.last_name) {
      const patientName = `${visit.patients.first_name || ''} ${visit.patients.last_name || ''}`.trim();
      return `${patientName} - ${visit.visit_type}`;
    }
    
    // Try to get facility name from referrals
    if (visit.referrals?.referring_facility) {
      return `${visit.referrals.referring_facility} - ${visit.visit_type}`;
    }
    
    // Fallback to staff name and visit type
    return `${visit.staff_name} - ${visit.visit_type}`;
  };

  const calendarEvents = visits?.map(visit => ({
    id: visit.id,
    title: createEventTitle(visit),
    start: new Date(visit.scheduled_date),
    end: visit.duration_minutes 
      ? new Date(new Date(visit.scheduled_date).getTime() + visit.duration_minutes * 60000)
      : new Date(new Date(visit.scheduled_date).getTime() + 60 * 60000), // default 1 hour
    resource: {
      visit,
      color: getTypeColor(visit.visit_type)
    }
  })) || [];

  const eventStyleGetter = (event: any) => {
    return {
      style: {
        backgroundColor: event.resource.color,
        borderRadius: '4px',
        opacity: event.resource.visit.is_completed ? 0.6 : 1,
        color: 'white',
        border: '0px',
        display: 'block'
      }
    };
  };

  if (isLoading) {
    return <div>Loading calendar...</div>;
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

      <div className="h-[600px] bg-white rounded-lg border p-4">
        <Calendar
          localizer={localizer}
          events={calendarEvents}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          eventPropGetter={eventStyleGetter}
          view={view}
          onView={setView}
          views={['month', 'week', 'day', 'agenda']}
          popup={true}
          showMultiDayTimes={true}
          onSelectEvent={handleSelectEvent}
        />
      </div>

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

export default CalendarView;
