
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Phone, Mail, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

type ReferralStatus = 'pending' | 'contacted' | 'scheduled' | 'admitted' | 'declined' | 'lost';

const ReferralsList = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedStatus, setSelectedStatus] = useState<ReferralStatus | 'all'>('all');

  const { data: referrals, isLoading } = useQuery({
    queryKey: ['referrals', selectedStatus],
    queryFn: async () => {
      let query = supabase
        .from('referrals')
        .select('*, organizations(name, type)')
        .order('created_at', { ascending: false });

      if (selectedStatus !== 'all') {
        query = query.eq('status', selectedStatus);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'contacted': return 'bg-blue-100 text-blue-800';
      case 'scheduled': return 'bg-purple-100 text-purple-800';
      case 'admitted': return 'bg-green-100 text-green-800';
      case 'declined': return 'bg-red-100 text-red-800';
      case 'lost': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
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
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="contacted">Contacted</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="admitted">Admitted</SelectItem>
              <SelectItem value="declined">Declined</SelectItem>
              <SelectItem value="lost">Lost</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Referral
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Patient</TableHead>
            <TableHead>Organization</TableHead>
            <TableHead>Diagnosis</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Referral Date</TableHead>
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
                  <SelectTrigger className="w-32">
                    <Badge className={getStatusColor(referral.status || 'pending')}>
                      {referral.status || 'pending'}
                    </Badge>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="admitted">Admitted</SelectItem>
                    <SelectItem value="declined">Declined</SelectItem>
                    <SelectItem value="lost">Lost</SelectItem>
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
    </div>
  );
};

export default ReferralsList;
