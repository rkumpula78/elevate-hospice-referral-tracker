import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertTriangle, Shield, Plus, User, Calendar, CheckCircle, X } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';

const MarketingBarriersManager: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedBarrier, setSelectedBarrier] = useState<any>(null);
  const [newBarrier, setNewBarrier] = useState({
    barrier_type: 'relationship',
    barrier_description: '',
    impact_level: 'medium',
    countermeasure: '',
    countermeasure_owner: '',
    countermeasure_due_date: '',
    estimated_referral_impact: 0
  });

  // Fetch all barriers
  const { data: barriers, isLoading } = useQuery({
    queryKey: ['marketing-barriers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketing_barriers')
        .select('*')
        .order('created_at', { ascending: false });
      
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

  // Create new barrier mutation
  const createBarrierMutation = useMutation({
    mutationFn: async (data: typeof newBarrier) => {
      const { error } = await supabase
        .from('marketing_barriers')
        .insert({
          ...data,
          created_by: 'Current User' // This would come from auth context
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Barrier identified and countermeasure assigned" });
      setShowAddDialog(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['marketing-barriers'] });
    },
    onError: () => {
      toast({ title: "Error creating barrier", variant: "destructive" });
    }
  });

  // Update barrier status mutation
  const updateBarrierMutation = useMutation({
    mutationFn: async ({ id, status, resolution_notes }: { id: string; status: string; resolution_notes?: string }) => {
      const updateData: any = { 
        status,
        updated_at: new Date().toISOString()
      };
      
      if (status === 'resolved') {
        updateData.resolution_date = new Date().toISOString();
        if (resolution_notes) {
          updateData.resolution_notes = resolution_notes;
        }
      }
      
      const { error } = await supabase
        .from('marketing_barriers')
        .update(updateData)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Barrier status updated" });
      queryClient.invalidateQueries({ queryKey: ['marketing-barriers'] });
    },
    onError: () => {
      toast({ title: "Error updating barrier", variant: "destructive" });
    }
  });

  const resetForm = () => {
    setNewBarrier({
      barrier_type: 'relationship',
      barrier_description: '',
      impact_level: 'medium',
      countermeasure: '',
      countermeasure_owner: '',
      countermeasure_due_date: '',
      estimated_referral_impact: 0
    });
  };

  const handleSubmit = () => {
    if (!newBarrier.barrier_description || !newBarrier.countermeasure || !newBarrier.countermeasure_owner) {
      toast({ 
        title: "Missing required fields", 
        description: "Please fill in barrier description, countermeasure, and owner",
        variant: "destructive" 
      });
      return;
    }
    createBarrierMutation.mutate(newBarrier);
  };

  const getImpactBadge = (level: string) => {
    switch (level) {
      case 'critical':
        return <Badge className="bg-red-100 text-red-800">Critical</Badge>;
      case 'high':
        return <Badge className="bg-orange-100 text-orange-800">High</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>;
      case 'low':
        return <Badge className="bg-green-100 text-green-800">Low</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'resolved':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Resolved</Badge>;
      case 'addressing':
        return <Badge className="bg-blue-100 text-blue-800"><Shield className="h-3 w-3 mr-1" />Addressing</Badge>;
      case 'escalated':
        return <Badge className="bg-purple-100 text-purple-800"><AlertTriangle className="h-3 w-3 mr-1" />Escalated</Badge>;
      default:
        return <Badge variant="outline"><AlertTriangle className="h-3 w-3 mr-1" />Identified</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'relationship':
        return '🤝';
      case 'competition':
        return '⚔️';
      case 'process':
        return '⚙️';
      case 'clinical':
        return '🏥';
      case 'operational':
        return '📊';
      case 'communication':
        return '💬';
      default:
        return '🚧';
    }
  };

  const activeBarriers = barriers?.filter(b => b.status !== 'resolved') || [];
  const resolvedBarriers = barriers?.filter(b => b.status === 'resolved') || [];

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Marketing Barriers & Countermeasures
              </CardTitle>
              <CardDescription>Identify and overcome obstacles to referral growth</CardDescription>
            </div>
            <Button onClick={() => setShowAddDialog(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Identify Barrier
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading barriers...</p>
          ) : (
            <div className="space-y-6">
              {/* Active Barriers */}
              {activeBarriers.length > 0 && (
                <div>
                  <h3 className="font-medium mb-3">Active Barriers</h3>
                  <div className="space-y-3">
                    {activeBarriers.map((barrier) => (
                      <div
                        key={barrier.id}
                        className="p-4 border rounded-lg space-y-2 bg-yellow-50 border-yellow-200"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{getTypeIcon(barrier.barrier_type)}</span>
                              <span className="font-medium">{barrier.barrier_description}</span>
                            </div>
                            <div className="flex gap-2 mt-1">
                              {getImpactBadge(barrier.impact_level)}
                              {getStatusBadge(barrier.status)}
                              {barrier.estimated_referral_impact > 0 && (
                                <Badge variant="outline">
                                  -{barrier.estimated_referral_impact} referrals/month
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {barrier.countermeasure && (
                          <div className="mt-3 p-3 bg-white rounded border">
                            <p className="text-sm font-medium text-blue-700 mb-1">Countermeasure:</p>
                            <p className="text-sm">{barrier.countermeasure}</p>
                            <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {barrier.countermeasure_owner}
                              </div>
                              {barrier.countermeasure_due_date && (
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  Due: {format(new Date(barrier.countermeasure_due_date), 'MMM d')}
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="flex gap-2 pt-2">
                          {barrier.status === 'identified' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateBarrierMutation.mutate({ 
                                id: barrier.id, 
                                status: 'addressing' 
                              })}
                            >
                              Start Addressing
                            </Button>
                          )}
                          {barrier.status === 'addressing' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateBarrierMutation.mutate({ 
                                id: barrier.id, 
                                status: 'resolved',
                                resolution_notes: 'Successfully addressed'
                              })}
                            >
                              Mark Resolved
                            </Button>
                          )}
                          {barrier.status !== 'escalated' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-orange-600"
                              onClick={() => updateBarrierMutation.mutate({ 
                                id: barrier.id, 
                                status: 'escalated' 
                              })}
                            >
                              Escalate
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Resolved Barriers */}
              {resolvedBarriers.length > 0 && (
                <div>
                  <h3 className="font-medium mb-3 text-muted-foreground">Resolved Barriers</h3>
                  <div className="space-y-2">
                    {resolvedBarriers.slice(0, 3).map((barrier) => (
                      <div key={barrier.id} className="p-3 border rounded-lg bg-gray-50">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span>{getTypeIcon(barrier.barrier_type)}</span>
                            <span className="text-sm line-through text-muted-foreground">
                              {barrier.barrier_description}
                            </span>
                          </div>
                          {barrier.resolution_date && (
                            <span className="text-xs text-muted-foreground">
                              Resolved {format(new Date(barrier.resolution_date), 'MMM d')}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!barriers || barriers.length === 0 && (
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground mb-4">No barriers identified yet</p>
                  <Button onClick={() => setShowAddDialog(true)} variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Identify First Barrier
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Identify Marketing Barrier</DialogTitle>
            <DialogDescription>
              Document obstacles preventing referral growth and assign countermeasures
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="barrier-type">Barrier Type</Label>
              <Select
                value={newBarrier.barrier_type}
                onValueChange={(value) => setNewBarrier({ ...newBarrier, barrier_type: value })}
              >
                <SelectTrigger id="barrier-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relationship">Relationship</SelectItem>
                  <SelectItem value="competition">Competition</SelectItem>
                  <SelectItem value="process">Process</SelectItem>
                  <SelectItem value="clinical">Clinical</SelectItem>
                  <SelectItem value="operational">Operational</SelectItem>
                  <SelectItem value="communication">Communication</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="barrier-description">Barrier Description *</Label>
              <textarea
                id="barrier-description"
                className="w-full min-h-[80px] px-3 py-2 border rounded-md"
                value={newBarrier.barrier_description}
                onChange={(e) => setNewBarrier({ ...newBarrier, barrier_description: e.target.value })}
                placeholder="e.g., Low engagement from Dr. Smith's practice due to existing hospice relationship"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="impact-level">Impact Level</Label>
                <Select
                  value={newBarrier.impact_level}
                  onValueChange={(value) => setNewBarrier({ ...newBarrier, impact_level: value })}
                >
                  <SelectTrigger id="impact-level">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="referral-impact">Est. Monthly Impact</Label>
                <Input
                  id="referral-impact"
                  type="number"
                  min="0"
                  value={newBarrier.estimated_referral_impact}
                  onChange={(e) => setNewBarrier({ ...newBarrier, estimated_referral_impact: parseInt(e.target.value) || 0 })}
                  placeholder="Referrals lost"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="countermeasure">Countermeasure *</Label>
              <textarea
                id="countermeasure"
                className="w-full min-h-[60px] px-3 py-2 border rounded-md"
                value={newBarrier.countermeasure}
                onChange={(e) => setNewBarrier({ ...newBarrier, countermeasure: e.target.value })}
                placeholder="e.g., Schedule meeting with Dr. Smith to share patient outcomes data"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="owner">Owner *</Label>
                <Select
                  value={newBarrier.countermeasure_owner}
                  onValueChange={(value) => setNewBarrier({ ...newBarrier, countermeasure_owner: value })}
                >
                  <SelectTrigger id="owner">
                    <SelectValue placeholder="Select owner" />
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
                <Label htmlFor="due-date">Due Date</Label>
                <Input
                  id="due-date"
                  type="date"
                  value={newBarrier.countermeasure_due_date}
                  onChange={(e) => setNewBarrier({ ...newBarrier, countermeasure_due_date: e.target.value })}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={createBarrierMutation.isPending}>
              Create Barrier & Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MarketingBarriersManager;