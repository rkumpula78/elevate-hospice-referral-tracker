import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, MapPin, User, Edit, ExternalLink, Users, Building, Calendar, Phone } from "lucide-react";
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ViewToggle } from "@/components/ui/view-toggle";
import { SortHeader } from "@/components/ui/sort-header";
import { useToast } from "@/hooks/use-toast";
import EnhancedAddOrganizationDialog from './EnhancedAddOrganizationDialog';
import EditOrganizationDialog from './EditOrganizationDialog';
import OrganizationContactsDialog from './OrganizationContactsDialog';
import ScheduleVisitDialog from './ScheduleVisitDialog';
import EnhancedEditOrganizationDialog from './EnhancedEditOrganizationDialog';

const OrganizationsList = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedRating, setSelectedRating] = useState<string>('all');
  const [selectedMarketer, setSelectedMarketer] = useState<string>('all');
  const [view, setView] = useState<'card' | 'list'>('card');
  const [sortConfig, setSortConfig] = useState<{ field: string; direction: 'asc' | 'desc' } | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingOrganizationId, setEditingOrganizationId] = useState<string | null>(null);
  const [contactsOrganization, setContactsOrganization] = useState<{id: string, name: string} | null>(null);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);

  const { data: organizations, isLoading } = useQuery({
    queryKey: ['organizations', selectedType, selectedStatus, selectedRating, selectedMarketer],
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
      if (selectedMarketer !== 'all') {
        query = query.eq('assigned_marketer', selectedMarketer);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  const { data: marketers = [] } = useQuery({
    queryKey: ['marketers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .not('first_name', 'is', null)
        .not('last_name', 'is', null)
        .order('first_name');
      
      if (error) throw error;
      return (data || []).map(m => `${m.first_name} ${m.last_name}`);
    }
  });

  const updateMarketerMutation = useMutation({
    mutationFn: async ({ id, marketer }: { id: string, marketer: string }) => {
      const { error } = await supabase
        .from('organizations')
        .update({ assigned_marketer: marketer || null })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      toast({ title: "Marketer updated successfully" });
    },
    onError: () => {
      toast({ title: "Error updating marketer", variant: "destructive" });
    }
  });

  const handleSort = (field: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig?.field === field && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ field, direction });
  };

  const handleMarketerChange = (organizationId: string, marketer: string) => {
    updateMarketerMutation.mutate({ id: organizationId, marketer });
  };

  const sortedOrganizations = React.useMemo(() => {
    if (!organizations || !sortConfig) return organizations;

    return [...organizations].sort((a, b) => {
      const aValue = a[sortConfig.field as keyof typeof a];
      const bValue = b[sortConfig.field as keyof typeof b];
      
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      return sortConfig.direction === 'asc' 
        ? (aValue as any) - (bValue as any)
        : (bValue as any) - (aValue as any);
    });
  }, [organizations, sortConfig]);

  const getRatingColor = (rating: string | null) => {
    switch (rating) {
      case 'A': return 'bg-green-100 text-green-800 border-green-300';
      case 'B': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'C': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'P': return 'bg-blue-100 text-blue-800 border-blue-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusColor = (stage: string | null) => {
    switch (stage) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'prospect': return 'bg-blue-100 text-blue-800';
      case 'strategic': return 'bg-purple-100 text-purple-800';
      case 'developing': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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

  const renderListView = () => (
    <div className="bg-white rounded-lg shadow-sm border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <SortHeader label="Name" field="name" currentSort={sortConfig} onSort={handleSort} />
            </TableHead>
            <TableHead>
              <SortHeader label="Type" field="type" currentSort={sortConfig} onSort={handleSort} />
            </TableHead>
            <TableHead>
              <SortHeader label="Rating" field="account_rating" currentSort={sortConfig} onSort={handleSort} />
            </TableHead>
            <TableHead>
              <SortHeader label="Stage" field="partnership_stage" currentSort={sortConfig} onSort={handleSort} />
            </TableHead>
            <TableHead>
              <SortHeader label="Contact" field="contact_person" currentSort={sortConfig} onSort={handleSort} />
            </TableHead>
            <TableHead>
              <SortHeader label="Marketer" field="assigned_marketer" currentSort={sortConfig} onSort={handleSort} />
            </TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedOrganizations?.map((org) => (
            <TableRow key={org.id}>
              <TableCell>
                <div>
                  <Link 
                    to={`/organizations/${org.id}`}
                    className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    {org.name}
                  </Link>
                  {org.dba_name && (
                    <div className="text-sm text-gray-500">DBA: {org.dba_name}</div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge className={getTypeColor(org.type)}>
                  {org.type.replace('_', ' ')}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge className={`font-bold ${getRatingColor(org.account_rating)}`}>
                  {org.account_rating || 'C'}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge className={getStatusColor(org.partnership_stage)}>
                  {(org.partnership_stage || 'prospect').charAt(0).toUpperCase() + 
                   (org.partnership_stage || 'prospect').slice(1)}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  <div>{org.contact_person || 'N/A'}</div>
                  {org.phone && <div className="text-gray-500">{org.phone}</div>}
                </div>
              </TableCell>
              <TableCell>
                <Select
                  value={org.assigned_marketer || 'unassigned'}
                  onValueChange={(value) => handleMarketerChange(org.id, value === 'unassigned' ? '' : value)}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Assign marketer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {marketers?.map((marketer: string) => (
                      <SelectItem key={marketer} value={marketer}>
                        {marketer}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                <div className="flex space-x-2">
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
  );

  const renderCardView = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {sortedOrganizations?.map((org) => (
        <Card key={org.id} className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <CardTitle className="text-lg font-semibold text-gray-900 mb-1">
                  <Link 
                    to={`/organizations/${org.id}`}
                    className="hover:text-primary hover:underline flex items-center space-x-2"
                  >
                    <span>{org.name}</span>
                    <ExternalLink className="w-3 h-3 text-muted-foreground" />
                  </Link>
                </CardTitle>
                <Badge className={getTypeColor(org.type)}>
                  {org.type.replace('_', ' ')}
                </Badge>
                {org.dba_name && (
                  <p className="text-sm text-gray-600 mt-1">DBA: {org.dba_name}</p>
                )}
              </div>
              <div className="flex flex-col items-end space-y-2">
                <Badge className={`font-bold ${getRatingColor(org.account_rating)}`}>
                  {org.account_rating || 'C'}
                </Badge>
                <Badge className={getStatusColor(org.partnership_stage)}>
                  {(org.partnership_stage || 'prospect').charAt(0).toUpperCase() + 
                   (org.partnership_stage || 'prospect').slice(1)}
                </Badge>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Marketer Assignment */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Assigned Marketer</label>
              <Select
                value={org.assigned_marketer || 'unassigned'}
                onValueChange={(value) => handleMarketerChange(org.id, value === 'unassigned' ? '' : value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Assign marketer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {marketers?.map((marketer: string) => (
                    <SelectItem key={marketer} value={marketer}>
                      {marketer}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Key Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-blue-800">YTD Referrals</span>
                </div>
                <p className="text-xl font-bold text-blue-900">0</p>
              </div>
              {org.bed_count && org.bed_count > 0 && (
                <div className="bg-purple-50 p-3 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Building className="w-4 h-4 text-purple-600" />
                    <span className="text-sm text-purple-800">Beds</span>
                  </div>
                  <p className="text-xl font-bold text-purple-900">{org.bed_count}</p>
                </div>
              )}
            </div>

            {/* Contact Info */}
            <div className="space-y-2">
              {org.address && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>{org.address}</span>
                </div>
              )}
              {org.phone && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4" />
                  <span>{org.phone}</span>
                </div>
              )}
              {org.contact_person && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <User className="w-4 h-4" />
                  <span>{org.contact_person}</span>
                </div>
              )}
            </div>

            {/* Last Contact & Next Steps */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Last Contact:</span>
                <span className="font-medium">N/A</span>
              </div>
              <div className="flex justify-between items-center text-sm mt-1">
                <span className="text-gray-600">Next Scheduled:</span>
                <span className="font-medium text-green-600">Not scheduled</span>
              </div>
            </div>

            {/* Current Hospices */}
            {org.current_hospice_providers && org.current_hospice_providers.length > 0 && (
              <div>
                <p className="text-sm text-gray-600 mb-2">Current Hospice Providers:</p>
                <div className="flex flex-wrap gap-1">
                  {org.current_hospice_providers.map((hospice, index) => (
                    <Badge 
                      key={index} 
                      variant="outline" 
                      className={hospice === 'Elevate Hospice' ? 'border-green-500 text-green-700' : ''}
                    >
                      {hospice}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-2 pt-2">
              <Button 
                size="sm" 
                variant="outline" 
                className="flex-1"
                onClick={() => setShowScheduleDialog(true)}
              >
                <Calendar className="w-4 h-4 mr-1" />
                Schedule Visit
              </Button>
            </div>

            {/* Management Actions */}
            <div className="flex gap-1 pt-2 border-t">
              <Button 
                size="sm"
                variant="outline"
                onClick={() => setContactsOrganization({id: org.id, name: org.name})}
                className="flex-1"
              >
                <Users className="w-3 h-3 mr-1" />
                Contacts
              </Button>
              <Button 
                size="sm"
                variant="outline"
                onClick={() => setEditingOrganizationId(org.id)}
                className="flex-1"
              >
                <Edit className="w-3 h-3 mr-1" />
                Edit
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="space-y-6 w-full max-w-full">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Organizations</h1>
          <p className="text-gray-600">Manage your referral partners and prospects</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Organization
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
        <Button 
          variant={selectedRating === 'all' && selectedType === 'all' ? "default" : "ghost"} 
          className={selectedRating === 'all' && selectedType === 'all' ? "bg-white shadow-sm" : ""}
          onClick={() => {setSelectedRating('all'); setSelectedType('all');}}
        >
          All
        </Button>
        <Button 
          variant={selectedRating === 'A' ? "default" : "ghost"}
          className={selectedRating === 'A' ? "bg-white shadow-sm" : ""}
          onClick={() => setSelectedRating('A')}
        >
          A-Rated
        </Button>
        <Button 
          variant={selectedStatus === 'active' ? "default" : "ghost"}
          className={selectedStatus === 'active' ? "bg-white shadow-sm" : ""}
          onClick={() => setSelectedStatus('active')}
        >
          Active Partners
        </Button>
        <Button 
          variant={selectedStatus === 'prospect' ? "default" : "ghost"}
          className={selectedStatus === 'prospect' ? "bg-white shadow-sm" : ""}
          onClick={() => setSelectedStatus('prospect')}
        >
          Prospects
        </Button>
      </div>

      {/* Filters and View Toggle */}
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

          <Select value={selectedMarketer} onValueChange={setSelectedMarketer}>
            <SelectTrigger className="w-48 bg-white">
              <SelectValue placeholder="Filter by marketer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Marketers</SelectItem>
              {marketers?.map((marketer: string) => (
                <SelectItem key={marketer} value={marketer}>{marketer}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <ViewToggle view={view} onViewChange={setView} />
      </div>

      {/* Organizations Display */}
      {view === 'list' ? renderListView() : renderCardView()}

      <EnhancedAddOrganizationDialog 
        open={showAddDialog} 
        onOpenChange={setShowAddDialog} 
      />
      
      {editingOrganizationId && (
        <EnhancedEditOrganizationDialog
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

      <ScheduleVisitDialog
        open={showScheduleDialog}
        onOpenChange={setShowScheduleDialog}
      />
    </div>
  );
};

export default OrganizationsList;
