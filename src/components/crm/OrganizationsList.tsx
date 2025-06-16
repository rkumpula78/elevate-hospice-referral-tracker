
import React, { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Phone, Mail, MapPin, User } from "lucide-react";
import AddOrganizationDialog from './AddOrganizationDialog';

const OrganizationsList = () => {
  const [showAddDialog, setShowAddDialog] = useState(false);

  const { data: organizations, isLoading } = useQuery({
    queryKey: ['organizations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data;
    }
  });

  if (isLoading) {
    return <div>Loading organizations...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Referral Sources</h3>
          <p className="text-sm text-muted-foreground">Manage hospitals, clinics, and other referral sources</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Referral Source
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Organization</TableHead>
            <TableHead>Contact Person</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Assigned Marketer</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {organizations?.map((org) => (
            <TableRow key={org.id}>
              <TableCell className="font-medium">
                <div>
                  <div>{org.name}</div>
                  {org.address && (
                    <div className="text-sm text-muted-foreground flex items-center">
                      <MapPin className="w-3 h-3 mr-1" />
                      {org.address}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>{org.contact_person || '-'}</TableCell>
              <TableCell>
                {org.phone ? (
                  <div className="flex items-center">
                    <Phone className="w-3 h-3 mr-1" />
                    {org.phone}
                  </div>
                ) : '-'}
              </TableCell>
              <TableCell>
                {org.contact_email ? (
                  <div className="flex items-center">
                    <Mail className="w-3 h-3 mr-1" />
                    {org.contact_email}
                  </div>
                ) : '-'}
              </TableCell>
              <TableCell>
                {org.assigned_marketer ? (
                  <div className="flex items-center">
                    <User className="w-3 h-3 mr-1" />
                    {org.assigned_marketer}
                  </div>
                ) : '-'}
              </TableCell>
              <TableCell>
                <Button variant="outline" size="sm">
                  Edit
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AddOrganizationDialog 
        open={showAddDialog} 
        onOpenChange={setShowAddDialog} 
      />
    </div>
  );
};

export default OrganizationsList;
