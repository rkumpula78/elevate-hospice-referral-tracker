
import React, { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Phone, Mail, MapPin } from "lucide-react";

const OrganizationsList = () => {
  const [selectedType, setSelectedType] = useState<string>('all');

  const { data: organizations, isLoading } = useQuery({
    queryKey: ['organizations', selectedType],
    queryFn: async () => {
      let query = supabase
        .from('organizations')
        .select('*')
        .order('name', { ascending: true });

      if (selectedType !== 'all') {
        query = query.eq('type', selectedType);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'hospital': return 'bg-red-100 text-red-800';
      case 'skilled_nursing': return 'bg-blue-100 text-blue-800';
      case 'physician_office': return 'bg-green-100 text-green-800';
      case 'clinic': return 'bg-purple-100 text-purple-800';
      case 'referral_source': return 'bg-orange-100 text-orange-800';
      case 'marketer': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'skilled_nursing': return 'Skilled Nursing';
      case 'physician_office': return 'Physician Office';
      case 'referral_source': return 'Referral Source';
      default: return type.charAt(0).toUpperCase() + type.slice(1);
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
              <SelectItem value="referral_source">Referral Source</SelectItem>
              <SelectItem value="marketer">Marketer</SelectItem>
              <SelectItem value="hospital">Hospital</SelectItem>
              <SelectItem value="skilled_nursing">Skilled Nursing</SelectItem>
              <SelectItem value="physician_office">Physician Office</SelectItem>
              <SelectItem value="clinic">Clinic</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Organization
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Organization Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Contact Person</TableHead>
            <TableHead>Contact Info</TableHead>
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
                  {getTypeLabel(org.type)}
                </Badge>
              </TableCell>
              <TableCell>{org.contact_person}</TableCell>
              <TableCell>
                <div className="space-y-1">
                  {org.phone && (
                    <div className="text-sm flex items-center">
                      <Phone className="w-3 h-3 mr-1" />
                      {org.phone}
                    </div>
                  )}
                  {org.contact_email && (
                    <div className="text-sm flex items-center">
                      <Mail className="w-3 h-3 mr-1" />
                      {org.contact_email}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={org.is_active ? "default" : "secondary"}>
                  {org.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    Edit
                  </Button>
                  <Button variant="outline" size="sm">
                    View Referrals
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

export default OrganizationsList;
