import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Phone, Mail, Calendar, User, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import AddReferralDialog from './AddReferralDialog';

type ReferralStatus = 'pending' | 'contacted' | 'scheduled' | 'admitted' | 'declined' | 'lost' | 'admitted_our_hospice' | 'admitted_other_hospice' | 'lost_death' | 'lost_move' | 'lost_other_hospice';
type SortField = 'patient_name' | 'organizations.name' | 'assigned_marketer' | 'diagnosis' | 'priority' | 'status' | 'referral_date';
type SortDirection = 'asc' | 'desc';

const ReferralsList = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedStatus, setSelectedStatus] = useState<ReferralStatus | 'all'>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedMarketer, setSelectedMarketer] = useState<string>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [sortField, setSortField] = useState<SortField>('referral_date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const { data: referrals, isLoading } = useQuery({
    queryKey: ['referrals', selectedStatus, selectedPriority, selectedMarketer, sortField, sortDirection],
    queryFn: async () => {
      let query = supabase
        .from('referrals')
        .select('*, organizations(name, type)')
        .order(sortField === 'organizations.name' ? 'organizations(name)' : sortField, { ascending: sortDirection === 'asc' });

      if (selectedStatus !== 'all') {
        query = query.eq('status', selectedStatus);
      }
      if (selectedPriority !== 'all') {
        query = query.eq('priority', selectedPriority);
      }
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
    queryKey: ['marketers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('referrals')
        .select('assigned_marketer')
        .not('assigned_marketer', 'is', null);
      
      if (error) throw error;
      const uniqueMarketers = [...new Set(data.map(r => r.assigned_marketer).filter(Boolean))];
      return uniqueMarketers;
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: ReferralStatus }) => {
      const { error } = await supabase
        .from('referrals')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referrals'] });
      toast({ title: "Status updated successfully" });
    },
    onError: () => {
      toast({ title: "Error updating status", variant: "destructive" });
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
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'contacted': return 'bg-blue-100 text-blue-800';
      case 'scheduled': return 'bg-purple-100 text-purple-800';
      case 'admitted': return 'bg-green-100 text-green-800';
      case 'admitted_our_hospice': return 'bg-green-100 text-green-800';
      case 'admitted_other_hospice': return 'bg-orange-100 text-orange-800';
      case 'declined': return 'bg-red-100 text-red-800';
      case 'lost': return 'bg-gray-100 text-gray-800';
      case 'lost_death': return 'bg-gray-100 text-gray-800';
      case 'lost_move': return 'bg-gray-100 text-gray-800';
      case 'lost_other_hospice': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'admitted_our_hospice': return 'Admitted Our Hospice';
      case 'admitted_other_hospice': return 'Admitted Other Hospice';
      case 'lost_death': return 'Lost - Death';
      case 'lost_move': return 'Lost - Move';
      case 'lost_other_hospice': return 'Lost - Other Hospice';
      default: return status;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'routine': return 'bg-blue-100 text-blue-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return <div>Loading referrals...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex space-x-2">
          <Select value={selectedStatus} onValueChange={(value: ReferralStatus | 'all') => setSelectedStatus(value)}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="contacted">Contacted</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="admitted">Admitted</SelectItem>
              <SelectItem value="admitted_our_hospice">Admitted Our Hospice</SelectItem>
              <SelectItem value="admitted_other_hospice">Admitted Other Hospice</SelectItem>
              <SelectItem value="declined">Declined</SelectItem>
              <SelectItem value="lost">Lost</SelectItem>
              <SelectItem value="lost_death">Lost - Death</SelectItem>
              <SelectItem value="lost_move">Lost - Move</SelectItem>
              <SelectItem value="lost_other_hospice">Lost - Other Hospice</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedPriority} onValueChange={setSelectedPriority}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="routine">Routine</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>

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
          Add Referral
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <Button variant="ghost" onClick={() => handleSort('patient_name')} className="h-auto p-0 font-medium">
                Patient{getSortIcon('patient_name')}
              </Button>
            </TableHead>
            <TableHead>
              <Button variant="ghost" onClick={() => handleSort('organizations.name')} className="h-auto p-0 font-medium">
                Organization{getSortIcon('organizations.name')}
              </Button>
            </TableHead>
            <TableHead>
              <Button variant="ghost" onClick={() => handleSort('assigned_marketer')} className="h-auto p-0 font-medium">
                Assigned Marketer{getSortIcon('assigned_marketer')}
              </Button>
            </TableHead>
            <TableHead>
              <Button variant="ghost" onClick={() => handleSort('diagnosis')} className="h-auto p-0 font-medium">
                Diagnosis{getSortIcon('diagnosis')}
              </Button>
            </TableHead>
            <TableHead>
              <Button variant="ghost" onClick={() => handleSort('priority')} className="h-auto p-0 font-medium">
                Priority{getSortIcon('priority')}
              </Button>
            </TableHead>
            <TableHead>
              <Button variant="ghost" onClick={() => handleSort('status')} className="h-auto p-0 font-medium">
                Status{getSortIcon('status')}
              </Button>
            </TableHead>
            <TableHead>
              <Button variant="ghost" onClick={() => handleSort('referral_date')} className="h-auto p-0 font-medium">
                Referral Date{getSortIcon('referral_date')}
              </Button>
            </TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {referrals?.map((referral) => (
            <TableRow key={referral.id}>
              <TableCell className="font-medium">
                <div>
                  <div>{referral.patient_name}</div>
                  {referral.patient_phone && (
                    <div className="text-sm text-muted-foreground flex items-center">
                      <Phone className="w-3 h-3 mr-1" />
                      {referral.patient_phone}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div>
                  <div>{referral.organizations?.name || 'Unknown'}</div>
                  <div className="text-sm text-muted-foreground">{referral.organizations?.type}</div>
                </div>
              </TableCell>
              <TableCell>
                {referral.assigned_marketer ? (
                  <div className="flex items-center">
                    <User className="w-3 h-3 mr-1" />
                    {referral.assigned_marketer}
                  </div>
                ) : '-'}
              </TableCell>
              <TableCell>{referral.diagnosis}</TableCell>
              <TableCell>
                <Badge className={getPriorityColor(referral.priority || 'routine')}>
                  {referral.priority || 'routine'}
                </Badge>
              </TableCell>
              <TableCell>
                <Select
                  value={referral.status || 'pending'}
                  onValueChange={(value: ReferralStatus) => 
                    updateStatusMutation.mutate({ id: referral.id, status: value })
                  }
                >
                  <SelectTrigger className="w-40">
                    <Badge className={getStatusColor(referral.status || 'pending')}>
                      {getStatusLabel(referral.status || 'pending')}
                    </Badge>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="admitted">Admitted</SelectItem>
                    <SelectItem value="admitted_our_hospice">Admitted Our Hospice</SelectItem>
                    <SelectItem value="admitted_other_hospice">Admitted Other Hospice</SelectItem>
                    <SelectItem value="declined">Declined</SelectItem>
                    <SelectItem value="lost">Lost</SelectItem>
                    <SelectItem value="lost_death">Lost - Death</SelectItem>
                    <SelectItem value="lost_move">Lost - Move</SelectItem>
                    <SelectItem value="lost_other_hospice">Lost - Other Hospice</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                {referral.referral_date && format(new Date(referral.referral_date), 'MMM dd, yyyy')}
              </TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    <Calendar className="w-3 h-3 mr-1" />
                    Schedule
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AddReferralDialog 
        open={showAddDialog} 
        onOpenChange={setShowAddDialog} 
      />
    </div>
  );
};

export default ReferralsList;
