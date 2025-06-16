
import React, { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Phone, Calendar, FileText, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { format } from "date-fns";

type PatientStatus = 'active' | 'discharged' | 'deceased' | 'transferred';
type SortField = 'first_name' | 'last_name' | 'date_of_birth' | 'diagnosis' | 'physician' | 'status' | 'admission_date';
type SortDirection = 'asc' | 'desc';

const PatientsList = () => {
  const [selectedStatus, setSelectedStatus] = useState<PatientStatus | 'all'>('all');
  const [selectedPhysician, setSelectedPhysician] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('admission_date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const { data: patients, isLoading } = useQuery({
    queryKey: ['patients', selectedStatus, selectedPhysician, sortField, sortDirection],
    queryFn: async () => {
      let query = supabase
        .from('patients')
        .select('*, referrals(patient_name, diagnosis)')
        .order(sortField, { ascending: sortDirection === 'asc' });

      if (selectedStatus !== 'all') {
        query = query.eq('status', selectedStatus);
      }
      if (selectedPhysician !== 'all') {
        query = query.eq('physician', selectedPhysician);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  // Get unique physicians for filter
  const { data: physicians } = useQuery({
    queryKey: ['patient-physicians'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patients')
        .select('physician')
        .not('physician', 'is', null);
      
      if (error) throw error;
      const uniquePhysicians = [...new Set(data.map(p => p.physician).filter(Boolean))];
      return uniquePhysicians;
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'discharged': return 'bg-blue-100 text-blue-800';
      case 'deceased': return 'bg-gray-100 text-gray-800';
      case 'transferred': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return <div>Loading patients...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex space-x-2">
          <Select value={selectedStatus} onValueChange={(value: PatientStatus | 'all') => setSelectedStatus(value)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="discharged">Discharged</SelectItem>
              <SelectItem value="deceased">Deceased</SelectItem>
              <SelectItem value="transferred">Transferred</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedPhysician} onValueChange={setSelectedPhysician}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by physician" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Physicians</SelectItem>
              {physicians?.map((physician) => (
                <SelectItem key={physician} value={physician}>{physician}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Patient
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <Button variant="ghost" onClick={() => handleSort('first_name')} className="h-auto p-0 font-medium">
                Patient Name{getSortIcon('first_name')}
              </Button>
            </TableHead>
            <TableHead>
              <Button variant="ghost" onClick={() => handleSort('date_of_birth')} className="h-auto p-0 font-medium">
                Date of Birth{getSortIcon('date_of_birth')}
              </Button>
            </TableHead>
            <TableHead>
              <Button variant="ghost" onClick={() => handleSort('diagnosis')} className="h-auto p-0 font-medium">
                Diagnosis{getSortIcon('diagnosis')}
              </Button>
            </TableHead>
            <TableHead>
              <Button variant="ghost" onClick={() => handleSort('physician')} className="h-auto p-0 font-medium">
                Physician{getSortIcon('physician')}
              </Button>
            </TableHead>
            <TableHead>
              <Button variant="ghost" onClick={() => handleSort('status')} className="h-auto p-0 font-medium">
                Status{getSortIcon('status')}
              </Button>
            </TableHead>
            <TableHead>
              <Button variant="ghost" onClick={() => handleSort('admission_date')} className="h-auto p-0 font-medium">
                Admission Date{getSortIcon('admission_date')}
              </Button>
            </TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {patients?.map((patient) => (
            <TableRow key={patient.id}>
              <TableCell className="font-medium">
                <div>
                  <div>{patient.first_name} {patient.last_name}</div>
                  {patient.phone && (
                    <div className="text-sm text-muted-foreground flex items-center">
                      <Phone className="w-3 h-3 mr-1" />
                      {patient.phone}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                {patient.date_of_birth && format(new Date(patient.date_of_birth), 'MMM dd, yyyy')}
              </TableCell>
              <TableCell>{patient.diagnosis}</TableCell>
              <TableCell>{patient.physician}</TableCell>
              <TableCell>
                <Badge className={getStatusColor(patient.status || 'active')}>
                  {patient.status || 'active'}
                </Badge>
              </TableCell>
              <TableCell>
                {patient.admission_date && format(new Date(patient.admission_date), 'MMM dd, yyyy')}
              </TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    <Calendar className="w-3 h-3 mr-1" />
                    Schedule Visit
                  </Button>
                  <Button variant="outline" size="sm">
                    <FileText className="w-3 h-3 mr-1" />
                    Notes
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

export default PatientsList;
