
import React, { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Phone, Mail, MapPin, User, Edit } from "lucide-react";
import AddOrganizationDialog from './AddOrganizationDialog';
import EditOrganizationDialog from './EditOrganizationDialog';

const OrganizationsList = () => {
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingOrganizationId, setEditingOrganizationId] = useState<string | null>(null);

  const { data: organizations, isLoading } = useQuery({
    queryKey: ['organizations', selectedType, selectedStatus],
    queryFn: async () => {
      let query = supabase
        .from('organizations')
        .select('*')
        .order('name');

      if (selectedType !== 'all') {
        query = query.eq('type', selectedType);
      }
      if (selectedStatus !== 'all') {
        query = query.eq('is_active', selectedStatus === 'active');
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'assisted_living': return 'bg-green-100 text-green-800';
      case 'hospital': return 'bg-blue-100 text-blue-800';
      case 'clinic': return 'bg-pink-100 text-pink-800';
      case 'physician_office': return 'bg-purple-100 text-purple-800';
      case 'nursing_home': return 'bg-orange-100 text-orange-800';
      case 'home_health': return 'bg-cyan-100 text-cyan-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return <div>Loading organizations...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex space-x-2">
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="assisted_living">Assisted Living</SelectItem>
              <SelectItem value="hospital">Hospital</SelectItem>
              <SelectItem value="clinic">Cancer Center/Clinic</SelectItem>
              <SelectItem value="physician_office">Physician Office</SelectItem>
              <SelectItem value="nursing_home">Skilled Nursing</SelectItem>
              <SelectItem value="home_health">Home Health</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Organization
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Organization</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Contact Info</TableHead>
            <TableHead>Assigned Marketer</TableHead>
            <TableHead>Status</TableHead>
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
              <TableCell>
                <Badge className={getTypeColor(org.type)}>
                  {org.type.replace('_', ' ')}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  {org.contact_person && (
                    <div className="text-sm flex items-center">
                      <User className="w-3 h-3 mr-1" />
                      {org.contact_person}
                    </div>
                  )}
                  {org.phone && (
                    <div className="text-sm text-muted-foreground flex items-center">
                      <Phone className="w-3 h-3 mr-1" />
                      {org.phone}
                    </div>
                  )}
                  {org.contact_email && (
                    <div className="text-sm text-muted-foreground flex items-center">
                      <Mail className="w-3 h-3 mr-1" />
                      {org.contact_email}
                    </div>
                  )}
                </div>
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
                <Badge className={getStatusColor(org.is_active ?? true)}>
                  {org.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </TableCell>
              <TableCell>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setEditingOrganizationId(org.id)}
                >
                  <Edit className="w-3 h-3 mr-1" />
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
      
      {editingOrganizationId && (
        <EditOrganizationDialog
          open={!!editingOrganizationId}
          onOpenChange={(open) => !open && setEditingOrganizationId(null)}
          organizationId={editingOrganizationId}
        />
      )}
    </div>
  );
};

export default OrganizationsList;
