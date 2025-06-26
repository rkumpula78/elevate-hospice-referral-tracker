import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ViewToggle } from "@/components/ui/view-toggle";
import { SortHeader } from "@/components/ui/sort-header";
import AddReferralDialog from './AddReferralDialog';
import EditReferralDialog from './EditReferralDialog';
import MarketerSettingsDialog from './MarketerSettingsDialog';
import ScheduleVisitDialog from './ScheduleVisitDialog';
import { sendAdmissionNotification, formatEmailData } from '@/utils/emailNotifications';
import { EmptyState } from '@/components/ui/empty-state';
import ReferralCard from './ReferralCard';

type ReferralStatus = 'new_referral' | 'contact_attempted' | 'information_gathering' | 'assessment_scheduled' | 'pending_admission' | 'admitted' | 'not_admitted_patient_choice' | 'not_admitted_not_appropriate' | 'not_admitted_lost_contact' | 'deceased_prior_admission';

const ReferralsList = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedStatus, setSelectedStatus] = useState<ReferralStatus | 'all'>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedMarketer, setSelectedMarketer] = useState<string>('all');
  const [view, setView] = useState<'card' | 'list'>('card');
  const [sortConfig, setSortConfig] = useState<{ field: string; direction: 'asc' | 'desc' } | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showMarketerSettings, setShowMarketerSettings] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [editingReferralId, setEditingReferralId] = useState<string>('');
  const [schedulingReferralId, setSchedulingReferralId] = useState<string>('');

  const { data: referrals, isLoading } = useQuery({
    queryKey: ['referrals', selectedStatus, selectedPriority, selectedMarketer],
    queryFn: async () => {
      let query = supabase
        .from('referrals')
        .select('*, organizations(name, type)')
        .order('referral_date', { ascending: false });

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

  React.useEffect(() => {
    const handleMarketerUpdate = () => {
      refetchMarketers();
    };

    window.addEventListener('marketers-updated', handleMarketerUpdate);
    return () => {
      window.removeEventListener('marketers-updated', handleMarketerUpdate);
    };
  }, [refetchMarketers]);

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: ReferralStatus }) => {
      const { error } = await supabase
        .from('referrals')
        .update({ status })
        .eq('id', id);
      if (error) throw error;

      // If status is admitted, send email notification
      if (status === 'admitted') {
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
        .update({ assigned_marketer: marketer || null })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referrals'] });
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

  const sortedReferrals = React.useMemo(() => {
    if (!referrals || !sortConfig) return referrals;

    return [...referrals].sort((a, b) => {
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
  }, [referrals, sortConfig]);

  const handleEditReferral = (referralId: string) => {
    setEditingReferralId(referralId);
    setShowEditDialog(true);
  };

  const handleScheduleReferral = (referralId: string) => {
    setSchedulingReferralId(referralId);
    setShowScheduleDialog(true);
  };

  const handleMarketerChange = (referralId: string, marketer: string) => {
    updateMarketerMutation.mutate({ id: referralId, marketer });
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
            <div className="w-48 h-10 bg-gray-200 rounded animate-pulse" />
            <div className="w-40 h-10 bg-gray-200 rounded animate-pulse" />
            <div className="w-48 h-10 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="w-32 h-10 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const renderListView = () => (
    <div className="bg-white rounded-lg shadow-sm border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <SortHeader label="Patient" field="patient_name" currentSort={sortConfig} onSort={handleSort} />
            </TableHead>
            <TableHead>
              <SortHeader label="Organization" field="organizations.name" currentSort={sortConfig} onSort={handleSort} />
            </TableHead>
            <TableHead>
              <SortHeader label="Status" field="status" currentSort={sortConfig} onSort={handleSort} />
            </TableHead>
            <TableHead>
              <SortHeader label="Priority" field="priority" currentSort={sortConfig} onSort={handleSort} />
            </TableHead>
            <TableHead>
              <SortHeader label="Marketer" field="assigned_marketer" currentSort={sortConfig} onSort={handleSort} />
            </TableHead>
            <TableHead>
              <SortHeader label="Date" field="referral_date" currentSort={sortConfig} onSort={handleSort} />
            </TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedReferrals?.map((referral) => (
            <TableRow key={referral.id}>
              <TableCell className="font-medium">{referral.patient_name}</TableCell>
              <TableCell>{referral.organizations?.name || 'N/A'}</TableCell>
              <TableCell>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  referral.status === 'admitted' ? 'bg-green-100 text-green-800' :
                  referral.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {referral.status}
                </span>
              </TableCell>
              <TableCell>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  referral.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                  referral.priority === 'routine' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {referral.priority}
                </span>
              </TableCell>
              <TableCell>{referral.assigned_marketer || 'Unassigned'}</TableCell>
              <TableCell>
                {referral.referral_date ? new Date(referral.referral_date).toLocaleDateString() : 'N/A'}
              </TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEditReferral(referral.id)}
                  >
                    Edit
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex space-x-3">
          <Select value={selectedStatus} onValueChange={(value: ReferralStatus | 'all') => setSelectedStatus(value)}>
            <SelectTrigger className="w-48 modern-filter">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent className="modern-dropdown">
              <SelectItem value="all" className="modern-dropdown-item">All Status</SelectItem>
              <SelectItem value="new_referral" className="modern-dropdown-item">New Referral</SelectItem>
              <SelectItem value="contact_attempted" className="modern-dropdown-item">Contact Attempted</SelectItem>
              <SelectItem value="information_gathering" className="modern-dropdown-item">Information Gathering</SelectItem>
              <SelectItem value="assessment_scheduled" className="modern-dropdown-item">Assessment Scheduled</SelectItem>
              <SelectItem value="pending_admission" className="modern-dropdown-item">Pending Admission</SelectItem>
              <SelectItem value="admitted" className="modern-dropdown-item">Admitted</SelectItem>
              <SelectItem value="not_admitted_patient_choice" className="modern-dropdown-item">Not Admitted - Patient Choice</SelectItem>
              <SelectItem value="not_admitted_not_appropriate" className="modern-dropdown-item">Not Admitted - Not Appropriate</SelectItem>
              <SelectItem value="not_admitted_lost_contact" className="modern-dropdown-item">Not Admitted - Lost Contact</SelectItem>
              <SelectItem value="deceased_prior_admission" className="modern-dropdown-item">Deceased Prior to Admission</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedPriority} onValueChange={setSelectedPriority}>
            <SelectTrigger className="w-40 modern-filter">
              <SelectValue placeholder="Filter by priority" />
            </SelectTrigger>
            <SelectContent className="modern-dropdown">
              <SelectItem value="all" className="modern-dropdown-item">All Priority</SelectItem>
              <SelectItem value="urgent" className="modern-dropdown-item">Urgent</SelectItem>
              <SelectItem value="routine" className="modern-dropdown-item">Routine</SelectItem>
              <SelectItem value="low" className="modern-dropdown-item">Low</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedMarketer} onValueChange={setSelectedMarketer}>
            <SelectTrigger className="w-48 modern-filter">
              <SelectValue placeholder="Filter by marketer" />
            </SelectTrigger>
            <SelectContent className="modern-dropdown">
              <SelectItem value="all" className="modern-dropdown-item">All Marketers</SelectItem>
              {marketers?.map((marketer: string) => (
                <SelectItem key={marketer} value={marketer} className="modern-dropdown-item">{marketer}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-3">
          <ViewToggle view={view} onViewChange={setView} />
          <Button variant="outline" onClick={() => setShowMarketerSettings(true)} className="modern-btn-secondary">
            <Settings className="w-4 h-4 mr-2" />
            Manage Marketers
          </Button>
          <Button onClick={() => setShowAddDialog(true)} className="modern-btn-primary">
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
        <>
          {view === 'list' ? renderListView() : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedReferrals?.map((referral) => (
                <ReferralCard
                  key={referral.id}
                  referral={referral}
                  marketers={marketers || []}
                  isUpdatingStatus={updateStatusMutation.isPending}
                  isUpdatingPriority={updatePriorityMutation.isPending}
                  isUpdatingMarketer={updateMarketerMutation.isPending}
                  onStatusChange={(id, status) => updateStatusMutation.mutate({ id, status: status as ReferralStatus })}
                  onPriorityChange={(id, priority) => updatePriorityMutation.mutate({ id, priority })}
                  onMarketerChange={handleMarketerChange}
                  onEdit={handleEditReferral}
                  onSchedule={handleScheduleReferral}
                  onAddMarketer={() => setShowMarketerSettings(true)}
                />
              ))}
            </div>
          )}
        </>
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

      <ScheduleVisitDialog
        open={showScheduleDialog}
        onOpenChange={setShowScheduleDialog}
        referralId={schedulingReferralId}
      />
    </div>
  );
};

export default ReferralsList;
