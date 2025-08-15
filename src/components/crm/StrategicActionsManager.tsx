import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Calendar, User, Target, CheckCircle, Clock, AlertCircle, X } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';

interface StrategicActionsManagerProps {
  organizationId: string;
  organizationName: string;
}

const StrategicActionsManager: React.FC<StrategicActionsManagerProps> = ({ 
  organizationId, 
  organizationName 
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newAction, setNewAction] = useState({
    action_title: '',
    action_description: '',
    action_type: 'follow_up',
    assigned_to: '',
    due_date: '',
    expected_outcome: ''
  });

  // Fetch strategic actions for this organization
  const { data: actions, isLoading } = useQuery({
    queryKey: ['strategic-actions', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('strategic_actions')
        .select('*')
        .eq('organization_id', organizationId)
        .order('due_date', { ascending: true });
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch marketers list
  const { data: marketers } = useQuery({
    queryKey: ['marketers-local'],
    queryFn: () => {
      const stored = localStorage.getItem('hospice-marketers');
      if (stored) {
        return JSON.parse(stored);
      }
      return ['John Smith', 'Sarah Johnson', 'Mike Davis', 'Lisa Wilson', 'David Brown'];
    }
  });

  // Create new action mutation
  const createActionMutation = useMutation({
    mutationFn: async (data: typeof newAction) => {
      const { error } = await supabase
        .from('strategic_actions')
        .insert({
          organization_id: organizationId,
          ...data,
          created_by: 'Current User' // This would come from auth context
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Strategic action created successfully" });
      setShowAddDialog(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['strategic-actions', organizationId] });
    },
    onError: () => {
      toast({ title: "Error creating action", variant: "destructive" });
    }
  });

  // Update action status mutation
  const updateActionMutation = useMutation({
    mutationFn: async ({ id, status, result_notes }: { id: string; status: string; result_notes?: string }) => {
      const updateData: any = { 
        status,
        updated_at: new Date().toISOString()
      };
      
      if (status === 'completed') {
        updateData.completion_date = new Date().toISOString();
      }
      
      if (result_notes) {
        updateData.result_notes = result_notes;
      }
      
      const { error } = await supabase
        .from('strategic_actions')
        .update(updateData)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Action updated successfully" });
      queryClient.invalidateQueries({ queryKey: ['strategic-actions', organizationId] });
    },
    onError: () => {
      toast({ title: "Error updating action", variant: "destructive" });
    }
  });

  const resetForm = () => {
    setNewAction({
      action_title: '',
      action_description: '',
      action_type: 'follow_up',
      assigned_to: '',
      due_date: '',
      expected_outcome: ''
    });
  };

  const handleSubmit = () => {
    if (!newAction.action_title || !newAction.assigned_to || !newAction.due_date) {
      toast({ 
        title: "Missing required fields", 
        description: "Please fill in title, assignee, and due date",
        variant: "destructive" 
      });
      return;
    }
    createActionMutation.mutate(newAction);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-800"><Clock className="h-3 w-3 mr-1" />In Progress</Badge>;
      case 'cancelled':
        return <Badge variant="secondary"><X className="h-3 w-3 mr-1" />Cancelled</Badge>;
      default:
        return <Badge variant="outline"><AlertCircle className="h-3 w-3 mr-1" />Pending</Badge>;
    }
  };

  const getActionTypeIcon = (type: string) => {
    switch (type) {
      case 'lunch_learn':
        return '🍽️';
      case 'training':
        return '📚';
      case 'meeting':
        return '🤝';
      case 'event':
        return '🎉';
      case 'follow_up':
        return '📞';
      case 'relationship_building':
        return '💫';
      default:
        return '📋';
    }
  };

  const isPastDue = (dueDate: string) => {
    return new Date(dueDate) < new Date() && actions?.find(a => a.due_date === dueDate)?.status !== 'completed';
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Strategic Actions
              </CardTitle>
              <CardDescription>Account-specific growth initiatives and follow-ups</CardDescription>
            </div>
            <Button onClick={() => setShowAddDialog(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Action
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading actions...</p>
          ) : actions && actions.length > 0 ? (
            <div className="space-y-3">
              {actions.map((action) => (
                <div
                  key={action.id}
                  className={`p-4 border rounded-lg space-y-2 ${
                    isPastDue(action.due_date) ? 'border-red-200 bg-red-50' : ''
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getActionTypeIcon(action.action_type)}</span>
                        <h4 className="font-medium">{action.action_title}</h4>
                        {getStatusBadge(action.status)}
                      </div>
                      {action.action_description && (
                        <p className="text-sm text-muted-foreground mt-1">{action.action_description}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3 text-muted-foreground" />
                      <span>{action.assigned_to}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <span className={isPastDue(action.due_date) ? 'text-red-600 font-medium' : ''}>
                        {format(new Date(action.due_date), 'MMM d, yyyy')}
                      </span>
                    </div>
                    {action.expected_outcome && (
                      <div className="flex items-center gap-1">
                        <Target className="h-3 w-3 text-muted-foreground" />
                        <span>{action.expected_outcome}</span>
                      </div>
                    )}
                  </div>

                  {action.status !== 'completed' && action.status !== 'cancelled' && (
                    <div className="flex gap-2 pt-2">
                      {action.status === 'pending' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateActionMutation.mutate({ 
                            id: action.id, 
                            status: 'in_progress' 
                          })}
                        >
                          Start
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateActionMutation.mutate({ 
                          id: action.id, 
                          status: 'completed' 
                        })}
                      >
                        Complete
                      </Button>
                    </div>
                  )}

                  {action.completion_date && (
                    <p className="text-xs text-muted-foreground">
                      Completed on {format(new Date(action.completion_date), 'MMM d, yyyy')}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground mb-4">No strategic actions yet</p>
              <Button onClick={() => setShowAddDialog(true)} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add First Action
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Strategic Action</DialogTitle>
            <DialogDescription>
              Create a new action item for {organizationName}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="action-title">Action Title *</Label>
              <Input
                id="action-title"
                value={newAction.action_title}
                onChange={(e) => setNewAction({ ...newAction, action_title: e.target.value })}
                placeholder="e.g., Host Dementia Care Lunch & Learn"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="action-type">Action Type</Label>
              <Select
                value={newAction.action_type}
                onValueChange={(value) => setNewAction({ ...newAction, action_type: value })}
              >
                <SelectTrigger id="action-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lunch_learn">Lunch & Learn</SelectItem>
                  <SelectItem value="training">Training</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="event">Event</SelectItem>
                  <SelectItem value="follow_up">Follow Up</SelectItem>
                  <SelectItem value="relationship_building">Relationship Building</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="assigned-to">Assigned To *</Label>
              <Select
                value={newAction.assigned_to}
                onValueChange={(value) => setNewAction({ ...newAction, assigned_to: value })}
              >
                <SelectTrigger id="assigned-to">
                  <SelectValue placeholder="Select marketer" />
                </SelectTrigger>
                <SelectContent>
                  {marketers?.map((marketer: string) => (
                    <SelectItem key={marketer} value={marketer}>
                      {marketer}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="due-date">Due Date *</Label>
              <Input
                id="due-date"
                type="date"
                value={newAction.due_date}
                onChange={(e) => setNewAction({ ...newAction, due_date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expected-outcome">Expected Outcome</Label>
              <Input
                id="expected-outcome"
                value={newAction.expected_outcome}
                onChange={(e) => setNewAction({ ...newAction, expected_outcome: e.target.value })}
                placeholder="e.g., Increase referrals from 3 to 5/month"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                className="w-full min-h-[80px] px-3 py-2 border rounded-md"
                value={newAction.action_description}
                onChange={(e) => setNewAction({ ...newAction, action_description: e.target.value })}
                placeholder="Additional details about this action..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={createActionMutation.isPending}>
              Create Action
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default StrategicActionsManager;