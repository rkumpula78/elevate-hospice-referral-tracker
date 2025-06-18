
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Phone, Mail, Calendar, User, ArrowUpDown, ArrowUp, ArrowDown, Edit, AlertCircle, Clock, CheckCircle, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import AddReferralDialog from './AddReferralDialog';
import EditReferralDialog from './EditReferralDialog';
import MarketerSettingsDialog from './MarketerSettingsDialog';
import { sendAdmissionNotification, formatEmailData } from '@/utils/emailNotifications';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { EmptyState } from '@/components/ui/empty-state';

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
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showMarketerSettings, setShowMarketerSettings] = useState(false);
  const [editingReferralId, setEditingReferralId] = useState<string>('');
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

  // Get marketers from localStorage
  const { data: marketers, refetch: refetchMarketers } = useQuery({
    queryKey: ['marketers-local'],
    queryFn: () => {
      const stored = localStorage.getItem('hospice-marketers');
      if (stored) {
        return JSON.parse(stored);
      }
      return ['John Smith', 'Sarah Johnson', 'Mike Davis', 'Lisa Wilson', 'David Brown'];
    }
  });

  // Listen for marketer updates
  React.useEffect(() => {
    const handleMarketerUpdate = () => {
      refetchMarketers();
    };

    window.addEventListener('marketers-updated', handleMarketerUpdate);
    return () => {
      window.removeEventListener('marketers-updated', handleMarketerUpdate);
    };
  }, [refetchMarketers]);

  // Get unique marketers for filter
  const { data: uniqueMarketers } = useQuery({
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

      // If status is admitted or admitted_our_hospice, send email notification
      if (status === 'admitted' || status === 'admitted_our_hospice') {
        // Fetch referral and patient data for email
        const { data: referralData } = await supabase
          .from('referrals')
          .select('*, organizations(name)')
          .eq('id', id)
          .single();

        const { data: patientData } = await supabase
          .from('patients')
          .select('*')
          .eq('referral_id', id)
          .maybeSingle();

        if (referralData) {
          const emailData = formatEmailData(referralData, patientData);
          const emailResult = await sendAdmissionNotification(emailData);
          
          if (emailResult.success) {
            console.log('Admission notification email sent successfully');
          } else {
            console.error('Failed to send admission notification email:', emailResult.error);
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referrals'] });
      toast({ title: "Status updated successfully" });
    },
    onError: () => {
      toast({ title: "Error updating status", variant: "destructive" });
    }
  });

  const updatePriorityMutation = useMutation({
    mutationFn: async ({ id, priority }: { id: string, priority: string }) => {
      const { error } = await supabase
        .from('referrals')
        .update({ priority })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referrals'] });
      toast({ title: "Priority updated successfully" });
    },
    onError: () => {
      toast({ title: "Error updating priority", variant: "destructive" });
    }
  });

  const updateMarketerMutation = useMutation({
    mutationFn: async ({ id, marketer }: { id: string, marketer: string }) => {
      const { error } = await supabase
        .from('referrals')
        .update({ assigned_marketer: marketer === 'none' ? null : marketer })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referrals'] });
      queryClient.invalidateQueries({ queryKey: ['marketers'] });
      toast({ title: "Marketer updated successfully" });
    },
    onError: () => {
      toast({ title: "Error updating marketer", variant: "destructive" });
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

  const handleEditReferral = (referralId: string) => {
    setEditingReferralId(referralId);
    setShowEditDialog(true);
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return <AlertCircle className="w-3 h-3 mr-1 text-red-600" />;
      case 'routine': return <Clock className="w-3 h-3 mr-1 text-blue-600" />;
      case 'low': return <CheckCircle className="w-3 h-3 mr-1 text-gray-600" />;
      default: return <Clock className="w-3 h-3 mr-1 text-gray-600" />;
    }
  };

  const resetFilters = () => {
    setSelectedStatus('all');
    setSelectedPriority('all');
    setSelectedMarketer('all');
  };

  const hasActiveFilters = selectedStatus !== 'all' || selectedPriority !== 'all' || selectedMarketer !== 'all';
  const hasResults = referrals && referrals.length > 0;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex space-x-2">
            {/* Filter skeleton */}
            <div className="w-48 h-10 bg-gray-200 rounded animate-pulse" />
            <div className="w-40 h-10 bg-gray-200 rounded animate-pulse" />
            <div className="w-48 h-10 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="w-32 h-10 bg-gray-200 rounded animate-pulse" />
        </div>
        <TableSkeleton rows={8} columns={8} />
      </div>
    );
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
              {marketers?.map((marketer: string) => (
                <SelectItem key={marketer} value={marketer}>{marketer}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowMarketerSettings(true)}>
            <Settings className="w-4 h-4 mr-2" />
            Manage Marketers
          </Button>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Referral
          </Button>
        </div>
      </div>

      {!hasResults ? (
        <EmptyState
          title={hasActiveFilters ? "No referrals match your filters" : "No referrals yet"}
          description={hasActiveFilters ? "Try adjusting your filters to see more results." : "Get started by adding your first referral to the system."}
          actionLabel={hasActiveFilters ? undefined : "Add First Referral"}
          onAction={hasActiveFilters ? undefined : () => setShowAddDialog(true)}
          showResetFilters={hasActiveFilters}
          onResetFilters={resetFilters}
        />
      ) : (
        <div className="rounded-md border overflow-x-auto">
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
                <TableHead className="w-[200px]">Actions</TableHead>
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
                    <Select
                      value={referral.assigned_marketer || 'none'}
                      onValueChange={(value: string) => 
                        updateMarketerMutation.mutate({ id: referral.id, marketer: value })
                      }
                      disabled={updateMarketerMutation.isPending}
                    >
                      <SelectTrigger className="w-40">
                        {referral.assigned_marketer ? (
                            <div className="flex items-center">
                              <User className="w-3 h-3 mr-1" />
                              {referral.assigned_marketer}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Unassigned</span>
                          )}
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Unassigned</SelectItem>
                        {marketers?.map((marketer) => (
                          <SelectItem key={marketer} value={marketer}>{marketer}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">{referral.diagnosis}</TableCell>
                  <TableCell>
                    <Select
                      value={referral.priority || 'routine'}
                      onValueChange={(value: string) => 
                        updatePriorityMutation.mutate({ id: referral.id, priority: value })
                      }
                      disabled={updatePriorityMutation.isPending}
                    >
                      <SelectTrigger className="w-32">
                        <Badge className={getPriorityColor(referral.priority || 'routine')}>
                          {getPriorityIcon(referral.priority || 'routine')}
                          {referral.priority || 'routine'}
                        </Badge>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="urgent">Urgent</SelectItem>
                        <SelectItem value="routine">Routine</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={referral.status || 'pending'}
                      onValueChange={(value: ReferralStatus) => 
                        updateStatusMutation.mutate({ id: referral.id, status: value })
                      }
                      disabled={updateStatusMutation.isPending}
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
                    <div className="flex space-x-1">
                      <Button variant="outline" size="sm" onClick={() => handleEditReferral(referral.id)}>
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
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
        </div>
      )}

      <AddReferralDialog 
        open={showAddDialog} 
        onOpenChange={setShowAddDialog} 
      />
      
      <EditReferralDialog 
        open={showEditDialog} 
        onOpenChange={setShowEditDialog} 
        referralId={editingReferralId}
      />

      <MarketerSettingsDialog
        open={showMarketerSettings}
        onOpenChange={setShowMarketerSettings}
      />
    </div>
  );
};

export default ReferralsList;
