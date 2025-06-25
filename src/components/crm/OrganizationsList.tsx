
import React, { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Phone, Mail, MapPin, User, Edit, ExternalLink, Users, Building } from "lucide-react";
import { Link } from 'react-router-dom';
import EnhancedAddOrganizationDialog from './EnhancedAddOrganizationDialog';
import EditOrganizationDialog from './EditOrganizationDialog';
import OrganizationContactsDialog from './OrganizationContactsDialog';
import OrganizationKPICard from './OrganizationKPICard';
import OrganizationTrainingCard from './OrganizationTrainingCard';

const OrganizationsList = () => {
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedRating, setSelectedRating] = useState<string>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingOrganizationId, setEditingOrganizationId] = useState<string | null>(null);
  const [contactsOrganization, setContactsOrganization] = useState<{id: string, name: string} | null>(null);

  const { data: organizations, isLoading } = useQuery({
    queryKey: ['organizations', selectedType, selectedStatus, selectedRating],
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
      if (selectedRating !== 'all') {
        query = query.eq('account_rating', selectedRating);
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

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'prospect': return 'bg-gray-100 text-gray-800';
      case 'developing': return 'bg-blue-100 text-blue-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'strategic': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRatingColor = (rating: string | null) => {
    switch (rating) {
      case 'A': return 'bg-red-100 text-red-800';
      case 'B': return 'bg-orange-100 text-orange-800';
      case 'C': return 'bg-yellow-100 text-yellow-800';
      case 'P': return 'bg-blue-100 text-blue-800';
      case 'D': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getContractColor = (status: string | null) => {
    switch (status) {
      case 'exclusive': return 'bg-green-100 text-green-800';
      case 'preferred': return 'bg-blue-100 text-blue-800';
      case 'open': return 'bg-yellow-100 text-yellow-800';
      case 'competitive': return 'bg-orange-100 text-orange-800';
      case 'lost': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return <div>Loading organizations...</div>;
  }

  return (
    <div className="space-y-4 w-full max-w-full">
      <div className="flex justify-between items-center">
        <div className="flex space-x-2">
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-48 bg-white">
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

          <Select value={selectedRating} onValueChange={setSelectedRating}>
            <SelectTrigger className="w-40 bg-white">
              <SelectValue placeholder="Filter by rating" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Ratings</SelectItem>
              <SelectItem value="A">A - High Priority</SelectItem>
              <SelectItem value="B">B - Medium-High</SelectItem>
              <SelectItem value="C">C - Medium</SelectItem>
              <SelectItem value="P">P - Prospect</SelectItem>
              <SelectItem value="D">D - Low Priority</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-40 bg-white">
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

      <div className="w-full">
        <div className="rounded-md border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Organization</TableHead>
                <TableHead className="w-[100px]">Rating</TableHead>
                <TableHead className="w-[120px]">Type</TableHead>
                <TableHead className="w-[120px]">Contract</TableHead>
                <TableHead className="w-[140px]">Partnership Stage</TableHead>
                <TableHead className="w-[180px]">Contact Info</TableHead>
                <TableHead className="w-[120px]">Capacity</TableHead>
                <TableHead className="w-[140px]">Assigned Marketer</TableHead>
                <TableHead className="w-[100px]">Status</TableHead>
                <TableHead className="w-[160px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {organizations?.map((org) => (
                <TableRow key={org.id}>
                  <TableCell className="font-medium">
                    <div>
                      <div className="flex items-center space-x-2">
                        <Link 
                          to={`/organizations/${org.id}`}
                          className="hover:text-primary hover:underline"
                        >
                          {org.name}
                        </Link>
                        <ExternalLink className="w-3 h-3 text-muted-foreground" />
                      </div>
                      {org.dba_name && (
                        <div className="text-sm text-muted-foreground">
                          DBA: {org.dba_name}
                        </div>
                      )}
                      {org.address && (
                        <div className="text-sm text-muted-foreground flex items-center mt-1">
                          <MapPin className="w-3 h-3 mr-1" />
                          {org.address}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getRatingColor(org.account_rating)}>
                      {org.account_rating || 'C'}
                    </Badge>
                    {org.referral_potential && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Potential: {org.referral_potential}/10
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={getTypeColor(org.type)}>
                      {org.type.replace('_', ' ')}
                    </Badge>
                    {org.sub_type && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {org.sub_type}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={getContractColor(org.contract_status)}>
                      {(org.contract_status || 'open').charAt(0).toUpperCase() + 
                       (org.contract_status || 'open').slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStageColor(org.partnership_stage || 'prospect')}>
                      {(org.partnership_stage || 'prospect').charAt(0).toUpperCase() + 
                       (org.partnership_stage || 'prospect').slice(1)}
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
                    {org.bed_count ? (
                      <div className="flex items-center">
                        <Building className="w-3 h-3 mr-1" />
                        {org.bed_count} beds
                      </div>
                    ) : '-'}
                    {org.service_radius && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {org.service_radius} mile radius
                      </div>
                    )}
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
                    <div className="flex gap-1">
                      <Button 
                        size="sm"
                        variant="outline"
                        onClick={() => setContactsOrganization({id: org.id, name: org.name})}
                      >
                        <Users className="w-3 h-3" />
                      </Button>
                      <Button 
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingOrganizationId(org.id)}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <EnhancedAddOrganizationDialog 
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

      {contactsOrganization && (
        <OrganizationContactsDialog
          open={!!contactsOrganization}
          onOpenChange={(open) => !open && setContactsOrganization(null)}
          organizationId={contactsOrganization.id}
          organizationName={contactsOrganization.name}
        />
      )}
    </div>
  );
};

export default OrganizationsList;
