
import React, { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Clock, CheckCircle, Calendar, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { format } from "date-fns";

type VisitType = 'admission' | 'routine' | 'urgent' | 'discharge';
type SortField = 'patients.first_name' | 'staff_name' | 'visit_type' | 'scheduled_date' | 'duration_minutes' | 'is_completed';
type SortDirection = 'asc' | 'desc';

const VisitsList = () => {
  const [selectedType, setSelectedType] = useState<VisitType | 'all'>('all');
  const [selectedStaff, setSelectedStaff] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('scheduled_date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const { data: visits, isLoading } = useQuery({
    queryKey: ['visits', selectedType, selectedStaff, sortField, sortDirection],
    queryFn: async () => {
      let query = supabase
        .from('visits')
        .select('*, patients(first_name, last_name)')
        .order(sortField === 'patients.first_name' ? 'patients(first_name)' : sortField, { ascending: sortDirection === 'asc' });

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

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 ml-1" />;
    return sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 ml-1" /> : <ArrowDown className="w-3 h-3 ml-1" />;
  };

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
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Schedule Visit
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <Button variant="ghost" onClick={() => handleSort('patients.first_name')} className="h-auto p-0 font-medium">
                Patient{getSortIcon('patients.first_name')}
              </Button>
            </TableHead>
            <TableHead>
              <Button variant="ghost" onClick={() => handleSort('staff_name')} className="h-auto p-0 font-medium">
                Staff{getSortIcon('staff_name')}
              </Button>
            </TableHead>
            <TableHead>
              <Button variant="ghost" onClick={() => handleSort('visit_type')} className="h-auto p-0 font-medium">
                Visit Type{getSortIcon('visit_type')}
              </Button>
            </TableHead>
            <TableHead>
              <Button variant="ghost" onClick={() => handleSort('scheduled_date')} className="h-auto p-0 font-medium">
                Scheduled Date{getSortIcon('scheduled_date')}
              </Button>
            </TableHead>
            <TableHead>
              <Button variant="ghost" onClick={() => handleSort('duration_minutes')} className="h-auto p-0 font-medium">
                Duration{getSortIcon('duration_minutes')}
              </Button>
            </TableHead>
            <TableHead>
              <Button variant="ghost" onClick={() => handleSort('is_completed')} className="h-auto p-0 font-medium">
                Status{getSortIcon('is_completed')}
              </Button>
            </TableHead>
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
