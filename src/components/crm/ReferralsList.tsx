import React, { useState, useCallback } from 'react';
import { notifyStatusChange } from '@/lib/webhookNotifier';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Filter, Phone, Search, X as XIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast, toast } from "@/hooks/use-toast";
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
import { BulkActionsToolbar } from './BulkActionsToolbar';
import PullToRefresh from 'react-simple-pull-to-refresh';
import { Link } from 'react-router-dom';

import { REFERRAL_STATUSES, getStatusBadgeColor, getStatusLabel, normalizeStatus, type ReferralStatusValue } from '@/lib/constants';

const statusOptions = REFERRAL_STATUSES;

interface ReferralsListProps {
  initialFilter?: string | null;
}

const ReferralsList = ({ initialFilter }: ReferralsListProps) => {
  const { toast: showToast } = useToast();
  const queryClient = useQueryClient();
  const isTabletOrMobile = useIsTabletOrMobile();
  
  // New filter state
  const [filters, setFilters] = useState<ReferralFilters>({
    statuses: [],
    priorities: [],
    facilities: [],
    insurances: [],
    marketers: [],
    dateRange: undefined,
  });
  
  const [view, setView] = useState<'card' | 'list'>('card');
  const [sortConfig, setSortConfig] = useState<{ field: string; direction: 'asc' | 'desc' } | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [editingReferralId, setEditingReferralId] = useState<string>('');
  const [schedulingReferralId, setSchedulingReferralId] = useState<string>('');
  
  // Bulk selection state
  const [selectedReferralIds, setSelectedReferralIds] = useState<Set<string>>(new Set());
  const [undoState, setUndoState] = useState<{ referrals: any[], action: string } | null>(null);
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);

  // Clear selection when filters change
  React.useEffect(() => {
    setSelectedReferralIds(new Set());
    setLastSelectedIndex(null);
  }, [filters]);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Keyboard shortcut: Ctrl/Cmd+K to focus search
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const { data: referrals, isLoading, refetch } = useQuery({
    queryKey: ['referrals', filters],
    queryFn: async () => {
      let query = supabase
        .from('referrals')
        .select('*, organizations(name, type)')
        .is('deleted_at', null)
        .order('referral_date', { ascending: false });

      if (filters.statuses.length > 0) {
        query = query.in('status', filters.statuses as any);
      }
      if (filters.priorities.length > 0) {
        query = query.in('priority', filters.priorities);
      }
      if (filters.facilities.length > 0) {
        query = query.in('organization_id', filters.facilities);
      }
      if (filters.insurances.length > 0) {
        query = query.in('insurance', filters.insurances);
      }
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

  const getStatusLabel = (status: string) => {
    const found = statusOptions.find(s => s.value === status);
    return found?.label || status;
  };

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: ReferralStatusValue }) => {
      const { error } = await supabase
        .from('referrals')
        .update({ status: status as any })
        .eq('id', id);
      if (error) throw error;

      // If status is admitted, send email notification
      if (status === 'admitted') {
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
      return { status };
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['referrals'] });
      showToast({ title: `✅ Status updated to ${getStatusLabel(variables.status)}` });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ['referrals'] });
      showToast({ title: "Failed to update status. Please try again.", variant: "destructive" });
    }
  });

  const updatePriorityMutation = useMutation({
    mutationFn: async ({ id, priority }: { id: string, priority: string }) => {
      const { error } = await supabase
        .from('referrals')
        .update({ priority })
        .eq('id', id);
      if (error) throw error;
      return { priority };
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['referrals'] });
      showToast({ title: `✅ Priority updated to ${variables.priority.charAt(0).toUpperCase() + variables.priority.slice(1)}` });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ['referrals'] });
      showToast({ title: "Failed to update priority. Please try again.", variant: "destructive" });
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
      showToast({ title: "✅ Marketer updated successfully" });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ['referrals'] });
      showToast({ title: "Failed to update marketer. Please try again.", variant: "destructive" });
    }
  });

  const handleSort = (field: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig?.field === field && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ field, direction });
  };

  // Filter by search, then sort
  const filteredAndSortedReferrals = React.useMemo(() => {
    let result = referrals || [];
    
    // Apply client-side search filter
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(r => 
        (r.patient_name || '').toLowerCase().includes(q) ||
        (r.organizations?.name || '').toLowerCase().includes(q)
      );
    }

    if (!sortConfig) return result;

    return [...result].sort((a, b) => {
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
  }, [referrals, sortConfig, debouncedSearch]);

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

  // Bulk selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked && referrals) {
      setSelectedReferralIds(new Set(referrals.map(r => r.id)));
    } else {
      setSelectedReferralIds(new Set());
    }
  };

  const handleSelectReferral = (id: string, checked: boolean, event?: React.MouseEvent) => {
    const currentList = filteredAndSortedReferrals || [];
    const clickedIndex = currentList.findIndex(r => r.id === id);

    // Shift+click range select
    if (event?.shiftKey && lastSelectedIndex !== null && clickedIndex !== -1) {
      const start = Math.min(lastSelectedIndex, clickedIndex);
      const end = Math.max(lastSelectedIndex, clickedIndex);
      const newSelected = new Set(selectedReferralIds);
      for (let i = start; i <= end; i++) {
        newSelected.add(currentList[i].id);
      }
      setSelectedReferralIds(newSelected);
      setLastSelectedIndex(clickedIndex);
      return;
    }

    const newSelected = new Set(selectedReferralIds);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedReferralIds(newSelected);
    setLastSelectedIndex(clickedIndex);
  };

  const handleClearSelection = () => {
    setSelectedReferralIds(new Set());
  };

  // Bulk operations
  const handleBulkStatusUpdate = async (status: string) => {
    const selectedReferrals = referrals?.filter(r => selectedReferralIds.has(r.id)) || [];
    setUndoState({ referrals: selectedReferrals, action: 'status' });
    
    let succeeded = 0;
    let failed = 0;
    
    try {
      for (const ref of selectedReferrals) {
        const oldStatus = ref.status;
        const { error } = await supabase.from('referrals').update({ status: status as any }).eq('id', ref.id);
        if (error) { failed++; continue; }
        succeeded++;
        
        // Fire webhook for each actual status change
        if (oldStatus !== status) {
          notifyStatusChange(ref.id, oldStatus || '', status);
        }
        
        // Log activity
        try {
          await supabase.from('referral_activity_log').insert({
            referral_id: ref.id,
            activity_type: 'Note',
            note: `[Bulk Update] Status changed to ${status} (part of bulk update affecting ${selectedReferrals.length} referrals)`,
            created_by: 'System',
          } as any);
        } catch {} 
      }
      
      queryClient.invalidateQueries({ queryKey: ['referrals'] });
      
      const undoAction = () => handleUndo();
      toast({
        title: failed > 0 
          ? `Updated ${succeeded} of ${selectedReferrals.length} referrals. ${failed} failed.`
          : `Updated ${succeeded} referrals`,
        action: <Button variant="outline" size="sm" onClick={undoAction}>Undo</Button>,
      });
      
      setSelectedReferralIds(new Set());
      setTimeout(() => setUndoState(null), 5000);
    } catch (error) {
      showToast({ title: "Error updating referrals", variant: "destructive" });
    }
  };

  const handleBulkPriorityUpdate = async (priority: string) => {
    const selectedReferrals = referrals?.filter(r => selectedReferralIds.has(r.id)) || [];
    setUndoState({ referrals: selectedReferrals, action: 'priority' });
    
    try {
      for (const id of Array.from(selectedReferralIds)) {
        await supabase.from('referrals').update({ priority }).eq('id', id);
      }
      queryClient.invalidateQueries({ queryKey: ['referrals'] });
      
      const undoAction = () => handleUndo();
      
      toast({
        title: `Updated ${selectedReferralIds.size} referrals`,
        action: (
          <Button variant="outline" size="sm" onClick={undoAction}>
            Undo
          </Button>
        ),
      });
      
      setSelectedReferralIds(new Set());
      setTimeout(() => setUndoState(null), 5000);
    } catch (error) {
      showToast({ title: "Error updating referrals", variant: "destructive" });
    }
  };

  const handleBulkAssign = async (marketer: string) => {
    const selectedReferrals = referrals?.filter(r => selectedReferralIds.has(r.id)) || [];
    setUndoState({ referrals: selectedReferrals, action: 'assign' });
    
    try {
      for (const id of Array.from(selectedReferralIds)) {
        await supabase.from('referrals').update({ assigned_marketer: marketer }).eq('id', id);
      }
      queryClient.invalidateQueries({ queryKey: ['referrals'] });
      
      const undoAction = () => handleUndo();
      
      toast({
        title: `Assigned ${selectedReferralIds.size} referrals to ${marketer}`,
        action: (
          <Button variant="outline" size="sm" onClick={undoAction}>
            Undo
          </Button>
        ),
      });
      
      setSelectedReferralIds(new Set());
      setTimeout(() => setUndoState(null), 5000);
    } catch (error) {
      showToast({ title: "Error assigning referrals", variant: "destructive" });
    }
  };

  const handleBulkDelete = async () => {
    const selectedReferrals = referrals?.filter(r => selectedReferralIds.has(r.id)) || [];
    setUndoState({ referrals: selectedReferrals, action: 'delete' });
    
    try {
      for (const id of Array.from(selectedReferralIds)) {
        await supabase.from('referrals').update({ deleted_at: new Date().toISOString() } as any).eq('id', id);
      }
      queryClient.invalidateQueries({ queryKey: ['referrals'] });
      
      const undoAction = () => handleUndo();
      
      toast({
        title: `Deleted ${selectedReferralIds.size} referrals`,
        description: "You can undo this action",
        action: (
          <Button variant="outline" size="sm" onClick={undoAction}>
            Undo
          </Button>
        ),
      });
      
      setSelectedReferralIds(new Set());
      setTimeout(() => setUndoState(null), 5000);
    } catch (error) {
      showToast({ title: "Error deleting referrals", variant: "destructive" });
    }
  };

  const handleBulkFollowUpFrequency = async (frequency: string) => {
    const selectedReferrals = referrals?.filter(r => selectedReferralIds.has(r.id)) || [];
    setUndoState({ referrals: selectedReferrals, action: 'followup_frequency' });
    
    try {
      for (const id of Array.from(selectedReferralIds)) {
        await supabase.from('referrals').update({ followup_frequency: frequency } as any).eq('id', id);
      }
      queryClient.invalidateQueries({ queryKey: ['referrals'] });
      toast({ title: `Updated follow-up frequency for ${selectedReferralIds.size} referrals` });
      setSelectedReferralIds(new Set());
      setTimeout(() => setUndoState(null), 5000);
    } catch (error) {
      showToast({ title: "Error updating referrals", variant: "destructive" });
    }
  };

  const handleBulkFollowUpDate = async (date: string) => {
    const selectedReferrals = referrals?.filter(r => selectedReferralIds.has(r.id)) || [];
    setUndoState({ referrals: selectedReferrals, action: 'followup_date' });
    
    try {
      for (const id of Array.from(selectedReferralIds)) {
        await supabase.from('referrals').update({ next_followup_date: date }).eq('id', id);
      }
      queryClient.invalidateQueries({ queryKey: ['referrals'] });
      toast({ title: `Set follow-up date for ${selectedReferralIds.size} referrals` });
      setSelectedReferralIds(new Set());
      setTimeout(() => setUndoState(null), 5000);
    } catch (error) {
      showToast({ title: "Error updating referrals", variant: "destructive" });
    }
  };

  const handleBulkExport = () => {
    const selectedReferrals = referrals?.filter(r => selectedReferralIds.has(r.id)) || [];
    
    if (selectedReferrals.length === 0) {
      showToast({ title: "No referrals selected", variant: "destructive" });
      return;
    }

    const headers = ['Patient Name', 'Status', 'Referral Source', 'Referral Date', 'Assigned To', 'Phone', 'Location', 'Diagnosis', 'Insurance', 'Notes'];
    const rows = selectedReferrals.map(r => [
      r.patient_name || '',
      r.status || '',
      r.organizations?.name || '',
      r.referral_date || '',
      r.assigned_marketer || '',
      r.patient_phone || r.phone || '',
      r.address || '',
      r.diagnosis || '',
      r.insurance || '',
      r.notes || '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    const date = new Date().toISOString().split('T')[0];
    
    link.setAttribute('href', url);
    link.setAttribute('download', `referrals_export_${date}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast({ title: `Exported ${selectedReferrals.length} referrals` });
  };

  const handleUndo = async () => {
    if (!undoState) return;
    
    try {
      if (undoState.action === 'delete') {
        // Re-insert deleted referrals
        for (const referral of undoState.referrals) {
          await supabase.from('referrals').insert(referral);
        }
      } else {
        // Restore previous values
        for (const referral of undoState.referrals) {
          const updates: any = {};
          if (undoState.action === 'status') updates.status = referral.status;
          if (undoState.action === 'priority') updates.priority = referral.priority;
          if (undoState.action === 'assign') updates.assigned_marketer = referral.assigned_marketer;
          if (undoState.action === 'followup_frequency') updates.followup_frequency = referral.followup_frequency;
          if (undoState.action === 'followup_date') updates.next_followup_date = referral.next_followup_date;
          
          await supabase.from('referrals').update(updates).eq('id', referral.id);
        }
      }
      
      queryClient.invalidateQueries({ queryKey: ['referrals'] });
      showToast({ title: "Action undone successfully" });
      setUndoState(null);
    } catch (error) {
      showToast({ title: "Error undoing action", variant: "destructive" });
    }
  };

  const hasResults = referrals && referrals.length > 0;
  const hasSelection = selectedReferralIds.size > 0;
  const allSelected = referrals && referrals.length > 0 && selectedReferralIds.size === referrals.length;

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
            <TableHead className="w-10">
              <Checkbox
                checked={allSelected}
                onCheckedChange={handleSelectAll}
                className="h-4 w-4"
              />
            </TableHead>
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
          {filteredAndSortedReferrals?.map((referral) => (
            <TableRow 
              key={referral.id}
              className={selectedReferralIds.has(referral.id) ? 'bg-primary/5' : ''}
            >
              <TableCell>
                <Checkbox
                  checked={selectedReferralIds.has(referral.id)}
                  onCheckedChange={(checked) => handleSelectReferral(referral.id, !!checked)}
                  onClick={(e: React.MouseEvent) => {
                    if (e.shiftKey) {
                      e.preventDefault();
                      handleSelectReferral(referral.id, !selectedReferralIds.has(referral.id), e);
                    }
                  }}
                  className="h-4 w-4"
                />
              </TableCell>
              <TableCell className="font-medium">
                <Link 
                  to={`/referral/${referral.id}`}
                  className="hover:text-primary hover:underline transition-colors"
                >
                  {referral.patient_name}
                </Link>
              </TableCell>
              <TableCell>{referral.organizations?.name || 'N/A'}</TableCell>
              <TableCell>
              <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeColor(referral.status)}`}>
                  {statusOptions.find(s => s.value === referral.status)?.label || referral.status}
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
                    className="bg-gray-100 hover:bg-gray-200 border-gray-300 text-gray-900 font-semibold"
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

  const handleRefresh = async () => {
    await refetch();
  };

  const renderContent = () => (
    <div className="space-y-6">
      {/* Bulk Actions Toolbar */}
      {hasSelection && (
        <BulkActionsToolbar
          selectedCount={selectedReferralIds.size}
          selectedNames={referrals?.filter(r => selectedReferralIds.has(r.id)).map(r => r.patient_name || 'Unknown') || []}
          onClearSelection={handleClearSelection}
          onBulkStatusUpdate={handleBulkStatusUpdate}
          onBulkPriorityUpdate={handleBulkPriorityUpdate}
          onBulkAssign={handleBulkAssign}
          onBulkDelete={handleBulkDelete}
          onBulkExport={handleBulkExport}
          onBulkFollowUpFrequency={handleBulkFollowUpFrequency}
          onBulkFollowUpDate={handleBulkFollowUpDate}
          marketers={marketers}
        />
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          ref={searchInputRef}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by patient name or organization... (Ctrl+K)"
          className="pl-10 pr-10"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <XIcon className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Result count */}
      {debouncedSearch && (
        <p className="text-sm text-muted-foreground">
          Showing <span className="font-medium text-foreground">{filteredAndSortedReferrals?.length || 0}</span> of {referrals?.length || 0} referrals
        </p>
      )}

      {/* Filter Bar */}
      <ReferralsFilterBar
        filters={filters}
        onFiltersChange={setFilters}
        totalCount={totalReferrals || 0}
        filteredCount={filteredAndSortedReferrals?.length || 0}
      />

      <div className="flex justify-between items-center gap-3">
        <div className="flex items-center gap-3">
          {hasResults && (
            <div className="flex items-center gap-2">
              <Checkbox
                checked={allSelected}
                onCheckedChange={handleSelectAll}
                className="h-5 w-5"
              />
              <span className="text-sm text-muted-foreground">
                Select All
              </span>
            </div>
          )}
        </div>
        
        <div className="flex gap-3">
          <ViewToggle view={view} onViewChange={setView} />
          {!isTabletOrMobile && (
            <Button 
              onClick={() => setShowAddDialog(true)} 
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-md hover:shadow-lg transition-all"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Referral
            </Button>
          )}
        </div>
      </div>

      {!hasResults ? (
        <EmptyState
          icon={Phone}
          title="No referrals yet"
          description="Add your first referral to start tracking"
          actionLabel="Add Referral"
          onAction={() => setShowAddDialog(true)}
        />
      ) : (
        <>
          {view === 'list' ? renderListView() : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 animate-fade-in">
              {filteredAndSortedReferrals?.map((referral, index) => (
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
                    onStatusChange={(id, status) => updateStatusMutation.mutate({ id, status: status as ReferralStatusValue })}
                    onPriorityChange={(id, priority) => updatePriorityMutation.mutate({ id, priority })}
                    onMarketerChange={handleMarketerChange}
                    onEdit={handleEditReferral}
                    onSchedule={handleScheduleReferral}
                    isSelected={selectedReferralIds.has(referral.id)}
                    onSelectChange={handleSelectReferral}
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

  return isTabletOrMobile ? (
    <PullToRefresh
      onRefresh={handleRefresh}
      pullingContent={
        <div className="flex justify-center py-4 text-muted-foreground">
          <span className="text-sm">Pull down to refresh...</span>
        </div>
      }
      refreshingContent={
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </div>
      }
      resistance={2}
      maxPullDownDistance={80}
      className="min-h-screen"
    >
      {renderContent()}
    </PullToRefresh>
  ) : (
    renderContent()
  );
};

export default ReferralsList;
