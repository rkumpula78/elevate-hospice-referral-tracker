
import React, { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Phone, Mail, MapPin, User, Edit, ExternalLink, Users, Building, Calendar } from "lucide-react";
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import EnhancedAddOrganizationDialog from './EnhancedAddOrganizationDialog';
import EditOrganizationDialog from './EditOrganizationDialog';
import OrganizationContactsDialog from './OrganizationContactsDialog';

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

      {/* Additional Filters */}
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
      </div>

      {/* Organizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {organizations?.map((org) => (
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
                <Button size="sm" variant="outline" className="flex-1">
                  <Phone className="w-4 h-4 mr-1" />
                  Call
                </Button>
                <Button size="sm" variant="outline" className="flex-1">
                  <Mail className="w-4 h-4 mr-1" />
                  Email
                </Button>
                <Button size="sm" variant="outline" className="flex-1">
                  <Calendar className="w-4 h-4 mr-1" />
                  Visit
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
