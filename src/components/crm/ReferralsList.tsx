
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AddReferralDialog from './AddReferralDialog';
import EditReferralDialog from './EditReferralDialog';
import MarketerSettingsDialog from './MarketerSettingsDialog';
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
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showMarketerSettings, setShowMarketerSettings] = useState(false);
  const [editingReferralId, setEditingReferralId] = useState<string>('');
  const [editingMarketer, setEditingMarketer] = useState<string | null>(null);
  const [tempMarketerValue, setTempMarketerValue] = useState<string>('');

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
        .update({ assigned_marketer: marketer === 'none' ? null : marketer })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referrals'] });
      toast({ title: "Marketer updated successfully" });
      setEditingMarketer(null);
      setTempMarketerValue('');
    },
    onError: () => {
      toast({ title: "Error updating marketer", variant: "destructive" });
      setEditingMarketer(null);
      setTempMarketerValue('');
    }
  });

  const handleEditReferral = (referralId: string) => {
    setEditingReferralId(referralId);
    setShowEditDialog(true);
  };

  const resetFilters = () => {
    setSelectedStatus('all');
    setSelectedPriority('all');
    setSelectedMarketer('all');
  };

  const hasActiveFilters = selectedStatus !== 'all' || selectedPriority !== 'all' || selectedMarketer !== 'all';
  const hasResults = referrals && referrals.length > 0;

  const handleMarketerEdit = (referralId: string, currentMarketer: string | null) => {
    setEditingMarketer(referralId);
    setTempMarketerValue(currentMarketer || '');
  };

  const handleMarketerSave = (referralId: string) => {
    updateMarketerMutation.mutate({ id: referralId, marketer: tempMarketerValue || 'none' });
  };

  const handleMarketerCancel = () => {
    setEditingMarketer(null);
    setTempMarketerValue('');
  };

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex space-x-2">
          <Select value={selectedStatus} onValueChange={(value: ReferralStatus | 'all') => setSelectedStatus(value)}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="new_referral">New Referral</SelectItem>
              <SelectItem value="contact_attempted">Contact Attempted</SelectItem>
              <SelectItem value="information_gathering">Information Gathering</SelectItem>
              <SelectItem value="assessment_scheduled">Assessment Scheduled</SelectItem>
              <SelectItem value="pending_admission">Pending Admission</SelectItem>
              <SelectItem value="admitted">Admitted</SelectItem>
              <SelectItem value="not_admitted_patient_choice">Not Admitted - Patient Choice</SelectItem>
              <SelectItem value="not_admitted_not_appropriate">Not Admitted - Not Appropriate</SelectItem>
              <SelectItem value="not_admitted_lost_contact">Not Admitted - Lost Contact</SelectItem>
              <SelectItem value="deceased_prior_admission">Deceased Prior to Admission</SelectItem>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {referrals?.map((referral) => (
            <ReferralCard
              key={referral.id}
              referral={referral}
              marketers={marketers || []}
              editingMarketer={editingMarketer}
              tempMarketerValue={tempMarketerValue}
              isUpdatingStatus={updateStatusMutation.isPending}
              isUpdatingPriority={updatePriorityMutation.isPending}
              isUpdatingMarketer={updateMarketerMutation.isPending}
              onStatusChange={(id, status) => updateStatusMutation.mutate({ id, status: status as ReferralStatus })}
              onPriorityChange={(id, priority) => updatePriorityMutation.mutate({ id, priority })}
              onMarketerEdit={handleMarketerEdit}
              onMarketerSave={handleMarketerSave}
              onMarketerCancel={handleMarketerCancel}
              onTempMarketerChange={setTempMarketerValue}
              onEdit={handleEditReferral}
            />
          ))}
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
