import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { TrendingUp, TrendingDown, Minus, Plus, Target, Calendar } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, startOfMonth, endOfMonth } from 'date-fns';

interface OrganizationKPIsProps {
  organizationId: string;
  organizationType: string;
}

const KPI_TYPES = {
  referral_volume: { name: 'Referral Volume', unit: 'referrals' },
  conversion_rate: { name: 'Conversion Rate', unit: '%' },
  avg_los: { name: 'Average Length of Stay', unit: 'days' },
  satisfaction_score: { name: 'Satisfaction Score', unit: '%' },
  response_time: { name: 'Response Time', unit: 'hours' },
  readmission_rate: { name: 'Readmission Rate', unit: '%' }
};

const OrganizationKPIs: React.FC<OrganizationKPIsProps> = ({ organizationId, organizationType }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedKpiType, setSelectedKpiType] = useState('referral_volume');
  const [targetValue, setTargetValue] = useState('');
  const [actualValue, setActualValue] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));

  // Fetch KPIs for this organization
  const { data: kpis } = useQuery({
    queryKey: ['organization-kpis', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organization_kpis')
        .select('*')
        .eq('organization_id', organizationId)
        .order('period_start', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch recommended KPIs from training modules
  const { data: recommendedKpis } = useQuery({
    queryKey: ['recommended-kpis', organizationType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organization_training_modules')
        .select('content')
        .eq('organization_type', organizationType)
        .eq('module_category', 'kpi')
        .single();
      
      if (error) throw error;
      
      // Type guard to safely access metrics property
      if (data?.content && typeof data.content === 'object' && !Array.isArray(data.content)) {
        const content = data.content as { [key: string]: any };
        return Array.isArray(content.metrics) ? content.metrics : [];
      }
      
      return [];
    }
  });

  // Add KPI mutation
  const addKpiMutation = useMutation({
    mutationFn: async () => {
      const date = new Date(selectedMonth);
      const { error } = await supabase
        .from('organization_kpis')
        .insert({
          organization_id: organizationId,
          kpi_type: selectedKpiType,
          period_start: startOfMonth(date).toISOString(),
          period_end: endOfMonth(date).toISOString(),
          target_value: parseFloat(targetValue),
          actual_value: parseFloat(actualValue),
          notes
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-kpis', organizationId] });
      toast({
        title: "KPI added",
        description: "The KPI has been recorded successfully."
      });
      setShowAddDialog(false);
      resetForm();
    }
  });

  const resetForm = () => {
    setTargetValue('');
    setActualValue('');
    setNotes('');
  };

  // Prepare data for charts
  const getChartData = (kpiType: string) => {
    return kpis
      ?.filter(k => k.kpi_type === kpiType)
      .map(k => ({
        month: format(new Date(k.period_start), 'MMM yyyy'),
        target: k.target_value,
        actual: k.actual_value
      }))
      .reverse() || [];
  };

  const calculateTrend = (kpiType: string) => {
    const kpiData = kpis?.filter(k => k.kpi_type === kpiType) || [];
    if (kpiData.length < 2) return { trend: 'neutral', percentage: 0 };
    
    const latest = kpiData[0]?.actual_value || 0;
    const previous = kpiData[1]?.actual_value || 0;
    const percentage = previous > 0 ? ((latest - previous) / previous) * 100 : 0;
    
    return {
      trend: percentage > 0 ? 'up' : percentage < 0 ? 'down' : 'neutral',
      percentage: Math.abs(percentage)
    };
  };

  const renderKpiCard = (kpiType: string, kpiInfo: any) => {
    const latestKpi = kpis?.find(k => k.kpi_type === kpiType);
    const chartData = getChartData(kpiType);
    const { trend, percentage } = calculateTrend(kpiType);
    
    return (
      <Card key={kpiType}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{kpiInfo.name}</CardTitle>
            {trend === 'up' && <TrendingUp className="w-5 h-5 text-green-500" />}
            {trend === 'down' && <TrendingDown className="w-5 h-5 text-red-500" />}
            {trend === 'neutral' && <Minus className="w-5 h-5 text-gray-500" />}
          </div>
          <CardDescription>
            {latestKpi ? (
              <>
                {latestKpi.actual_value} / {latestKpi.target_value} {kpiInfo.unit}
                {percentage > 0 && (
                  <span className={`ml-2 text-sm font-medium ${
                    trend === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {trend === 'up' ? '+' : '-'}{percentage.toFixed(1)}%
                  </span>
                )}
              </>
            ) : (
              'No data yet'
            )}
          </CardDescription>
        </CardHeader>
        {chartData.length > 0 && (
          <CardContent>
            <ResponsiveContainer width="100%" height={150}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="target" 
                  stroke="#94a3b8" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Target"
                />
                <Line 
                  type="monotone" 
                  dataKey="actual" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  name="Actual"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        )}
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Key Performance Indicators</h3>
          <p className="text-sm text-muted-foreground">Track and measure partnership success</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add KPI Data
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add KPI Data</DialogTitle>
              <DialogDescription>
                Record actual performance against targets
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>KPI Type</Label>
                <Select value={selectedKpiType} onValueChange={setSelectedKpiType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(KPI_TYPES).map(([key, value]) => (
                      <SelectItem key={key} value={key}>
                        {value.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Month</Label>
                <Input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Target Value</Label>
                  <Input
                    type="number"
                    value={targetValue}
                    onChange={(e) => setTargetValue(e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label>Actual Value</Label>
                  <Input
                    type="number"
                    value={actualValue}
                    onChange={(e) => setActualValue(e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>
              
              <div>
                <Label>Notes (optional)</Label>
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any relevant notes..."
                />
              </div>
              
              <Button 
                onClick={() => addKpiMutation.mutate()}
                disabled={!targetValue || !actualValue}
                className="w-full"
              >
                Save KPI Data
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Recommended KPIs from training */}
      {recommendedKpis && recommendedKpis.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center">
              <Target className="w-4 h-4 mr-2" />
              Recommended KPIs for {organizationType}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recommendedKpis.map((kpi: any, index: number) => (
                <div key={index} className="text-sm">
                  <span className="font-medium">{kpi.name}:</span>{' '}
                  <span className="text-muted-foreground">{kpi.target}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPI Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Object.entries(KPI_TYPES).map(([key, value]) => renderKpiCard(key, value))}
      </div>
    </div>
  );
};

export default OrganizationKPIs;
