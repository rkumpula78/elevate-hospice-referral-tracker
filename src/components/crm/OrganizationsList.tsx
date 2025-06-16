
import React, { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Phone, Mail, MapPin, User, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import AddOrganizationDialog from './AddOrganizationDialog';

type SortField = 'name' | 'contact_person' | 'phone' | 'contact_email' | 'assigned_marketer';
type SortDirection = 'asc' | 'desc';

const OrganizationsList = () => {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedMarketer, setSelectedMarketer] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const { data: organizations, isLoading } = useQuery({
    queryKey: ['organizations', selectedMarketer, sortField, sortDirection],
    queryFn: async () => {
      let query = supabase
        .from('organizations')
        .select('*')
        .eq('is_active', true)
        .order(sortField, { ascending: sortDirection === 'asc' });

      if (selectedMarketer !== 'all') {
        query = query.eq('assigned_marketer', selectedMarketer);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  // Get unique marketers for filter
  const { data: marketers } = useQuery({
    queryKey: ['org-marketers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('assigned_marketer')
        .not('assigned_marketer', 'is', null);
      
      if (error) throw error;
      const uniqueMarketers = [...new Set(data.map(o => o.assigned_marketer).filter(Boolean))];
      return uniqueMarketers;
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

  if (isLoading) {
    return <div>Loading organizations...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex space-x-2">
          <div>
            <h3 className="text-lg font-medium">Referral Sources</h3>
            <p className="text-sm text-muted-foreground">Manage hospitals, clinics, and other referral sources</p>
          </div>
          <Select value={selectedMarketer} onValueChange={setSelectedMarketer}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by marketer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Marketers</SelectItem>
              {marketers?.map((marketer) => (
                <SelectItem key={marketer} value={marketer}>{marketer}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Referral Source
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <Button variant="ghost" onClick={() => handleSort('name')} className="h-auto p-0 font-medium">
                Organization{getSortIcon('name')}
              </Button>
            </TableHead>
            <TableHead>
              <Button variant="ghost" onClick={() => handleSort('contact_person')} className="h-auto p-0 font-medium">
                Contact Person{getSortIcon('contact_person')}
              </Button>
            </TableHead>
            <TableHead>
              <Button variant="ghost" onClick={() => handleSort('phone')} className="h-auto p-0 font-medium">
                Phone{getSortIcon('phone')}
              </Button>
            </TableHead>
            <TableHead>
              <Button variant="ghost" onClick={() => handleSort('contact_email')} className="h-auto p-0 font-medium">
                Email{getSortIcon('contact_email')}
              </Button>
            </TableHead>
            <TableHead>
              <Button variant="ghost" onClick={() => handleSort('assigned_marketer')} className="h-auto p-0 font-medium">
                Assigned Marketer{getSortIcon('assigned_marketer')}
              </Button>
            </TableHead>
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
