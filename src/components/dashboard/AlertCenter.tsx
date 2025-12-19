import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, UserPlus, Clock, Phone } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const AlertCenter = () => {
  const navigate = useNavigate();

  // Fetch unassigned referrals
  const { data: unassignedReferrals } = useQuery({
    queryKey: ['unassigned-referrals'],
    queryFn: async () => {
      const { count } = await supabase
        .from('referrals')
        .select('*', { count: 'exact', head: true })
        .or('assigned_marketer.is.null,assigned_marketer.eq.')
        .in('status', ['new_referral', 'contact_attempted', 'information_gathering']);
      
      return count || 0;
    }
  });

  // Fetch overdue follow-ups
  const { data: overdueFollowUps } = useQuery({
    queryKey: ['overdue-followups-count'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      
      const { count } = await supabase
        .from('activity_communications')
        .select('*', { count: 'exact', head: true })
        .eq('follow_up_required', true)
        .eq('follow_up_completed', false)
        .lt('follow_up_date', today);

      return count || 0;
    }
  });

  // Fetch urgent referrals
  const { data: urgentReferrals } = useQuery({
    queryKey: ['urgent-referrals'],
    queryFn: async () => {
      const { count } = await supabase
        .from('referrals')
        .select('*', { count: 'exact', head: true })
        .eq('priority', 'urgent')
        .in('status', ['new_referral', 'contact_attempted', 'information_gathering']);
      
      return count || 0;
    }
  });

  // Don't show the alert center if there are no alerts
  const totalAlerts = (unassignedReferrals || 0) + (overdueFollowUps || 0) + (urgentReferrals || 0);
  if (totalAlerts === 0) return null;

  return (
    <Card className="bg-red-50 border-red-200 mb-6">
      <CardContent className="pt-6">
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <h3 className="text-lg font-semibold text-red-900">URGENT ACTIONS NEEDED</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Unassigned Referrals */}
          {unassignedReferrals > 0 && (
            <div className="bg-white rounded-lg p-4 border border-red-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <UserPlus className="h-4 w-4 text-red-600" />
                    <span className="text-2xl font-bold text-red-900">{unassignedReferrals}</span>
                  </div>
                  <p className="text-sm text-red-700">Unassigned Referrals</p>
                </div>
                <Button 
                  size="sm" 
                  variant="destructive"
                  onClick={() => navigate('/referrals?filter=unassigned')}
                >
                  Assign Now
                </Button>
              </div>
            </div>
          )}

          {/* Overdue Follow-ups */}
          {overdueFollowUps > 0 && (
            <div className="bg-white rounded-lg p-4 border border-red-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="h-4 w-4 text-red-600" />
                    <span className="text-2xl font-bold text-red-900">{overdueFollowUps}</span>
                  </div>
                  <p className="text-sm text-red-700">Overdue Follow-ups</p>
                </div>
                <Button 
                  size="sm" 
                  variant="destructive"
                  onClick={() => navigate('/organizations?tab=activities&filter=overdue')}
                >
                  Review
                </Button>
              </div>
            </div>
          )}

          {/* Urgent Referrals */}
          {urgentReferrals > 0 && (
            <div className="bg-white rounded-lg p-4 border border-red-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Phone className="h-4 w-4 text-red-600" />
                    <span className="text-2xl font-bold text-red-900">{urgentReferrals}</span>
                  </div>
                  <p className="text-sm text-red-700">Urgent Referrals</p>
                </div>
                <Button 
                  size="sm" 
                  variant="destructive"
                  onClick={() => navigate('/referrals?filter=urgent')}
                >
                  Contact Now
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AlertCenter; 