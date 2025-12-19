
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Target } from 'lucide-react';

interface OrganizationKPICardProps {
  organizationId: string;
  organizationType: string;
}

const OrganizationKPICard: React.FC<OrganizationKPICardProps> = ({ 
  organizationId, 
  organizationType 
}) => {
  // Mock KPI data for now
  const mockKPIs = {
    'assisted_living': [
      { name: 'Referrals/Month', current: 4, target: 6, trend: 'up' },
      { name: 'Response Time', current: 1.2, target: 2, trend: 'up', unit: 'hrs' }
    ],
    'hospital': [
      { name: 'Referrals/Month', current: 12, target: 15, trend: 'up' },
      { name: 'Conversion Rate', current: 88, target: 85, trend: 'up', unit: '%' }
    ]
  };

  const kpis = mockKPIs[organizationType as keyof typeof mockKPIs] || mockKPIs['assisted_living'];

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center">
          <Target className="w-4 h-4 mr-2" />
          KPIs
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {kpis.map((kpi, index) => (
          <div key={index} className="flex justify-between items-center">
            <div className="flex-1">
              <p className="text-xs font-medium">{kpi.name}</p>
              <div className="flex items-center space-x-1">
                <span className="text-sm">{kpi.current}{kpi.unit || ''}</span>
                <span className="text-xs text-muted-foreground">/ {kpi.target}{kpi.unit || ''}</span>
                {kpi.trend === 'up' ? (
                  <TrendingUp className="w-3 h-3 text-green-500" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-red-500" />
                )}
              </div>
            </div>
            <Badge variant={kpi.current >= kpi.target ? "default" : "secondary"} className="text-xs">
              {Math.round((kpi.current / kpi.target) * 100)}%
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default OrganizationKPICard;
