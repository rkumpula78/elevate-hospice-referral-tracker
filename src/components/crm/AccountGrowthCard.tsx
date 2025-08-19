import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Target, TrendingUp, TrendingDown, AlertCircle, Edit2, Save, X } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AccountGrowthCardProps {
  organization: any;
  onUpdate?: () => void;
}

const AccountGrowthCard: React.FC<AccountGrowthCardProps> = ({ organization, onUpdate }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [goals, setGoals] = useState({
    monthly_referral_goal: organization.monthly_referral_goal || 0,
    quarterly_referral_goal: organization.quarterly_referral_goal || 0,
    growth_notes: organization.growth_notes || ''
  });

  const updateGoalsMutation = useMutation({
    mutationFn: async (data: typeof goals) => {
      const { error } = await supabase
        .from('organizations')
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('id', organization.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Growth goals updated successfully" });
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      onUpdate?.();
    },
    onError: () => {
      toast({ title: "Error updating goals", variant: "destructive" });
    }
  });

  const handleSave = () => {
    updateGoalsMutation.mutate(goals);
  };

  const handleCancel = () => {
    setGoals({
      monthly_referral_goal: organization.monthly_referral_goal || 0,
      quarterly_referral_goal: organization.quarterly_referral_goal || 0,
      growth_notes: organization.growth_notes || ''
    });
    setIsEditing(false);
  };

  // Calculate progress percentages
  const monthlyProgress = organization.monthly_referral_goal > 0
    ? Math.round((organization.current_month_referrals / organization.monthly_referral_goal) * 100)
    : 0;
  
  const quarterlyProgress = organization.quarterly_referral_goal > 0
    ? Math.round((organization.current_quarter_referrals / organization.quarterly_referral_goal) * 100)
    : 0;

  // Determine status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'exceeding':
        return <Badge className="bg-green-100 text-green-800">Exceeding</Badge>;
      case 'on_track':
        return <Badge className="bg-blue-100 text-blue-800">On Track</Badge>;
      case 'at_risk':
        return <Badge className="bg-yellow-100 text-yellow-800">At Risk</Badge>;
      case 'behind':
        return <Badge className="bg-red-100 text-red-800">Behind</Badge>;
      default:
        return <Badge variant="outline">Not Set</Badge>;
    }
  };

  const getProgressIcon = (progress: number) => {
    if (progress >= 100) return <TrendingUp className="h-5 w-5 text-green-600" />;
    if (progress >= 70) return <Target className="h-5 w-5 text-blue-600" />;
    if (progress >= 50) return <AlertCircle className="h-5 w-5 text-yellow-600" />;
    return <TrendingDown className="h-5 w-5 text-red-600" />;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Growth Targets
            </CardTitle>
            <CardDescription>Referral goals and performance tracking</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {organization.growth_status && getStatusBadge(organization.growth_status)}
            {!isEditing ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            ) : (
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSave}
                  disabled={updateGoalsMutation.isPending}
                >
                  <Save className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancel}
                  disabled={updateGoalsMutation.isPending}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isEditing ? (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="monthly-goal">Monthly Goal</Label>
                <Input
                  id="monthly-goal"
                  type="number"
                  min="0"
                  value={goals.monthly_referral_goal}
                  onChange={(e) => setGoals({ ...goals, monthly_referral_goal: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quarterly-goal">Quarterly Goal</Label>
                <Input
                  id="quarterly-goal"
                  type="number"
                  min="0"
                  value={goals.quarterly_referral_goal}
                  onChange={(e) => setGoals({ ...goals, quarterly_referral_goal: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="growth-notes">Growth Notes</Label>
              <textarea
                id="growth-notes"
                className="w-full min-h-[80px] px-3 py-2 border rounded-md"
                value={goals.growth_notes}
                onChange={(e) => setGoals({ ...goals, growth_notes: e.target.value })}
                placeholder="Strategic notes for achieving growth targets..."
              />
            </div>
          </>
        ) : (
          <>
            {/* Monthly Progress */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Monthly Progress</span>
                <div className="flex items-center gap-2">
                  {getProgressIcon(monthlyProgress)}
                  <span className="text-sm">
                    {organization.current_month_referrals || 0} / {organization.monthly_referral_goal || 0}
                  </span>
                </div>
              </div>
              <Progress value={monthlyProgress} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {monthlyProgress}% of monthly goal achieved
              </p>
            </div>

            {/* Quarterly Progress */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Quarterly Progress</span>
                <div className="flex items-center gap-2">
                  {getProgressIcon(quarterlyProgress)}
                  <span className="text-sm">
                    {organization.current_quarter_referrals || 0} / {organization.quarterly_referral_goal || 0}
                  </span>
                </div>
              </div>
              <Progress value={quarterlyProgress} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {quarterlyProgress}% of quarterly goal achieved
              </p>
            </div>

            {/* YTD Performance */}
            <div className="pt-2 border-t">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">YTD Referrals</span>
                <span className="text-sm font-medium">{organization.ytd_referrals || 0}</span>
              </div>
            {organization.last_training_review && (
              <p className="text-xs text-muted-foreground mt-1">
                Last reviewed: {new Date(organization.last_training_review).toLocaleDateString()}
              </p>
            )}
            </div>

            {/* Growth Notes */}
            {organization.growth_notes && (
              <div className="pt-2 border-t">
                <p className="text-sm text-muted-foreground">Notes:</p>
                <p className="text-sm mt-1">{organization.growth_notes}</p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default AccountGrowthCard;