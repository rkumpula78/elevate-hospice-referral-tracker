import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, TrendingUp, Users, Activity, Target, Calendar, Award } from "lucide-react";
import PageLayout from "@/components/layout/PageLayout";
import EventFrequencyManager from "@/components/kpis/EventFrequencyManager";
import RepPerformanceDashboard from "@/components/kpis/RepPerformanceDashboard";
import SegmentMixAnalysis from "@/components/kpis/SegmentMixAnalysis";
import VisitSchedulingManager from "@/components/kpis/VisitSchedulingManager";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";

const KPIPage = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [selectedTab, setSelectedTab] = useState('events');

  return (
    <PageLayout 
      title="KPI Dashboard" 
      subtitle="Track leading and lagging indicators for referral growth"
    >
      <div className={isMobile ? "space-y-4" : "space-y-6"}>
        {/* Header with Key Metrics Overview */}
        <div className={`grid grid-cols-1 md:grid-cols-4 ${isMobile ? 'gap-3' : 'gap-4'}`}>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Weekly Events</span>
              </div>
              <div className="text-2xl font-bold">42</div>
              <p className="text-xs text-muted-foreground">Target: 50</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Referrals Generated</span>
              </div>
              <div className="text-2xl font-bold">18</div>
              <p className="text-xs text-muted-foreground">This week</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium">Accounts Visited</span>
              </div>
              <div className="text-2xl font-bold">28</div>
              <p className="text-xs text-muted-foreground">Unique organizations</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium">Visit Compliance</span>
              </div>
              <div className="text-2xl font-bold">85%</div>
              <p className="text-xs text-muted-foreground">On schedule</p>
            </CardContent>
          </Card>
        </div>

        {/* Main KPI Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className={`grid w-full ${isMobile ? 'grid-cols-2 h-auto gap-1' : 'grid-cols-5 max-w-3xl'}`}>
            <TabsTrigger value="events" className={`flex items-center ${isMobile ? 'gap-1 text-xs py-2.5' : 'gap-2'}`}>
              <Calendar className={isMobile ? "h-3 w-3" : "h-4 w-4"} />
              {isMobile ? "Events" : "Event Frequency"}
            </TabsTrigger>
            <TabsTrigger value="performance" className={`flex items-center ${isMobile ? 'gap-1 text-xs py-2.5' : 'gap-2'}`}>
              <BarChart3 className={isMobile ? "h-3 w-3" : "h-4 w-4"} />
              {isMobile ? "Reps" : "Rep Performance"}
            </TabsTrigger>
            <TabsTrigger value="segments" className={`flex items-center ${isMobile ? 'gap-1 text-xs py-2.5' : 'gap-2'}`}>
              <TrendingUp className={isMobile ? "h-3 w-3" : "h-4 w-4"} />
              {isMobile ? "Segments" : "Segment Mix"}
            </TabsTrigger>
            <TabsTrigger value="scheduling" className={`flex items-center ${isMobile ? 'gap-1 text-xs py-2.5' : 'gap-2'}`}>
              <Calendar className={isMobile ? "h-3 w-3" : "h-4 w-4"} />
              {isMobile ? "Visits" : "Visit Scheduling"}
            </TabsTrigger>
            <TabsTrigger value="overview" className={`flex items-center ${isMobile ? 'gap-1 text-xs py-2.5 col-span-2' : 'gap-2'}`}>
              <Award className={isMobile ? "h-3 w-3" : "h-4 w-4"} />
              Overview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="events" className={isMobile ? "mt-4" : "mt-6"}>
            <EventFrequencyManager />
          </TabsContent>

          <TabsContent value="performance" className={isMobile ? "mt-4" : "mt-6"}>
            <RepPerformanceDashboard />
          </TabsContent>

          <TabsContent value="segments" className={isMobile ? "mt-4" : "mt-6"}>
            <SegmentMixAnalysis />
          </TabsContent>

          <TabsContent value="scheduling" className={isMobile ? "mt-4" : "mt-6"}>
            <VisitSchedulingManager />
          </TabsContent>

          <TabsContent value="overview" className={isMobile ? "mt-4" : "mt-6"}>
            <div className={`grid grid-cols-1 lg:grid-cols-2 ${isMobile ? 'gap-3' : 'gap-6'}`}>
              {/* KPI Summary Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    KPI Summary
                  </CardTitle>
                  <CardDescription>Leading vs Lagging indicators from Trella Health framework</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-3 text-green-700">Leading Indicators (Predictive)</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                          <span className="text-sm">Events completed per week</span>
                          <Badge className="bg-green-100 text-green-800">42/50</Badge>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                          <span className="text-sm">Visit frequency compliance</span>
                          <Badge className="bg-green-100 text-green-800">85%</Badge>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                          <span className="text-sm">Account coverage (A-rated)</span>
                          <Badge className="bg-green-100 text-green-800">92%</Badge>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-3 text-blue-700">Lagging Indicators (Results)</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
                          <span className="text-sm">Referrals generated</span>
                          <Badge className="bg-blue-100 text-blue-800">18</Badge>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
                          <span className="text-sm">Conversion rate</span>
                          <Badge className="bg-blue-100 text-blue-800">65%</Badge>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
                          <span className="text-sm">New admissions</span>
                          <Badge className="bg-blue-100 text-blue-800">12</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Account Tier Performance */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Account Tier Performance
                  </CardTitle>
                  <CardDescription>Visit frequency by account priority (A/B/C/P)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 border rounded-lg">
                      <div>
                        <span className="font-medium">A-Rated Accounts</span>
                        <p className="text-sm text-muted-foreground">Weekly visits required</p>
                      </div>
                      <div className="text-right">
                        <Badge className="bg-green-100 text-green-800">92% compliant</Badge>
                        <p className="text-sm text-muted-foreground mt-1">12/13 accounts</p>
                      </div>
                    </div>

                    <div className="flex justify-between items-center p-3 border rounded-lg">
                      <div>
                        <span className="font-medium">B-Rated Accounts</span>
                        <p className="text-sm text-muted-foreground">Bi-weekly visits required</p>
                      </div>
                      <div className="text-right">
                        <Badge className="bg-yellow-100 text-yellow-800">78% compliant</Badge>
                        <p className="text-sm text-muted-foreground mt-1">18/23 accounts</p>
                      </div>
                    </div>

                    <div className="flex justify-between items-center p-3 border rounded-lg">
                      <div>
                        <span className="font-medium">C-Rated Accounts</span>
                        <p className="text-sm text-muted-foreground">Monthly visits required</p>
                      </div>
                      <div className="text-right">
                        <Badge className="bg-orange-100 text-orange-800">65% compliant</Badge>
                        <p className="text-sm text-muted-foreground mt-1">32/49 accounts</p>
                      </div>
                    </div>

                    <div className="flex justify-between items-center p-3 border rounded-lg">
                      <div>
                        <span className="font-medium">Prospect Accounts</span>
                        <p className="text-sm text-muted-foreground">Quarterly visits required</p>
                      </div>
                      <div className="text-right">
                        <Badge className="bg-blue-100 text-blue-800">58% compliant</Badge>
                        <p className="text-sm text-muted-foreground mt-1">11/19 accounts</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Additional Overview Components */}
            <div className={isMobile ? "mt-4" : "mt-6"}>
              <Card>
                <CardHeader>
                  <CardTitle>Performance Trends</CardTitle>
                  <CardDescription>Key metrics over the last 12 weeks</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">📈</div>
                      <p className="font-medium mt-2">Events per Week</p>
                      <p className="text-sm text-muted-foreground">+15% vs last quarter</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">🎯</div>
                      <p className="font-medium mt-2">Referral Generation</p>
                      <p className="text-sm text-muted-foreground">+8% vs last quarter</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">👥</div>
                      <p className="font-medium mt-2">Account Coverage</p>
                      <p className="text-sm text-muted-foreground">+12% vs last quarter</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
};

export default KPIPage;