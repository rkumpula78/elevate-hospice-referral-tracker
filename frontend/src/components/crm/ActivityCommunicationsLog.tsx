
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Plus, Calendar, User, Phone, Mail, MessageSquare, Users, Video, BookOpen, Coffee, MapPin, Send } from 'lucide-react';
import { format } from 'date-fns';

interface ActivityCommunicationsLogProps {
  organizationId?: string;
  referralId?: string;
  contactId?: string;
  title?: string;
}

const ActivityCommunicationsLog = ({ organizationId, referralId, contactId, title = "Activity & Communications Log" }: ActivityCommunicationsLogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    activity_date: new Date().toISOString().slice(0, 16),
    completed_by: '',
    interaction_type: '',
    purpose: [] as string[],
    outcome_sentiment: 'neutral',
    discussion_points: '',
    materials_provided: [] as string[],
    next_step: '',
    follow_up_required: false,
    follow_up_date: '',
    cost_amount: '',
    duration_minutes: ''
  });

  const interactionTypes = [
    { value: 'in_person_visit', label: 'In-Person Visit', icon: User },
    { value: 'phone_call', label: 'Phone Call', icon: Phone },
    { value: 'email', label: 'Email', icon: Mail },
    { value: 'text_message', label: 'Text Message', icon: MessageSquare },
    { value: 'virtual_meeting', label: 'Virtual Meeting', icon: Video },
    { value: 'lunch_learn', label: 'Lunch-and-Learn', icon: Coffee },
    { value: 'inservice', label: 'Educational In-Service', icon: BookOpen },
    { value: 'community_event', label: 'Community Event', icon: Users },
    { value: 'mailer', label: 'Mailer', icon: Send }
  ];

  const purposeOptions = [
    'Introduction', 'Relationship Building', 'Case Collaboration', 
    'Patient Status Update', 'Problem Resolution', 'General Follow-up',
    'Education', 'Event Invitation', 'Marketing', 'Contract Discussion'
  ];

  const materialsOptions = [
    'General Brochures', 'GIP Unit Flyer', 'Cardiac Program Info',
    'Case Studies', 'Business Cards', 'Promotional Items',
    'Educational Materials', 'Contract/Agreement', 'Contact Information'
  ];

  // Fetch activities
  const { data: activities, isLoading } = useQuery({
    queryKey: ['activity-communications', organizationId, referralId],
    queryFn: async () => {
      let query = supabase
        .from('activity_communications')
        .select('*')
        .order('activity_date', { ascending: false });

      if (organizationId) {
        query = query.eq('organization_id', organizationId);
      }
      if (referralId) {
        query = query.eq('referral_id', referralId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  // Add activity mutation
  const addActivityMutation = useMutation({
    mutationFn: async (activityData: any) => {
      const { error } = await supabase
        .from('activity_communications')
        .insert([{
          ...activityData,
          organization_id: organizationId || null,
          referral_id: referralId || null,
          contact_id: contactId || null,
          cost_amount: activityData.cost_amount ? parseFloat(activityData.cost_amount) : null,
          duration_minutes: activityData.duration_minutes ? parseInt(activityData.duration_minutes) : null
        }]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity-communications'] });
      toast({ title: 'Activity logged successfully' });
      resetForm();
    },
    onError: (error) => {
      toast({ title: 'Error logging activity', description: error.message, variant: 'destructive' });
    }
  });

  const resetForm = () => {
    setFormData({
      activity_date: new Date().toISOString().slice(0, 16),
      completed_by: '',
      interaction_type: '',
      purpose: [],
      outcome_sentiment: 'neutral',
      discussion_points: '',
      materials_provided: [],
      next_step: '',
      follow_up_required: false,
      follow_up_date: '',
      cost_amount: '',
      duration_minutes: ''
    });
    setShowAddForm(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addActivityMutation.mutate(formData);
  };

  const handlePurposeChange = (purpose: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({ ...prev, purpose: [...prev.purpose, purpose] }));
    } else {
      setFormData(prev => ({ ...prev, purpose: prev.purpose.filter(p => p !== purpose) }));
    }
  };

  const handleMaterialsChange = (material: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({ ...prev, materials_provided: [...prev.materials_provided, material] }));
    } else {
      setFormData(prev => ({ ...prev, materials_provided: prev.materials_provided.filter(m => m !== material) }));
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'highly_positive': return 'bg-green-100 text-green-800';
      case 'positive': return 'bg-blue-100 text-blue-800';
      case 'neutral': return 'bg-gray-100 text-gray-800';
      case 'negative': return 'bg-orange-100 text-orange-800';
      case 'action_required': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getInteractionIcon = (type: string) => {
    const interaction = interactionTypes.find(i => i.value === type);
    return interaction?.icon || User;
  };

  if (isLoading) {
    return <div>Loading activities...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">{title}</h3>
        <Button onClick={() => setShowAddForm(true)} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Log Activity
        </Button>
      </div>

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Log New Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="activity_date">Date & Time *</Label>
                  <Input
                    id="activity_date"
                    type="datetime-local"
                    value={formData.activity_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, activity_date: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="completed_by">Completed By *</Label>
                  <Input
                    id="completed_by"
                    value={formData.completed_by}
                    onChange={(e) => setFormData(prev => ({ ...prev, completed_by: e.target.value }))}
                    placeholder="Your name"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="interaction_type">Interaction Type *</Label>
                  <Select value={formData.interaction_type} onValueChange={(value) => setFormData(prev => ({ ...prev, interaction_type: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select interaction type" />
                    </SelectTrigger>
                    <SelectContent>
                      {interactionTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <type.icon className="w-4 h-4" />
                            {type.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="outcome_sentiment">Outcome/Sentiment</Label>
                  <Select value={formData.outcome_sentiment} onValueChange={(value) => setFormData(prev => ({ ...prev, outcome_sentiment: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="highly_positive">Highly Positive</SelectItem>
                      <SelectItem value="positive">Positive</SelectItem>
                      <SelectItem value="neutral">Neutral</SelectItem>
                      <SelectItem value="negative">Negative</SelectItem>
                      <SelectItem value="action_required">Action Required</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Purpose (Select all that apply)</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {purposeOptions.map(purpose => (
                    <div key={purpose} className="flex items-center space-x-2">
                      <Checkbox
                        id={`purpose-${purpose}`}
                        checked={formData.purpose.includes(purpose)}
                        onCheckedChange={(checked) => handlePurposeChange(purpose, !!checked)}
                      />
                      <Label htmlFor={`purpose-${purpose}`} className="text-sm">{purpose}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="discussion_points">Key Discussion Points</Label>
                <Textarea
                  id="discussion_points"
                  value={formData.discussion_points}
                  onChange={(e) => setFormData(prev => ({ ...prev, discussion_points: e.target.value }))}
                  rows={3}
                />
              </div>

              <div>
                <Label>Materials Provided</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {materialsOptions.map(material => (
                    <div key={material} className="flex items-center space-x-2">
                      <Checkbox
                        id={`material-${material}`}
                        checked={formData.materials_provided.includes(material)}
                        onCheckedChange={(checked) => handleMaterialsChange(material, !!checked)}
                      />
                      <Label htmlFor={`material-${material}`} className="text-sm">{material}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="duration_minutes">Duration (minutes)</Label>
                  <Input
                    id="duration_minutes"
                    type="number"
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData(prev => ({ ...prev, duration_minutes: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="cost_amount">Cost ($)</Label>
                  <Input
                    id="cost_amount"
                    type="number"
                    step="0.01"
                    value={formData.cost_amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, cost_amount: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="next_step">Next Step / Action Item</Label>
                <Textarea
                  id="next_step"
                  value={formData.next_step}
                  onChange={(e) => setFormData(prev => ({ ...prev, next_step: e.target.value }))}
                  rows={2}
                />
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="follow_up_required"
                    checked={formData.follow_up_required}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, follow_up_required: !!checked }))}
                  />
                  <Label htmlFor="follow_up_required">Follow-up Required?</Label>
                </div>
                {formData.follow_up_required && (
                  <div>
                    <Label htmlFor="follow_up_date">Follow-up Date</Label>
                    <Input
                      id="follow_up_date"
                      type="date"
                      value={formData.follow_up_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, follow_up_date: e.target.value }))}
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit" disabled={addActivityMutation.isPending}>
                  Log Activity
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {activities?.map((activity) => {
          const InteractionIcon = getInteractionIcon(activity.interaction_type);
          return (
            <Card key={activity.id}>
              <CardContent className="pt-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <InteractionIcon className="w-5 h-5 text-blue-600" />
                    <div>
                      <h4 className="font-medium">
                        {interactionTypes.find(t => t.value === activity.interaction_type)?.label || activity.interaction_type}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {format(new Date(activity.activity_date), 'MMM dd, yyyy h:mm a')} • {activity.completed_by}
                      </p>
                    </div>
                  </div>
                  <Badge className={getSentimentColor(activity.outcome_sentiment)}>
                    {activity.outcome_sentiment.replace('_', ' ')}
                  </Badge>
                </div>

                {activity.purpose && activity.purpose.length > 0 && (
                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-700 mb-1">Purpose:</p>
                    <div className="flex flex-wrap gap-1">
                      {activity.purpose.map((p: string, index: number) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {p}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {activity.discussion_points && (
                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-700">Discussion Points:</p>
                    <p className="text-sm text-gray-600 mt-1">{activity.discussion_points}</p>
                  </div>
                )}

                {activity.materials_provided && activity.materials_provided.length > 0 && (
                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-700 mb-1">Materials Provided:</p>
                    <div className="flex flex-wrap gap-1">
                      {activity.materials_provided.map((material: string, index: number) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {material}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {activity.next_step && (
                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-700">Next Steps:</p>
                    <p className="text-sm text-gray-600 mt-1">{activity.next_step}</p>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex gap-4">
                    {activity.duration_minutes && (
                      <span>Duration: {activity.duration_minutes} min</span>
                    )}
                    {activity.cost_amount && (
                      <span>Cost: ${activity.cost_amount}</span>
                    )}
                  </div>
                  {activity.follow_up_required && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>Follow-up: {activity.follow_up_date ? format(new Date(activity.follow_up_date), 'MMM dd, yyyy') : 'TBD'}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {activities?.length === 0 && (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-gray-500">No activities logged yet</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ActivityCommunicationsLog;
