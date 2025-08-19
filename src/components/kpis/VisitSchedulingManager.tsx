import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, MapPin, User, AlertCircle, CheckCircle, Plus, Bell, Filter } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, addDays, startOfWeek, endOfWeek, isToday, isTomorrow, isPast, startOfDay } from 'date-fns';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface VisitSchedulingManagerProps {
  marketerName?: string;
}

const VisitSchedulingManager: React.FC<VisitSchedulingManagerProps> = ({ marketerName }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedView, setSelectedView] = useState<'week' | 'alerts' | 'schedule'>('week');
  const [selectedMarketer, setSelectedMarketer] = useState<string>(marketerName || 'all');
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [selectedOrganization, setSelectedOrganization] = useState<any>(null);
  const [visitData, setVisitData] = useState({
    scheduled_date: '',
    scheduled_time: '09:00',
    visit_type: 'routine',
    notes: ''
  });

  // Get current week range
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });

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

  // Fetch scheduled visits
  const { data: scheduledVisits, isLoading: visitsLoading } = useQuery({
    queryKey: ['scheduled-visits', selectedMarketer, selectedView],
    queryFn: async () => {
      let query = supabase
        .from('visit_schedule')
        .select(`
          *,
          organizations(name, type, account_tier, assigned_marketer)
        `)
        .gte('scheduled_date', weekStart.toISOString().split('T')[0])
        .lte('scheduled_date', weekEnd.toISOString().split('T')[0])
        .order('scheduled_date', { ascending: true });

      if (selectedMarketer !== 'all') {
        query = query.eq('marketer_name', selectedMarketer);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  // Fetch visit alerts (overdue and due soon)
  const { data: visitAlerts, isLoading: alertsLoading } = useQuery({
    queryKey: ['visit-alerts', selectedMarketer],
    queryFn: async () => {
      let orgQuery = supabase
        .from('organizations')
        .select('*')
        .eq('is_active', true)
        .not('visit_frequency_requirement', 'is', null);

      if (selectedMarketer !== 'all') {
        orgQuery = orgQuery.eq('assigned_marketer', selectedMarketer);
      }

      const { data: organizations, error } = await orgQuery;
      if (error) throw error;

      const alerts = [];
      const today = new Date();

      for (const org of organizations || []) {
        if (!org.last_visit_date) {
          alerts.push({
            organization: org,
            status: 'never_visited',
            priority: 'high',
            message: 'Never visited - immediate action required'
          });
          continue;
        }

        const lastVisit = new Date(org.last_visit_date);
        const daysSinceVisit = Math.floor((today.getTime() - lastVisit.getTime()) / (1000 * 60 * 60 * 24));

        let requiredFrequency = 30; // Default monthly
        switch (org.visit_frequency_requirement) {
          case 'weekly': requiredFrequency = 7; break;
          case 'biweekly': requiredFrequency = 14; break;
          case 'monthly': requiredFrequency = 30; break;
          case 'quarterly': requiredFrequency = 90; break;
        }

        const dueIn = requiredFrequency - daysSinceVisit;

        if (dueIn < 0) {
          alerts.push({
            organization: org,
            status: 'overdue',
            priority: 'high',
            message: `${Math.abs(dueIn)} days overdue`,
            daysOverdue: Math.abs(dueIn)
          });
        } else if (dueIn <= 3) {
          alerts.push({
            organization: org,
            status: 'due_soon',
            priority: 'medium',
            message: `Due in ${dueIn} ${dueIn === 1 ? 'day' : 'days'}`,
            daysUntilDue: dueIn
          });
        }
      }

      // Sort by priority and urgency
      return alerts.sort((a, b) => {
        if (a.priority !== b.priority) {
          return a.priority === 'high' ? -1 : 1;
        }
        if (a.status === 'overdue' && b.status === 'overdue') {
          return (b.daysOverdue || 0) - (a.daysOverdue || 0);
        }
        if (a.status === 'due_soon' && b.status === 'due_soon') {
          return (a.daysUntilDue || 0) - (b.daysUntilDue || 0);
        }
        return 0;
      });
    }
  });

  // Schedule visit mutation
  const scheduleVisitMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('visit_schedule')
        .insert({
          organization_id: selectedOrganization.id,
          marketer_name: selectedOrganization.assigned_marketer || selectedMarketer,
          ...data,
          status: 'scheduled'
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Visit scheduled successfully" });
      setShowScheduleDialog(false);
      resetVisitForm();
      queryClient.invalidateQueries({ queryKey: ['scheduled-visits'] });
      queryClient.invalidateQueries({ queryKey: ['visit-alerts'] });
    },
    onError: () => {
      toast({ title: "Error scheduling visit", variant: "destructive" });
    }
  });

  // Complete visit mutation
  const completeVisitMutation = useMutation({
    mutationFn: async (visitId: string) => {
      const { error } = await supabase
        .from('visit_schedule')
        .update({ 
          status: 'completed',
          completed_date: new Date().toISOString()
        })
        .eq('id', visitId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Visit marked as completed" });
      queryClient.invalidateQueries({ queryKey: ['scheduled-visits'] });
    },
    onError: () => {
      toast({ title: "Error updating visit", variant: "destructive" });
    }
  });

  const resetVisitForm = () => {
    setVisitData({
      scheduled_date: '',
      scheduled_time: '09:00',
      visit_type: 'routine',
      notes: ''
    });
    setSelectedOrganization(null);
  };

  const getVisitStatusColor = (visit: any) => {
    if (visit.status === 'completed') return 'bg-green-100 text-green-800';
    if (visit.status === 'cancelled') return 'bg-gray-100 text-gray-800';
    if (isPast(new Date(visit.scheduled_date)) && visit.status === 'scheduled') {
      return 'bg-red-100 text-red-800';
    }
    if (isToday(new Date(visit.scheduled_date))) return 'bg-blue-100 text-blue-800';
    if (isTomorrow(new Date(visit.scheduled_date))) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getAlertColor = (alert: any) => {
    switch (alert.status) {
      case 'overdue': return 'border-red-200 bg-red-50';
      case 'never_visited': return 'border-red-300 bg-red-100';
      case 'due_soon': return 'border-yellow-200 bg-yellow-50';
      default: return 'border-gray-200';
    }
  };

  const getAlertIcon = (alert: any) => {
    switch (alert.status) {
      case 'overdue':
      case 'never_visited':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'due_soon':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <Bell className="h-4 w-4 text-blue-600" />;
    }
  };

  const weekDays = [];
  for (let i = 0; i < 7; i++) {
    weekDays.push(addDays(weekStart, i));
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Visit Scheduling & Alerts
              </CardTitle>
              <CardDescription>Manage visit schedules and compliance alerts</CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={selectedMarketer} onValueChange={setSelectedMarketer}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Marketers</SelectItem>
                  {marketers?.map((marketer: string) => (
                    <SelectItem key={marketer} value={marketer}>
                      {marketer}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedView} onValueChange={(value: 'week' | 'alerts' | 'schedule') => setSelectedView(value)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="week">Week View</TabsTrigger>
              <TabsTrigger value="alerts" className="relative">
                Alerts
                {visitAlerts && visitAlerts.length > 0 && (
                  <Badge className="ml-2 bg-red-100 text-red-800 text-xs">
                    {visitAlerts.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="schedule">Schedule Visit</TabsTrigger>
            </TabsList>

            <TabsContent value="week" className="mt-6">
              {visitsLoading ? (
                <p className="text-sm text-muted-foreground">Loading weekly schedule...</p>
              ) : (
                <div className="space-y-4">
                  <h4 className="font-medium">This Week's Schedule</h4>
                  <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
                    {weekDays.map((day) => {
                      const dayVisits = scheduledVisits?.filter(visit => 
                        format(new Date(visit.scheduled_date), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
                      ) || [];

                      return (
                        <div key={format(day, 'yyyy-MM-dd')} className="border rounded-lg p-3">
                          <div className="text-center mb-3">
                            <p className="text-xs text-muted-foreground">
                              {format(day, 'EEE')}
                            </p>
                            <p className={`text-lg font-semibold ${
                              isToday(day) ? 'text-blue-600' : 'text-gray-900'
                            }`}>
                              {format(day, 'd')}
                            </p>
                          </div>
                          
                          <div className="space-y-2">
                            {dayVisits.length === 0 ? (
                              <p className="text-xs text-gray-400 text-center">No visits</p>
                            ) : (
                              dayVisits.map((visit) => (
                                <div key={visit.id} className="p-2 rounded text-xs border">
                                  <div className="flex justify-between items-start mb-1">
                                    <span className="font-medium truncate">
                                      {visit.organizations?.name}
                                    </span>
                                    <Badge className={getVisitStatusColor(visit)}>
                                      {visit.status}
                                    </Badge>
                                  </div>
                                  <p className="text-muted-foreground">
                                    {visit.scheduled_time || '09:00'}
                                  </p>
                                  {visit.status === 'scheduled' && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="w-full mt-2 h-6 text-xs"
                                      onClick={() => completeVisitMutation.mutate(visit.id)}
                                    >
                                      Mark Complete
                                    </Button>
                                  )}
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="alerts" className="mt-6">
              {alertsLoading ? (
                <p className="text-sm text-muted-foreground">Loading visit alerts...</p>
              ) : visitAlerts && visitAlerts.length > 0 ? (
                <div className="space-y-3">
                  <h4 className="font-medium">Visit Compliance Alerts</h4>
                  {visitAlerts.map((alert, index) => (
                    <div key={index} className={`p-4 border rounded-lg ${getAlertColor(alert)}`}>
                      <div className="flex justify-between items-start">
                        <div className="flex items-start gap-3">
                          {getAlertIcon(alert)}
                          <div>
                            <p className="font-medium">{alert.organization.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {alert.organization.type?.replace('_', ' ')} • 
                              {alert.organization.visit_frequency_requirement} visits required
                            </p>
                            <p className="text-sm font-medium mt-1">{alert.message}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Badge className={
                            alert.organization.account_tier === 'A' ? 'bg-green-100 text-green-800' :
                            alert.organization.account_tier === 'B' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }>
                            {alert.organization.account_tier || 'C'}
                          </Badge>
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedOrganization(alert.organization);
                              setShowScheduleDialog(true);
                            }}
                          >
                            Schedule Visit
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <h4 className="font-medium text-green-800">All Caught Up!</h4>
                  <p className="text-sm text-green-600">No urgent visit alerts at this time</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="schedule" className="mt-6">
              <div className="max-w-md">
                <h4 className="font-medium mb-4">Quick Schedule</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Select an organization from alerts or use the main scheduling interface
                </p>
                <Button onClick={() => setShowScheduleDialog(true)} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Schedule New Visit
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Schedule Visit Dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Schedule Visit</DialogTitle>
            <DialogDescription>
              {selectedOrganization 
                ? `Schedule a visit with ${selectedOrganization.name}`
                : 'Schedule a new visit'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {!selectedOrganization && (
              <div className="space-y-2">
                <Label>Organization</Label>
                <p className="text-sm text-muted-foreground">
                  Please select an organization from the alerts or main interface
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="visit-date">Date</Label>
                <Input
                  id="visit-date"
                  type="date"
                  value={visitData.scheduled_date}
                  onChange={(e) => setVisitData({ ...visitData, scheduled_date: e.target.value })}
                  min={format(new Date(), 'yyyy-MM-dd')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="visit-time">Time</Label>
                <Input
                  id="visit-time"
                  type="time"
                  value={visitData.scheduled_time}
                  onChange={(e) => setVisitData({ ...visitData, scheduled_time: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="visit-type">Visit Type</Label>
              <Select
                value={visitData.visit_type}
                onValueChange={(value) => setVisitData({ ...visitData, visit_type: value })}
              >
                <SelectTrigger id="visit-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="routine">Routine Visit</SelectItem>
                  <SelectItem value="urgent">Urgent Visit</SelectItem>
                  <SelectItem value="introduction">Introduction</SelectItem>
                  <SelectItem value="training">Training Session</SelectItem>
                  <SelectItem value="event">Event/Lunch & Learn</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="visit-notes">Notes</Label>
              <Textarea
                id="visit-notes"
                value={visitData.notes}
                onChange={(e) => setVisitData({ ...visitData, notes: e.target.value })}
                placeholder="Purpose, agenda, preparation notes..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowScheduleDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => scheduleVisitMutation.mutate(visitData)}
              disabled={!selectedOrganization || !visitData.scheduled_date}
            >
              Schedule Visit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default VisitSchedulingManager;