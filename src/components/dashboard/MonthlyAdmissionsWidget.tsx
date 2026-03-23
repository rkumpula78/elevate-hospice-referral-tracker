import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { format, startOfMonth, differenceInDays } from 'date-fns';
import { CheckCircle2 } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';

const MonthlyAdmissionsWidget = () => {
  const navigate = useNavigate();
  const thisMonth = startOfMonth(new Date());

  const { data: admissions = [], isLoading } = useQuery({
    queryKey: ['monthly-admissions', format(thisMonth, 'yyyy-MM')],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('referrals')
        .select('id, patient_name, admission_date, referral_date, benefit_period_number, organization_id, organizations(name), referral_source')
        .eq('status', 'admitted')
        .gte('admission_date', thisMonth.toISOString())
        .order('admission_date', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            This Month's Admissions
          </div>
          <Badge variant="secondary">{admissions.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 bg-muted rounded animate-pulse" />
            ))}
          </div>
        ) : admissions.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title="No admissions yet"
            description="No patients admitted this month"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="text-left py-2 font-medium">Patient</th>
                  <th className="text-left py-2 font-medium">Admit Date</th>
                  <th className="text-left py-2 font-medium">Source</th>
                  <th className="text-center py-2 font-medium">BP</th>
                  <th className="text-center py-2 font-medium">Days</th>
                </tr>
              </thead>
              <tbody>
                {admissions.map((a: any) => {
                  const daysToAdmit = a.referral_date && a.admission_date
                    ? differenceInDays(new Date(a.admission_date), new Date(a.referral_date))
                    : null;
                  return (
                    <tr
                      key={a.id}
                      className="border-b last:border-0 hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/referrals/${a.id}`)}
                    >
                      <td className="py-2 font-medium">{a.patient_name}</td>
                      <td className="py-2">
                        {a.admission_date ? format(new Date(a.admission_date), 'MMM dd') : '—'}
                      </td>
                      <td className="py-2 text-muted-foreground">
                        {a.organizations?.name || a.referral_source || '—'}
                      </td>
                      <td className="py-2 text-center">
                        <Badge variant="outline" className="text-xs">
                          {a.benefit_period_number || 1}
                        </Badge>
                      </td>
                      <td className="py-2 text-center">
                        {daysToAdmit !== null ? (
                          <span className={daysToAdmit <= 3 ? 'text-green-600 font-medium' : daysToAdmit <= 7 ? 'text-amber-600' : 'text-red-600'}>
                            {daysToAdmit}
                          </span>
                        ) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MonthlyAdmissionsWidget;
