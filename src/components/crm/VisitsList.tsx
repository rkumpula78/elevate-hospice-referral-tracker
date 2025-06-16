
import React, { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Clock, CheckCircle, Calendar } from "lucide-react";
import { format } from "date-fns";

const VisitsList = () => {
  const [selectedType, setSelectedType] = useState<string>('all');

  const { data: visits, isLoading } = useQuery({
    queryKey: ['visits', selectedType],
    queryFn: async () => {
      let query = supabase
        .from('visits')
        .select('*, patients(first_name, last_name)')
        .order('scheduled_date', { ascending: true });

      if (selectedType !== 'all') {
        query = query.eq('visit_type', selectedType);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
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

  if (isLoading) {
    return <div>Loading visits...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex space-x-2">
          <Select value={selectedType} onValueChange={setSelectedType}>
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
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Schedule Visit
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Patient</TableHead>
            <TableHead>Staff</TableHead>
            <TableHead>Visit Type</TableHead>
            <TableHead>Scheduled Date</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {visits?.map((visit) => (
            <TableRow key={visit.id}>
              <TableCell className="font-medium">
                {visit.patients?.first_name} {visit.patients?.last_name}
              </TableCell>
              <TableCell>{visit.staff_name}</TableCell>
              <TableCell>
                <Badge className={getTypeColor(visit.visit_type)}>
                  {visit.visit_type}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center">
                  <Calendar className="w-3 h-3 mr-1" />
                  {format(new Date(visit.scheduled_date), 'MMM dd, yyyy HH:mm')}
                </div>
              </TableCell>
              <TableCell>
                {visit.duration_minutes ? `${visit.duration_minutes} mins` : '-'}
              </TableCell>
              <TableCell>
                <div className="flex items-center">
                  {visit.is_completed ? (
                    <>
                      <CheckCircle className="w-3 h-3 mr-1 text-green-500" />
                      <span className="text-green-600">Completed</span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-3 h-3 mr-1 text-yellow-500" />
                      <span className="text-yellow-600">Scheduled</span>
                    </>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  {!visit.is_completed && (
                    <Button variant="outline" size="sm">
                      Complete
                    </Button>
                  )}
                  <Button variant="outline" size="sm">
                    Edit
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default VisitsList;
