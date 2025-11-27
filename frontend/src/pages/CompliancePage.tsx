
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import PageLayout from "@/components/layout/PageLayout";

const CompliancePage = () => {
  return (
    <PageLayout title="Compliance" subtitle="Monitor compliance and regulatory requirements">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Compliance Monitoring</CardTitle>
            <CardDescription>Track regulatory compliance and documentation requirements</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">Patient Satisfaction Score</h3>
                  <Badge variant="secondary">Compliant</Badge>
                </div>
                <p className="text-2xl font-bold">94.2%</p>
                <p className="text-sm text-gray-600">Current: 94.2% | Target: 95%</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '99%' }}></div>
                </div>
              </div>
              
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">Documentation Compliance</h3>
                  <Badge variant="secondary">Compliant</Badge>
                </div>
                <p className="text-2xl font-bold">98%</p>
                <p className="text-sm text-gray-600">All required documents up to date</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '98%' }}></div>
                </div>
              </div>
              
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">Staff Training</h3>
                  <Badge variant="secondary">Compliant</Badge>
                </div>
                <p className="text-2xl font-bold">100%</p>
                <p className="text-sm text-gray-600">All staff certifications current</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '100%' }}></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
};

export default CompliancePage;
