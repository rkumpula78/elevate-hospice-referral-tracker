
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PageLayout from "@/components/layout/PageLayout";
import { Download, FileText, Calendar, TrendingUp } from "lucide-react";

const ReportsPage = () => {
  return (
    <PageLayout title="Reports" subtitle="Generate and download reports">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Referral Summary</span>
            </CardTitle>
            <CardDescription>
              Monthly referral activity and conversion rates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">
              <Download className="w-4 h-4 mr-2" />
              Generate Report
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Performance Metrics</span>
            </CardTitle>
            <CardDescription>
              KPI dashboard with key performance indicators
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">
              <Download className="w-4 h-4 mr-2" />
              Generate Report
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Activity Report</span>
            </CardTitle>
            <CardDescription>
              Detailed activity log and follow-up tracking
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">
              <Download className="w-4 h-4 mr-2" />
              Generate Report
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Organization Analysis</span>
            </CardTitle>
            <CardDescription>
              Partner performance and relationship status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">
              <Download className="w-4 h-4 mr-2" />
              Generate Report
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Conversion Funnel</span>
            </CardTitle>
            <CardDescription>
              Referral to admission conversion analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">
              <Download className="w-4 h-4 mr-2" />
              Generate Report
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Custom Date Range</span>
            </CardTitle>
            <CardDescription>
              Generate reports for specific time periods
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">
              <Download className="w-4 h-4 mr-2" />
              Custom Report
            </Button>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
};

export default ReportsPage;
