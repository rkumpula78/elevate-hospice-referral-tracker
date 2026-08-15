import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, MapPin } from 'lucide-react';
import PageLayout from "@/components/layout/PageLayout";
import OrganizationsList from "@/components/crm/OrganizationsList";
import BDAccountsTab from "@/components/bd/BDAccountsTab";
import LogVisitSheet from "@/components/bd/LogVisitSheet";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

const TIERS = ['A', 'B', 'C', 'D'] as const;

const STATUS_ORDER = [
  { key: 'cold', label: 'Cold', chip: 'bg-gray-200 text-gray-800' },
  { key: 'contacted', label: 'Contacted', chip: 'bg-blue-100 text-blue-800' },
  { key: 'active_conversation', label: 'Active Conversation', chip: 'bg-teal-100 text-teal-800' },
  { key: 'pre_referral', label: 'Pre-Referral', chip: 'bg-purple-100 text-purple-800' },
  { key: 'active_referrer', label: 'Active Referrer', chip: 'bg-green-100 text-green-800' },
  { key: 'lost_inactive', label: 'Lost / Inactive', chip: 'bg-red-100 text-red-800' },
];

const PipelineByTier = () => {
  const [open, setOpen] = useState(false);

  const { data: pivot, isLoading } = useQuery({
    queryKey: ['org-pipeline-by-tier'],
    queryFn: async () => {
      // All marketers — intentionally NOT filtered by assigned_marketer
      const { data, error } = await supabase
        .from('organizations')
        .select('bd_tier, bd_status')
        .not('bd_tier', 'is', null);
      if (error) throw error;

      const p: Record<string, Record<string, number>> = {};
      STATUS_ORDER.forEach(s => { p[s.key] = { A: 0, B: 0, C: 0, D: 0 }; });
      (data || []).forEach((row: any) => {
        const sk = (row.bd_status || 'cold').toLowerCase();
        const tk = (row.bd_tier || '').toUpperCase();
        if (p[sk] && (TIERS as readonly string[]).includes(tk)) {
          p[sk][tk] = (p[sk][tk] || 0) + 1;
        }
      });
      return p;
    },
  });

  const rowTotal = (sk: string) => TIERS.reduce((s, t) => s + (pivot?.[sk]?.[t] || 0), 0);
  const colTotal = (t: string) => STATUS_ORDER.reduce((s, r) => s + (pivot?.[r.key]?.[t] || 0), 0);
  const grandTotal = STATUS_ORDER.reduce((s, r) => s + rowTotal(r.key), 0);

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="mb-6">
      <CollapsibleTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          <span className="font-semibold">Pipeline by Tier</span>
          <ChevronDown className={cn("w-4 h-4 transition-transform", open && "rotate-180")} />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-3">
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            {isLoading ? (
              <Skeleton className="h-64 m-4" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    {TIERS.map(t => <TableHead key={t} className="text-center">Tier {t}</TableHead>)}
                    <TableHead className="text-center">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {STATUS_ORDER.map(s => (
                    <TableRow key={s.key}>
                      <TableCell>
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${s.chip}`}>
                          {s.label}
                        </span>
                      </TableCell>
                      {TIERS.map(t => (
                        <TableCell key={t} className="text-center">{pivot?.[s.key]?.[t] || 0}</TableCell>
                      ))}
                      <TableCell className="text-center font-semibold">{rowTotal(s.key)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/50 font-semibold">
                    <TableCell>TOTAL</TableCell>
                    {TIERS.map(t => <TableCell key={t} className="text-center">{colTotal(t)}</TableCell>)}
                    <TableCell className="text-center">{grandTotal}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </CollapsibleContent>
    </Collapsible>
  );
};

const OrganizationsPage = () => {
  const [logOpen, setLogOpen] = useState(false);

  return (
    <PageLayout
      title="Organizations"
      subtitle="Manage referral sources and partner organizations"
      actions={
        <Button variant="outline" size="sm" onClick={() => setLogOpen(true)}>
          <MapPin className="w-4 h-4 mr-2" />
          Log Visit
        </Button>
      }
    >
      <PipelineByTier />

      <Tabs defaultValue="organizations" className="w-full">
        <TabsList>
          <TabsTrigger value="organizations">Organizations</TabsTrigger>
          <TabsTrigger value="pipeline">My Pipeline</TabsTrigger>
        </TabsList>

        <TabsContent value="organizations">
          <OrganizationsList />
        </TabsContent>

        <TabsContent value="pipeline">
          <BDAccountsTab />
        </TabsContent>
      </Tabs>

      <LogVisitSheet open={logOpen} onOpenChange={setLogOpen} />
    </PageLayout>
  );
};

export default OrganizationsPage;
