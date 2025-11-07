import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ViewToggle } from "@/components/ui/view-toggle";
import { SortHeader } from "@/components/ui/sort-header";
import AddReferralDialog from './AddReferralDialog';
import EditReferralDialog from './EditReferralDialog';
import ScheduleVisitDialog from './ScheduleVisitDialog';
import { sendAdmissionNotification, formatEmailData } from '@/utils/emailNotifications';
import { EmptyState } from '@/components/ui/empty-state';
import ReferralCard from './ReferralCard';
import { FloatingActionButton } from '@/components/ui/floating-action-button';
import { useIsTabletOrMobile } from '@/hooks/use-responsive';
import { ReferralCardsSkeleton } from '@/components/ui/card-skeleton';
import { ReferralsFilterBar, ReferralFilters } from './ReferralsFilterBar';

type ReferralStatus = 'new_referral' | 'contact_attempted' | 'information_gathering' | 'assessment_scheduled' | 'pending_admission' | 'admitted' | 'not_admitted_patient_choice' | 'not_admitted_not_appropriate' | 'not_admitted_lost_contact' | 'deceased_prior_admission';

const statusOptions = [
  { value: 'new_referral', label: 'New Referral' },
  { value: 'contact_attempted', label: 'Contact Attempted' },
  { value: 'information_gathering', label: 'Information Gathering' },
  { value: 'assessment_scheduled', label: 'Assessment Scheduled' },
  { value: 'pending_admission', label: 'Pending Admission' },
  { value: 'admitted', label: 'Admitted' },
  { value: 'not_admitted_patient_choice', label: 'Not Admitted - Patient Choice' },
  { value: 'not_admitted_not_appropriate', label: 'Not Admitted - Not Appropriate' },
  { value: 'not_admitted_lost_contact', label: 'Not Admitted - Lost Contact' },
  { value: 'deceased_prior_admission', label: 'Deceased Prior to Admission' },
];

interface ReferralsListProps {
  initialFilter?: string | null;
}

const ReferralsList = ({ initialFilter }: ReferralsListProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isTabletOrMobile = useIsTabletOrMobile();
  
  // New filter state
  const [filters, setFilters] = useState<ReferralFilters>({
    statuses: [],
    priorities: [],
    facilities: [],
    insurances: [],
    dateRange: undefined,
  });
  
  const [view, setView] = useState<'card' | 'list'>('card');
  const [sortConfig, setSortConfig] = useState<{ field: string; direction: 'asc' | 'desc' } | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [editingReferralId, setEditingReferralId] = useState<string>('');
  const [schedulingReferralId, setSchedulingReferralId] = useState<string>('');

  const { data: referrals, isLoading } = useQuery({
    queryKey: ['referrals', filters],
    queryFn: async () => {
      let query = supabase
        .from('referrals')
        .select('*, organizations(name, type)')
        .order('referral_date', { ascending: false });

      // Apply status filter (with proper type casting)
      if (filters.statuses.length > 0) {
        query = query.in('status', filters.statuses as any);
      }
      
      // Apply priority filter
      if (filters.priorities.length > 0) {
        query = query.in('priority', filters.priorities);
      }
      
      // Apply facility filter
      if (filters.facilities.length > 0) {
        query = query.in('organization_id', filters.facilities);
      }
      
      // Apply insurance filter
      if (filters.insurances.length > 0) {
        query = query.in('insurance', filters.insurances);
      }
      
      // Apply date range filter
      if (filters.dateRange?.from) {
        query = query.gte('referral_date', filters.dateRange.from.toISOString());
      }
      if (filters.dateRange?.to) {
        query = query.lte('referral_date', filters.dateRange.to.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });
  
  // Get total count without filters
  const { data: totalReferrals } = useQuery({
    queryKey: ['referrals-total'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('referrals')
        .select('*', { count: 'exact', head: true });
      
      if (error) throw error;
      return count || 0;
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
      return data?.map(m => `${m.first_name} ${m.last_name}`) || [];
    }
  });

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

  const hasResults = referrals && referrals.length > 0;

  if (isLoading) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="flex justify-between items-center">
          <div className="flex space-x-2">
            <div className="w-48 h-10 bg-gray-200 rounded animate-pulse" />
            <div className="w-40 h-10 bg-gray-200 rounded animate-pulse" />
            <div className="w-48 h-10 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="w-32 h-10 bg-gray-200 rounded animate-pulse" />
        </div>
        <ReferralCardsSkeleton count={6} />
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
      {/* New Filter Bar */}
      <ReferralsFilterBar
        filters={filters}
        onFiltersChange={setFilters}
        totalCount={totalReferrals || 0}
        filteredCount={referrals?.length || 0}
      />

      <div className="flex justify-end gap-3">
        <ViewToggle view={view} onViewChange={setView} />
        {!isTabletOrMobile && (
          <Button onClick={() => setShowAddDialog(true)} className="modern-btn-primary">
            <Plus className="w-4 h-4 mr-2" />
            Add Referral
          </Button>
        )}
      </div>

      {!hasResults ? (
        <EmptyState
          title="No referrals match your filters"
          description="Try adjusting your filters to see more results."
        />
      ) : (
        <>
          {view === 'list' ? renderListView() : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 animate-fade-in">
              {sortedReferrals?.map((referral, index) => (
                <div 
                  key={referral.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <ReferralCard
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
                  />
                </div>
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

      <ScheduleVisitDialog
        open={showScheduleDialog}
        onOpenChange={setShowScheduleDialog}
        referralId={schedulingReferralId}
      />

      {/* Floating Action Button for Mobile/Tablet */}
      {isTabletOrMobile && (
        <FloatingActionButton 
          onClick={() => setShowAddDialog(true)}
          label="Add Referral"
        />
      )}
    </div>
  );
};

export default ReferralsList;
