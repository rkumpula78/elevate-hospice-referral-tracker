
import React, { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Phone, Calendar, FileText } from "lucide-react";
import { format } from "date-fns";

const PatientsList = () => {
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const { data: patients, isLoading } = useQuery({
    queryKey: ['patients', selectedStatus],
    queryFn: async () => {
      let query = supabase
        .from('patients')
        .select('*, referrals(patient_name, diagnosis)')
        .order('created_at', { ascending: false });

      if (selectedStatus !== 'all') {
        query = query.eq('status', selectedStatus);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

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
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
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
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Patient
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Patient Name</TableHead>
            <TableHead>Date of Birth</TableHead>
            <TableHead>Diagnosis</TableHead>
            <TableHead>Physician</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Admission Date</TableHead>
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
