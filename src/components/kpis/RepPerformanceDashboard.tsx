import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Target, Activity, Users, Calendar, Award, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subWeeks, differenceInDays } from 'date-fns';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface RepPerformanceDashboardProps {
  marketerName?: string;
}

const RepPerformanceDashboard: React.FC<RepPerformanceDashboardProps> = ({ marketerName }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month'>('week');
  const [selectedMarketer, setSelectedMarketer] = useState<string>(marketerName || 'all');
  const [showCoachingDialog, setShowCoachingDialog] = useState(false);
  const [coachingData, setCoachingData] = useState({
    coaching_type: 'field_coaching',
    focus_areas: '',
    action_items: '',
    follow_up_date: ''
  });

  // Fetch marketers list
  const { data: marketers } = useQuery({
    queryKey: ['marketers-list'],
    queryFn: () => {
      const stored = localStorage.getItem('hospice-marketers');
      if (stored) {
        return JSON.parse(stored);
      }
      return ['John Smith', 'Sarah Johnson', 'Mike Davis', 'Lisa Wilson', 'David Brown'];
    }
  });

  // Calculate date range based on selected period
  const getDateRange = () => {
    const now = new Date();
    if (selectedPeriod === 'week') {
      return {
        start: startOfWeek(now, { weekStartsOn: 1 }),
        end: endOfWeek(now, { weekStartsOn: 1 })
      };
    } else {
      return {
        start: startOfMonth(now),
        end: endOfMonth(now)
      };
    }
  };

  const dateRange = getDateRange();

  // Fetch performance metrics
  const { data: performanceData, isLoading } = useQuery({
    queryKey: ['rep-performance', selectedMarketer, selectedPeriod],
    queryFn: async () => {
      // Get events for the period
      let eventsQuery = supabase
        .from('sales_events')
        .select('*')
        .gte('event_date', dateRange.start.toISOString().split('T')[0])
        .lte('event_date', dateRange.end.toISOString().split('T')[0]);

      if (selectedMarketer !== 'all') {
        eventsQuery = eventsQuery.eq('marketer_name', selectedMarketer);
      }

      const { data: events, error: eventsError } = await eventsQuery;
      if (eventsError) throw eventsError;

      // Get previous period for comparison
      const prevStart = selectedPeriod === 'week' 
        ? subWeeks(dateRange.start, 1)
        : new Date(dateRange.start.getFullYear(), dateRange.start.getMonth() - 1, 1);
      
      let prevEventsQuery = supabase
        .from('sales_events')
        .select('*')
        .gte('event_date', prevStart.toISOString().split('T')[0])
        .lt('event_date', dateRange.start.toISOString().split('T')[0]);

      if (selectedMarketer !== 'all') {
        prevEventsQuery = prevEventsQuery.eq('marketer_name', selectedMarketer);
      }

      const { data: prevEvents } = await prevEventsQuery;

      // Calculate metrics
      const totalEvents = events?.length || 0;
      const prevTotalEvents = prevEvents?.length || 0;
      const eventsGoal = selectedPeriod === 'week' ? 50 : 200; // Weekly goal: 50, Monthly: 200
      const eventsPercentage = (totalEvents / eventsGoal) * 100;

      const totalReferrals = events?.reduce((sum, e) => sum + (e.referrals_generated || 0), 0) || 0;
      const prevTotalReferrals = prevEvents?.reduce((sum, e) => sum + (e.referrals_generated || 0), 0) || 0;

      // Count unique organizations visited
      const uniqueOrgs = new Set(events?.map(e => e.organization_id).filter(Boolean));
      const uniqueOrgCount = uniqueOrgs.size;

      // Calculate event type breakdown
      const eventTypes = events?.reduce((acc, e) => {
        acc[e.event_type] = (acc[e.event_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      // Calculate average events per day
      const daysInPeriod = differenceInDays(dateRange.end, dateRange.start) + 1;
      const avgEventsPerDay = totalEvents / daysInPeriod;

      // Get coaching events for the marketer
      let coachingQuery = supabase
        .from('coaching_events')
        .select('*')
        .gte('coaching_date', dateRange.start.toISOString().split('T')[0])
        .lte('coaching_date', dateRange.end.toISOString().split('T')[0]);

      if (selectedMarketer !== 'all') {
        coachingQuery = coachingQuery.eq('marketer_name', selectedMarketer);
      }

      const { data: coachingEvents } = await coachingQuery;

      // Calculate trends
      const eventsTrend = prevTotalEvents > 0 
        ? ((totalEvents - prevTotalEvents) / prevTotalEvents) * 100
        : 0;

      const referralsTrend = prevTotalReferrals > 0
        ? ((totalReferrals - prevTotalReferrals) / prevTotalReferrals) * 100
        : 0;

      return {
        totalEvents,
        eventsGoal,
        eventsPercentage,
        eventsTrend,
        totalReferrals,
        referralsTrend,
        uniqueOrgCount,
        eventTypes,
        avgEventsPerDay,
        coachingEvents: coachingEvents || [],
        referralsPerEvent: totalEvents > 0 ? (totalReferrals / totalEvents).toFixed(2) : '0'
      };
    }
  });

  // Log coaching event mutation
  const logCoachingMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('coaching_events')
        .insert({
          marketer_name: selectedMarketer === 'all' ? marketers?.[0] : selectedMarketer,
          coach_name: 'Current User', // In production, get from auth context
          coaching_date: new Date().toISOString().split('T')[0],
          ...data,
          focus_areas: data.focus_areas.split(',').map((s: string) => s.trim())
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Coaching session logged successfully" });
      setShowCoachingDialog(false);
      resetCoachingForm();
      queryClient.invalidateQueries({ queryKey: ['rep-performance'] });
    },
    onError: () => {
      toast({ title: "Error logging coaching session", variant: "destructive" });
    }
  });

  const resetCoachingForm = () => {
    setCoachingData({
      coaching_type: 'field_coaching',
      focus_areas: '',
      action_items: '',
      follow_up_date: ''
    });
  };

  const getPerformanceStatus = (percentage: number) => {
    if (percentage >= 100) return { color: 'text-green-600', bg: 'bg-green-100', label: 'Exceeding Goal' };
    if (percentage >= 80) return { color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'On Track' };
    if (percentage >= 60) return { color: 'text-orange-600', bg: 'bg-orange-100', label: 'Behind' };
    return { color: 'text-red-600', bg: 'bg-red-100', label: 'At Risk' };
  };

  const formatTrend = (trend: number) => {
    const isPositive = trend > 0;
    return (
      <span className={`flex items-center gap-1 text-sm font-medium ${
        isPositive ? 'text-green-600' : 'text-red-600'
      }`}>
        {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
        {Math.abs(trend).toFixed(1)}%
      </span>
    );
  };

  const eventTypeLabels: Record<string, string> = {
    in_person: 'In-Person',
    virtual: 'Virtual',
    phone: 'Phone',
    email: 'Email',
    event: 'Event',
    training: 'Training'
  };

  const performanceStatus = performanceData ? getPerformanceStatus(performanceData.eventsPercentage) : null;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Rep Performance Dashboard
              </CardTitle>
              <CardDescription>Track individual and team performance metrics</CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={selectedMarketer} onValueChange={setSelectedMarketer}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Reps</SelectItem>
                  {marketers?.map((marketer: string) => (
                    <SelectItem key={marketer} value={marketer}>
                      {marketer}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedPeriod} onValueChange={(value: 'week' | 'month') => setSelectedPeriod(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading performance data...</p>
          ) : performanceData ? (
            <div className="space-y-6">
              {/* Primary Performance Metric */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">Events Completed</h3>
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="text-3xl font-bold">{performanceData.totalEvents}</span>
                      <span className="text-lg text-muted-foreground">/ {performanceData.eventsGoal}</span>
                    </div>
                    {performanceData.eventsTrend !== 0 && formatTrend(performanceData.eventsTrend)}
                  </div>
                  <div className="text-right">
                    <Badge className={`${performanceStatus?.bg} ${performanceStatus?.color} border-0`}>
                      {performanceStatus?.label}
                    </Badge>
                    <div className="mt-2 text-2xl font-bold">
                      {performanceData.eventsPercentage.toFixed(0)}%
                    </div>
                  </div>
                </div>
                <Progress value={performanceData.eventsPercentage} className="h-3" />
                <p className="text-sm text-muted-foreground mt-2">
                  {performanceData.avgEventsPerDay.toFixed(1)} events per day average
                </p>
              </div>

              {/* Key Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Referrals Generated</span>
                    <Target className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="text-2xl font-bold">{performanceData.totalReferrals}</div>
                  {performanceData.referralsTrend !== 0 && formatTrend(performanceData.referralsTrend)}
                  <p className="text-xs text-muted-foreground mt-1">
                    {performanceData.referralsPerEvent} per event
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Accounts Visited</span>
                    <Users className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="text-2xl font-bold">{performanceData.uniqueOrgCount}</div>
                  <p className="text-xs text-muted-foreground mt-1">Unique organizations</p>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Coaching Sessions</span>
                    <Award className="h-4 w-4 text-purple-600" />
                  </div>
                  <div className="text-2xl font-bold">{performanceData.coachingEvents.length}</div>
                  <Button 
                    size="sm" 
                    variant="link" 
                    className="p-0 h-auto text-xs"
                    onClick={() => setShowCoachingDialog(true)}
                  >
                    Log coaching →
                  </Button>
                </div>
              </div>

              {/* Event Type Breakdown */}
              <div>
                <h4 className="font-medium mb-3">Event Type Distribution</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries(performanceData.eventTypes).map(([type, count]) => (
                    <div key={type} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm">{eventTypeLabels[type] || type}</span>
                      <span className="font-semibold">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Coaching Events */}
              {performanceData.coachingEvents.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3">Recent Coaching</h4>
                  <div className="space-y-2">
                    {performanceData.coachingEvents.slice(0, 3).map((event) => (
                      <div key={event.id} className="p-3 bg-purple-50 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-sm">{event.coaching_type.replace('_', ' ')}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(event.coaching_date), 'MMM d, yyyy')}
                            </p>
                          </div>
                          {event.follow_up_date && (
                            <Badge variant="outline" className="text-xs">
                              <Clock className="h-3 w-3 mr-1" />
                              Follow-up: {format(new Date(event.follow_up_date), 'MMM d')}
                            </Badge>
                          )}
                        </div>
                        {event.action_items && (
                          <p className="text-xs mt-2 text-gray-700">{event.action_items}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Performance Indicators */}
              <div className="flex gap-2 flex-wrap">
                {performanceData.eventsPercentage >= 100 && (
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Goal Achieved
                  </Badge>
                )}
                {performanceData.avgEventsPerDay >= 10 && (
                  <Badge className="bg-blue-100 text-blue-800">
                    <Activity className="h-3 w-3 mr-1" />
                    High Activity
                  </Badge>
                )}
                {parseFloat(performanceData.referralsPerEvent) >= 0.5 && (
                  <Badge className="bg-purple-100 text-purple-800">
                    <Target className="h-3 w-3 mr-1" />
                    Strong Conversion
                  </Badge>
                )}
                {performanceData.eventsPercentage < 60 && (
                  <Badge className="bg-red-100 text-red-800">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Needs Support
                  </Badge>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No performance data available
            </p>
          )}
        </CardContent>
      </Card>

      {/* Coaching Dialog */}
      <Dialog open={showCoachingDialog} onOpenChange={setShowCoachingDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Log Coaching Session</DialogTitle>
            <DialogDescription>
              Document coaching provided to {selectedMarketer === 'all' ? 'team' : selectedMarketer}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="coaching-type">Coaching Type</Label>
              <Select
                value={coachingData.coaching_type}
                onValueChange={(value) => setCoachingData({ ...coachingData, coaching_type: value })}
              >
                <SelectTrigger id="coaching-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="field_coaching">Field Coaching</SelectItem>
                  <SelectItem value="pto_management">PTO Management</SelectItem>
                  <SelectItem value="performance_review">Performance Review</SelectItem>
                  <SelectItem value="skill_development">Skill Development</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="focus-areas">Focus Areas (comma-separated)</Label>
              <Input
                id="focus-areas"
                value={coachingData.focus_areas}
                onChange={(e) => setCoachingData({ ...coachingData, focus_areas: e.target.value })}
                placeholder="e.g., Time management, Objection handling, Account prioritization"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="action-items">Action Items</Label>
              <Textarea
                id="action-items"
                value={coachingData.action_items}
                onChange={(e) => setCoachingData({ ...coachingData, action_items: e.target.value })}
                placeholder="Specific actions and next steps..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="follow-up-date">Follow-up Date</Label>
              <Input
                id="follow-up-date"
                type="date"
                value={coachingData.follow_up_date}
                onChange={(e) => setCoachingData({ ...coachingData, follow_up_date: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCoachingDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => logCoachingMutation.mutate(coachingData)}>
              Log Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default RepPerformanceDashboard;