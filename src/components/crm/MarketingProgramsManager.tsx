import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Lightbulb, Target, Plus, Calendar, User, DollarSign, TrendingUp } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';

const MarketingProgramsManager: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newProgram, setNewProgram] = useState({
    program_name: '',
    program_type: 'training',
    description: '',
    target_segment: [],
    success_metric: '',
    target_value: 0,
    start_date: '',
    end_date: '',
    owner: '',
    budget: 0
  });

  // Fetch marketing programs
  const { data: programs, isLoading } = useQuery({
    queryKey: ['marketing-programs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketing_programs')
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

  // Create new program mutation
  const createProgramMutation = useMutation({
    mutationFn: async (data: typeof newProgram) => {
      const { error } = await supabase
        .from('marketing_programs')
        .insert(data);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Marketing program created successfully" });
      setShowAddDialog(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['marketing-programs'] });
    },
    onError: () => {
      toast({ title: "Error creating program", variant: "destructive" });
    }
  });

  // Update program mutation
  const updateProgramMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const { error } = await supabase
        .from('marketing_programs')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Program updated successfully" });
      queryClient.invalidateQueries({ queryKey: ['marketing-programs'] });
    },
    onError: () => {
      toast({ title: "Error updating program", variant: "destructive" });
    }
  });

  const resetForm = () => {
    setNewProgram({
      program_name: '',
      program_type: 'training',
      description: '',
      target_segment: [],
      success_metric: '',
      target_value: 0,
      start_date: '',
      end_date: '',
      owner: '',
      budget: 0
    });
  };

  const handleSubmit = () => {
    if (!newProgram.program_name || !newProgram.owner) {
      toast({ 
        title: "Missing required fields", 
        description: "Please fill in program name and owner",
        variant: "destructive" 
      });
      return;
    }
    createProgramMutation.mutate(newProgram);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-800">Completed</Badge>;
      case 'paused':
        return <Badge className="bg-yellow-100 text-yellow-800">Paused</Badge>;
      default:
        return <Badge variant="outline">Planning</Badge>;
    }
  };

  const getProgramTypeIcon = (type: string) => {
    switch (type) {
      case 'training':
        return '📚';
      case 'event':
        return '🎉';
      case 'service_enhancement':
        return '⭐';
      case 'community_outreach':
        return '🤝';
      case 'clinical_program':
        return '🏥';
      default:
        return '💡';
    }
  };

  const calculateProgress = (program: any) => {
    if (!program.target_value) return 0;
    return Math.min(Math.round((program.actual_value / program.target_value) * 100), 100);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const activePrograms = programs?.filter(p => p.status === 'active') || [];
  const completedPrograms = programs?.filter(p => p.status === 'completed') || [];
  const planningPrograms = programs?.filter(p => p.status === 'planning') || [];

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Marketing Programs
              </CardTitle>
              <CardDescription>Differentiation initiatives and strategic programs</CardDescription>
            </div>
            <Button onClick={() => setShowAddDialog(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Create Program
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading programs...</p>
          ) : (
            <div className="space-y-6">
              {/* Active Programs */}
              {activePrograms.length > 0 && (
                <div>
                  <h3 className="font-medium mb-3">Active Programs</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activePrograms.map((program) => (
                      <div key={program.id} className="border rounded-lg p-4 bg-green-50 border-green-200">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{getProgramTypeIcon(program.program_type)}</span>
                            <h4 className="font-medium">{program.program_name}</h4>
                          </div>
                          {getStatusBadge(program.status)}
                        </div>
                        
                        {program.description && (
                          <p className="text-sm text-muted-foreground mb-3">{program.description}</p>
                        )}

                        {/* Progress Tracking */}
                        {program.success_metric && program.target_value > 0 && (
                          <div className="mb-3">
                            <div className="flex justify-between text-sm mb-1">
                              <span>{program.success_metric}</span>
                              <span>{program.actual_value || 0} / {program.target_value}</span>
                            </div>
                            <Progress value={calculateProgress(program)} className="h-2" />
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span>{program.owner}</span>
                          </div>
                          {program.budget && (
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              <span>{formatCurrency(program.budget)}</span>
                            </div>
                          )}
                          {program.end_date && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>Ends {format(new Date(program.end_date), 'MMM d')}</span>
                            </div>
                          )}
                          {program.target_segment && program.target_segment.length > 0 && (
                            <div className="flex items-center gap-1">
                              <Target className="h-3 w-3" />
                              <span>{program.target_segment.join(', ')}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2 mt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateProgramMutation.mutate({ 
                              id: program.id, 
                              updates: { status: 'completed' }
                            })}
                          >
                            Mark Complete
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateProgramMutation.mutate({ 
                              id: program.id, 
                              updates: { status: 'paused' }
                            })}
                          >
                            Pause
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Planning Programs */}
              {planningPrograms.length > 0 && (
                <div>
                  <h3 className="font-medium mb-3">In Planning</h3>
                  <div className="space-y-2">
                    {planningPrograms.map((program) => (
                      <div key={program.id} className="border rounded-lg p-3 bg-blue-50 border-blue-200">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span>{getProgramTypeIcon(program.program_type)}</span>
                            <span className="font-medium">{program.program_name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(program.status)}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateProgramMutation.mutate({ 
                                id: program.id, 
                                updates: { status: 'active' }
                              })}
                            >
                              Launch
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Completed Programs */}
              {completedPrograms.length > 0 && (
                <div>
                  <h3 className="font-medium mb-3 text-muted-foreground">Recent Completions</h3>
                  <div className="space-y-2">
                    {completedPrograms.slice(0, 3).map((program) => (
                      <div key={program.id} className="border rounded-lg p-3 bg-gray-50">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span>{getProgramTypeIcon(program.program_type)}</span>
                            <span className="font-medium text-muted-foreground">{program.program_name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {program.actual_value > 0 && (
                              <span className="text-sm text-green-600 flex items-center gap-1">
                                <TrendingUp className="h-3 w-3" />
                                {program.actual_value} {program.success_metric}
                              </span>
                            )}
                            {getStatusBadge(program.status)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!programs || programs.length === 0 && (
                <div className="text-center py-8">
                  <Lightbulb className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground mb-4">No marketing programs yet</p>
                  <Button onClick={() => setShowAddDialog(true)} variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Program
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
            <DialogTitle>Create Marketing Program</DialogTitle>
            <DialogDescription>
              Launch a new differentiation initiative or strategic program
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="program-name">Program Name *</Label>
              <Input
                id="program-name"
                value={newProgram.program_name}
                onChange={(e) => setNewProgram({ ...newProgram, program_name: e.target.value })}
                placeholder="e.g., Dementia Care Advantage"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="program-type">Program Type</Label>
              <Select
                value={newProgram.program_type}
                onValueChange={(value) => setNewProgram({ ...newProgram, program_type: value })}
              >
                <SelectTrigger id="program-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="training">Training Program</SelectItem>
                  <SelectItem value="event">Event/Workshop</SelectItem>
                  <SelectItem value="service_enhancement">Service Enhancement</SelectItem>
                  <SelectItem value="community_outreach">Community Outreach</SelectItem>
                  <SelectItem value="clinical_program">Clinical Program</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                className="w-full min-h-[60px] px-3 py-2 border rounded-md"
                value={newProgram.description}
                onChange={(e) => setNewProgram({ ...newProgram, description: e.target.value })}
                placeholder="Brief description of the program..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="success-metric">Success Metric</Label>
                <Input
                  id="success-metric"
                  value={newProgram.success_metric}
                  onChange={(e) => setNewProgram({ ...newProgram, success_metric: e.target.value })}
                  placeholder="e.g., New referrals"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="target-value">Target Value</Label>
                <Input
                  id="target-value"
                  type="number"
                  min="0"
                  value={newProgram.target_value}
                  onChange={(e) => setNewProgram({ ...newProgram, target_value: parseInt(e.target.value) || 0 })}
                  placeholder="Goal number"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="owner">Program Owner *</Label>
              <Select
                value={newProgram.owner}
                onValueChange={(value) => setNewProgram({ ...newProgram, owner: value })}
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-date">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={newProgram.start_date}
                  onChange={(e) => setNewProgram({ ...newProgram, start_date: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end-date">End Date</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={newProgram.end_date}
                  onChange={(e) => setNewProgram({ ...newProgram, end_date: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="budget">Budget (Optional)</Label>
              <Input
                id="budget"
                type="number"
                min="0"
                step="100"
                value={newProgram.budget}
                onChange={(e) => setNewProgram({ ...newProgram, budget: parseFloat(e.target.value) || 0 })}
                placeholder="Program budget in USD"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={createProgramMutation.isPending}>
              Create Program
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MarketingProgramsManager;