import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Calendar, CheckCircle, Clock, MapPin, Phone, User, Video, Users } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, differenceInDays, addDays, addWeeks, addMonths } from 'date-fns';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface EventFrequencyManagerProps {
  organizationId?: string;
  marketerName?: string;
}

const EventFrequencyManager: React.FC<EventFrequencyManagerProps> = ({ organizationId, marketerName }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showLogEventDialog, setShowLogEventDialog] = useState(false);
  const [selectedOrganization, setSelectedOrganization] = useState<any>(null);
  const [newEvent, setNewEvent] = useState({
    event_type: 'in_person',
    duration_minutes: 30,
    contacts_engaged: 1,
    referrals_generated: 0,
    notes: '',
    follow_up_required: false,
    follow_up_date: ''
  });

  // Fetch organizations with visit frequency requirements
  const { data: organizations, isLoading } = useQuery({
    queryKey: ['organizations-visit-frequency', marketerName],
    queryFn: async () => {
      let query = supabase
        .from('organizations')
        .select('*')
        .eq('is_active', true)
        .not('visit_frequency_requirement', 'is', null);

      if (marketerName) {
        query = query.eq('assigned_marketer', marketerName);
      }
      if (organizationId) {
        query = query.eq('id', organizationId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  // Fetch recent events
  const { data: recentEvents } = useQuery({
    queryKey: ['recent-sales-events', marketerName],
    queryFn: async () => {
      let query = supabase
        .from('sales_events')
        .select(`
          *,
          organizations(name, type)
        `)
        .order('event_date', { ascending: false })
        .limit(10);

      if (marketerName) {
        query = query.eq('marketer_name', marketerName);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  // Log event mutation
  const logEventMutation = useMutation({
    mutationFn: async (eventData: any) => {
      const { error } = await supabase
        .from('sales_events')
        .insert({
          organization_id: selectedOrganization.id,
          marketer_name: selectedOrganization.assigned_marketer || marketerName,
          event_date: new Date().toISOString().split('T')[0],
          ...eventData
        });

      if (error) throw error;

      // Update organization's last visit date
      await supabase
        .from('organizations')
        .update({ 
          last_visit_date: new Date().toISOString().split('T')[0],
          next_scheduled_visit: calculateNextVisitDate(selectedOrganization.visit_frequency_requirement)
        })
        .eq('id', selectedOrganization.id);
    },
    onSuccess: () => {
      toast({ title: "Event logged successfully" });
      setShowLogEventDialog(false);
      resetEventForm();
      queryClient.invalidateQueries({ queryKey: ['organizations-visit-frequency'] });
      queryClient.invalidateQueries({ queryKey: ['recent-sales-events'] });
    },
    onError: () => {
      toast({ title: "Error logging event", variant: "destructive" });
    }
  });

  const calculateNextVisitDate = (frequency: string) => {
    const today = new Date();
    switch (frequency) {
      case 'weekly':
        return addWeeks(today, 1).toISOString().split('T')[0];
      case 'biweekly':
        return addWeeks(today, 2).toISOString().split('T')[0];
      case 'monthly':
        return addMonths(today, 1).toISOString().split('T')[0];
      case 'quarterly':
        return addMonths(today, 3).toISOString().split('T')[0];
      default:
        return addMonths(today, 1).toISOString().split('T')[0];
    }
  };

  const resetEventForm = () => {
    setNewEvent({
      event_type: 'in_person',
      duration_minutes: 30,
      contacts_engaged: 1,
      referrals_generated: 0,
      notes: '',
      follow_up_required: false,
      follow_up_date: ''
    });
    setSelectedOrganization(null);
  };

  const getVisitComplianceStatus = (org: any) => {
    if (!org.last_visit_date) return 'overdue';
    
    const daysSinceVisit = differenceInDays(new Date(), new Date(org.last_visit_date));
    
    switch (org.visit_frequency_requirement) {
      case 'weekly':
        return daysSinceVisit <= 7 ? 'compliant' : daysSinceVisit <= 10 ? 'due_soon' : 'overdue';
      case 'biweekly':
        return daysSinceVisit <= 14 ? 'compliant' : daysSinceVisit <= 17 ? 'due_soon' : 'overdue';
      case 'monthly':
        return daysSinceVisit <= 30 ? 'compliant' : daysSinceVisit <= 35 ? 'due_soon' : 'overdue';
      case 'quarterly':
        return daysSinceVisit <= 90 ? 'compliant' : daysSinceVisit <= 100 ? 'due_soon' : 'overdue';
      default:
        return 'compliant';
    }
  };

  const getComplianceBadge = (status: string) => {
    switch (status) {
      case 'compliant':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Compliant</Badge>;
      case 'due_soon':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Due Soon</Badge>;
      case 'overdue':
        return <Badge className="bg-red-100 text-red-800"><AlertCircle className="h-3 w-3 mr-1" />Overdue</Badge>;
      default:
        return null;
    }
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'in_person':
        return <MapPin className="h-4 w-4" />;
      case 'virtual':
        return <Video className="h-4 w-4" />;
      case 'phone':
        return <Phone className="h-4 w-4" />;
      case 'event':
        return <Users className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  const getFrequencyLabel = (frequency: string) => {
    switch (frequency) {
      case 'weekly':
        return '1x per week';
      case 'biweekly':
        return '1x per 2 weeks';
      case 'monthly':
        return '1x per month';
      case 'quarterly':
        return '1x per quarter';
      default:
        return frequency;
    }
  };

  // Calculate compliance statistics
  const complianceStats = organizations?.reduce((acc, org) => {
    const status = getVisitComplianceStatus(org);
    acc[status] = (acc[status] || 0) + 1;
    acc.total++;
    return acc;
  }, { compliant: 0, due_soon: 0, overdue: 0, total: 0 }) || { compliant: 0, due_soon: 0, overdue: 0, total: 0 };

  const complianceRate = complianceStats.total > 0 
    ? Math.round((complianceStats.compliant / complianceStats.total) * 100)
    : 0;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Event Frequency Management
              </CardTitle>
              <CardDescription>Track visit compliance and log sales events</CardDescription>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{complianceRate}%</div>
              <p className="text-sm text-muted-foreground">Compliance Rate</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Compliance Summary */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-1" />
              <div className="text-2xl font-bold text-green-600">{complianceStats.compliant}</div>
              <p className="text-xs text-green-700">Compliant</p>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600 mx-auto mb-1" />
              <div className="text-2xl font-bold text-yellow-600">{complianceStats.due_soon}</div>
              <p className="text-xs text-yellow-700">Due Soon</p>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <AlertCircle className="h-6 w-6 text-red-600 mx-auto mb-1" />
              <div className="text-2xl font-bold text-red-600">{complianceStats.overdue}</div>
              <p className="text-xs text-red-700">Overdue</p>
            </div>
          </div>

          {/* Organization Visit Status */}
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading organizations...</p>
          ) : organizations && organizations.length > 0 ? (
            <div className="space-y-3">
              <h4 className="font-medium mb-2">Account Visit Status</h4>
              {organizations.map((org) => {
                const status = getVisitComplianceStatus(org);
                const daysSinceVisit = org.last_visit_date 
                  ? differenceInDays(new Date(), new Date(org.last_visit_date))
                  : null;

                return (
                  <div
                    key={org.id}
                    className={`p-3 border rounded-lg ${
                      status === 'overdue' ? 'border-red-200 bg-red-50' :
                      status === 'due_soon' ? 'border-yellow-200 bg-yellow-50' :
                      'border-gray-200'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{org.name}</span>
                          {getComplianceBadge(status)}
                        </div>
                        <div className="flex gap-4 text-sm text-muted-foreground">
                          <span>Frequency: {getFrequencyLabel(org.visit_frequency_requirement)}</span>
                          {org.last_visit_date ? (
                            <span>Last visit: {daysSinceVisit} days ago</span>
                          ) : (
                            <span className="text-red-600">Never visited</span>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedOrganization(org);
                          setShowLogEventDialog(true);
                        }}
                      >
                        Log Visit
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No organizations with visit frequency requirements
            </p>
          )}

          {/* Recent Events */}
          {recentEvents && recentEvents.length > 0 && (
            <div className="mt-6">
              <h4 className="font-medium mb-2">Recent Events</h4>
              <div className="space-y-2">
                {recentEvents.slice(0, 5).map((event) => (
                  <div key={event.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      {getEventTypeIcon(event.event_type)}
                      <span>{event.organizations?.name}</span>
                    </div>
                    <div className="flex items-center gap-3 text-muted-foreground">
                      {event.referrals_generated > 0 && (
                        <span className="text-green-600">+{event.referrals_generated} referrals</span>
                      )}
                      <span>{format(new Date(event.event_date), 'MMM d')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Log Event Dialog */}
      <Dialog open={showLogEventDialog} onOpenChange={setShowLogEventDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Log Sales Event</DialogTitle>
            <DialogDescription>
              Record your interaction with {selectedOrganization?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="event-type">Event Type</Label>
              <Select
                value={newEvent.event_type}
                onValueChange={(value) => setNewEvent({ ...newEvent, event_type: value })}
              >
                <SelectTrigger id="event-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in_person">In-Person Visit</SelectItem>
                  <SelectItem value="virtual">Virtual Meeting</SelectItem>
                  <SelectItem value="phone">Phone Call</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="event">Event/Training</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="5"
                  step="5"
                  value={newEvent.duration_minutes}
                  onChange={(e) => setNewEvent({ ...newEvent, duration_minutes: parseInt(e.target.value) || 30 })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contacts">Contacts Engaged</Label>
                <Input
                  id="contacts"
                  type="number"
                  min="1"
                  value={newEvent.contacts_engaged}
                  onChange={(e) => setNewEvent({ ...newEvent, contacts_engaged: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="referrals">Referrals Generated</Label>
              <Input
                id="referrals"
                type="number"
                min="0"
                value={newEvent.referrals_generated}
                onChange={(e) => setNewEvent({ ...newEvent, referrals_generated: parseInt(e.target.value) || 0 })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={newEvent.notes}
                onChange={(e) => setNewEvent({ ...newEvent, notes: e.target.value })}
                placeholder="Key discussion points, action items, etc."
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="follow-up"
                checked={newEvent.follow_up_required}
                onChange={(e) => setNewEvent({ ...newEvent, follow_up_required: e.target.checked })}
                className="rounded border-gray-300"
              />
              <Label htmlFor="follow-up" className="cursor-pointer">
                Follow-up required
              </Label>
            </div>

            {newEvent.follow_up_required && (
              <div className="space-y-2">
                <Label htmlFor="follow-up-date">Follow-up Date</Label>
                <Input
                  id="follow-up-date"
                  type="date"
                  value={newEvent.follow_up_date}
                  onChange={(e) => setNewEvent({ ...newEvent, follow_up_date: e.target.value })}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLogEventDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => logEventMutation.mutate(newEvent)}>
              Log Event
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EventFrequencyManager;