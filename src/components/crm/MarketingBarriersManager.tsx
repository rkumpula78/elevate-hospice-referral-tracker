import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, ShieldAlert, Users, Building2, AlertCircle, FileText, ChevronRight, Search, CheckCircle, TrendingUp } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/use-mobile";

interface Barrier {
  title: string;
  description: string;
  category: string;
}

interface Countermeasure {
  title: string;
  actions: string[];
  scripts?: string[];
}

const MarketingBarriersManager: React.FC = () => {
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState('');

  const barriers = {
    healthcare: [
      {
        category: "Timing & Prognosis Concerns",
        items: [
          { title: "Late referral syndrome", description: '"Six months is too long" misconception' },
          { title: "Prognostic uncertainty", description: 'Reluctance to "give up" on curative treatment' },
          { title: "Regulatory fear", description: "Concern about Medicare audit scrutiny" },
          { title: "Documentation burden", description: "Perceived complexity of hospice eligibility requirements" }
        ]
      },
      {
        category: "Communication & Relationship Challenges",
        items: [
          { title: "Lack of familiarity", description: "Limited understanding of hospice services and benefits" },
          { title: "Previous negative experiences", description: "Poor outcomes with other hospice providers" },
          { title: "Competing priorities", description: "Overwhelmed schedules limiting time for hospice discussions" },
          { title: "Referral process confusion", description: "Uncertainty about how to initiate hospice referrals" }
        ]
      },
      {
        category: "Emotional & Professional Barriers",
        items: [
          { title: "Sense of failure", description: 'Viewing hospice referral as "giving up" on the patient' },
          { title: "Family pressure", description: "Dealing with families demanding continued aggressive treatment" },
          { title: "Professional identity", description: '"I\'m here to cure, not surrender"' },
          { title: "Legal concerns", description: "Fear of malpractice or family complaints" }
        ]
      }
    ],
    patientFamily: [
      {
        category: "Cultural & Religious Considerations",
        items: [
          { title: "Cultural taboos", description: "Death as forbidden topic in certain cultures" },
          { title: "Religious beliefs", description: 'Conflict with "natural death" vs. "fighting until the end"' },
          { title: "Language barriers", description: "Limited English proficiency affecting understanding" },
          { title: "Family hierarchy", description: "Decision-making protocols varying by culture" }
        ]
      },
      {
        category: "Financial Concerns & Insurance Confusion",
        items: [
          { title: "Cost misconceptions", description: "Belief that hospice is expensive or not covered" },
          { title: "Medicare misinformation", description: "Confusion about eligibility and benefits" },
          { title: "Hidden costs fears", description: "Worry about unexpected expenses" },
          { title: "Insurance verification", description: "Uncertainty about coverage specifics" }
        ]
      },
      {
        category: "Emotional Readiness & Denial Patterns",
        items: [
          { title: "Denial of prognosis", description: "Inability to accept terminal diagnosis" },
          { title: "Hope for miracle", description: "Belief in last-minute cure or recovery" },
          { title: "Guilt and regret", description: 'Family members feeling responsible for "giving up"' },
          { title: "Timing resistance", description: '"Not ready yet" syndrome' }
        ]
      },
      {
        category: "Misconceptions About Hospice Care",
        items: [
          { title: '"Giving up" myth', description: "Hospice means abandoning hope" },
          { title: "Pain and suffering fears", description: "Concern about inadequate pain management" },
          { title: "Location confusion", description: "Not understanding home-based care options" },
          { title: "Service limitations", description: "Thinking hospice only provides basic care" }
        ]
      }
    ],
    competitive: [
      {
        category: "Competing Hospice Providers",
        items: [
          { title: "Established relationships", description: "Long-standing referral patterns with other providers" },
          { title: "Market saturation", description: "Multiple hospice options creating confusion" },
          { title: "Aggressive marketing", description: "Competitors with larger marketing budgets" },
          { title: "Service differentiation", description: "Difficulty distinguishing between providers" }
        ]
      },
      {
        category: "Hospital-Based Programs",
        items: [
          { title: "Internal referral pressure", description: "Hospitals favoring their own hospice programs" },
          { title: "Convenience factor", description: "Easier internal transfers and communication" },
          { title: "Financial incentives", description: "Revenue retention within hospital system" },
          { title: "Clinical integration", description: "Seamless transitions within same organization" }
        ]
      }
    ],
    operational: [
      {
        category: "Response Time Issues",
        items: [
          { title: "Delayed intake processing", description: "Slow response to referral requests" },
          { title: "Weekend/holiday gaps", description: "Limited availability during off-hours" },
          { title: "Communication delays", description: "Lag time in returning calls or providing updates" },
          { title: "Admission scheduling", description: "Extended timeframes for first visits" }
        ]
      },
      {
        category: "Capacity & Resource Limitations",
        items: [
          { title: "Census management", description: "Being at capacity for new admissions" },
          { title: "Staffing shortages", description: "Insufficient clinical staff for new patients" },
          { title: "Geographic constraints", description: "Service area limitations affecting accessibility" },
          { title: "Specialized care gaps", description: "Limited availability of specialized services" }
        ]
      }
    ]
  };

  const countermeasures = {
    healthcare: {
      title: "Healthcare Provider Solutions",
      icon: Building2,
      sections: [
        {
          title: "Education & Awareness Initiatives",
          actions: [
            "Schedule monthly lunch-and-learns at key referral sources",
            "Provide clinical staff with hospice eligibility quick-reference cards",
            "Offer CME-accredited educational programs on end-of-life care",
            "Create physician-to-physician consultation opportunities"
          ],
          scripts: [
            '"Dr. Johnson, I\'d like to share some updated Medicare guidelines that might help you identify appropriate hospice candidates earlier. Would you have 10 minutes this week for me to review these with you?"',
            '"Our medical director, Dr. Smith, would be happy to consult with you on any cases where you\'re uncertain about hospice appropriateness. This consultation is complimentary and helps ensure we\'re serving patients at the optimal time."'
          ]
        },
        {
          title: "Relationship Building Strategies",
          actions: [
            "Assign dedicated liaison to each high-volume referral source",
            "Implement regular facility rounds with clinical updates",
            "Provide 24/7 physician-to-physician consultation line",
            "Establish joint case review meetings"
          ]
        }
      ]
    },
    patientFamily: {
      title: "Patient/Family Solutions",
      icon: Users,
      sections: [
        {
          title: "Cultural Sensitivity Approaches",
          actions: [
            "Develop culture-specific educational materials in multiple languages",
            "Train staff on cultural competency and religious considerations",
            "Partner with community religious leaders and cultural organizations",
            "Offer family meeting facilitation services"
          ],
          scripts: [
            '"I understand that discussing end-of-life care may be difficult given your family\'s beliefs. We want to respect those beliefs while ensuring your loved one receives the most appropriate care."',
            '"Our team includes chaplains from various faith traditions who can support your family\'s spiritual needs while respecting your specific beliefs and practices."'
          ]
        },
        {
          title: "Addressing Misconceptions",
          scripts: [
            '"Many families worry that choosing hospice means giving up hope. Actually, hospice helps families hope for different things - comfort, quality time together, peace, and the opportunity to say what needs to be said."',
            '"Hospice doesn\'t shorten life - studies show that patients often live longer with hospice care because of better symptom management and reduced stress."'
          ]
        }
      ]
    },
    competitive: {
      title: "Competitive Solutions",
      icon: TrendingUp,
      sections: [
        {
          title: "Differentiation Strategies",
          actions: [
            "Develop unique value proposition highlighting Elevate's strengths",
            "Create service comparison charts showing competitive advantages",
            "Implement patient/family testimonial program",
            "Establish measurable quality metrics dashboard"
          ]
        },
        {
          title: "Relationship Investment",
          actions: [
            "Provide added-value services to referral sources",
            "Offer educational resources and support beyond patient care",
            "Implement referral source recognition programs",
            "Create exclusive communication channels for top referrers"
          ]
        }
      ]
    },
    operational: {
      title: "Operational Solutions",
      icon: CheckCircle,
      sections: [
        {
          title: "Process Optimization",
          actions: [
            "Implement same-day intake processing goal",
            "Establish weekend and holiday on-call coverage",
            "Create rapid response team for urgent referrals",
            "Develop capacity management protocols"
          ]
        },
        {
          title: "Service Standards",
          actions: [
            "Return calls within 2 hours during business hours",
            "Schedule admissions within 24 hours of acceptance",
            "Provide daily communication during first week of care",
            "Maintain 95% or higher admission completion rate"
          ]
        }
      ]
    }
  };

  const filterBarriers = (barrierList: any[]) => {
    if (!searchQuery) return barrierList;
    
    return barrierList.map(group => ({
      ...group,
      items: group.items.filter((item: Barrier) =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    })).filter(group => group.items.length > 0);
  };

  const renderBarrierSection = (barrierList: any[], icon: React.ElementType) => {
    const Icon = icon;
    const filtered = filterBarriers(barrierList);

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Icon className="h-5 w-5 text-destructive" />
          <h3 className="font-semibold">Common Barriers</h3>
        </div>
        
        <Accordion type="single" collapsible className="space-y-2">
          {filtered.map((group, idx) => (
            <AccordionItem key={idx} value={`item-${idx}`} className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-normal">
                    {group.category}
                  </Badge>
                  <Badge variant="secondary">{group.items.length}</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 pt-2">
                  {group.items.map((item: Barrier, itemIdx: number) => (
                    <div key={itemIdx} className="flex gap-3 pb-3 border-b last:border-0 last:pb-0">
                      <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-sm">{item.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    );
  };

  const renderCountermeasureSection = (data: any) => {
    const Icon = data.icon;
    
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Icon className="h-5 w-5 text-success" />
          <h3 className="font-semibold">{data.title}</h3>
        </div>
        
        <Accordion type="single" collapsible className="space-y-2">
          {data.sections.map((section: any, idx: number) => (
            <AccordionItem key={idx} value={`solution-${idx}`} className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <span className="font-medium">{section.title}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pt-2">
                  {section.actions && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2">Action Steps:</p>
                      <ul className="space-y-2">
                        {section.actions.map((action: string, actionIdx: number) => (
                          <li key={actionIdx} className="flex gap-2 text-sm">
                            <ChevronRight className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                            <span>{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {section.scripts && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2">Sample Scripts:</p>
                      <div className="space-y-2">
                        {section.scripts.map((script: string, scriptIdx: number) => (
                          <div key={scriptIdx} className="bg-muted/50 p-3 rounded-md text-sm italic border-l-2 border-primary">
                            {script}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className={isMobile ? "p-4" : ""}>
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1">
            <CardTitle className={`flex items-center gap-2 ${isMobile ? 'text-lg' : ''}`}>
              <ShieldAlert className={isMobile ? "h-4 w-4" : "h-5 w-5"} />
              Marketing Barriers & Countermeasures
            </CardTitle>
            {!isMobile && (
              <CardDescription>Identify obstacles and implement proven solutions</CardDescription>
            )}
          </div>
        </div>
        
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search barriers or solutions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>
      
      <CardContent className={isMobile ? "p-4 pt-0" : ""}>
        <Tabs defaultValue="healthcare" className="space-y-4">
          <TabsList className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-4'} ${isMobile ? 'w-full' : 'w-fit'}`}>
            <TabsTrigger value="healthcare" className={isMobile ? "text-xs px-2" : ""}>
              <Building2 className="h-3 w-3 mr-1" />
              {isMobile ? "Providers" : "Healthcare"}
            </TabsTrigger>
            <TabsTrigger value="patientFamily" className={isMobile ? "text-xs px-2" : ""}>
              <Users className="h-3 w-3 mr-1" />
              {isMobile ? "Families" : "Patient/Family"}
            </TabsTrigger>
            <TabsTrigger value="competitive" className={isMobile ? "text-xs px-2" : ""}>
              <TrendingUp className="h-3 w-3 mr-1" />
              Competitive
            </TabsTrigger>
            <TabsTrigger value="operational" className={isMobile ? "text-xs px-2" : ""}>
              <AlertTriangle className="h-3 w-3 mr-1" />
              Operational
            </TabsTrigger>
          </TabsList>

          <ScrollArea className={isMobile ? "h-[60vh]" : "h-[600px]"}>
            <div className="pr-4">
              <TabsContent value="healthcare" className="space-y-6 mt-0">
                <Tabs defaultValue="barriers" className="space-y-4">
                  <TabsList className="grid grid-cols-2 w-full">
                    <TabsTrigger value="barriers">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Barriers
                    </TabsTrigger>
                    <TabsTrigger value="solutions">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Solutions
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="barriers">
                    {renderBarrierSection(barriers.healthcare, Building2)}
                  </TabsContent>
                  
                  <TabsContent value="solutions">
                    {renderCountermeasureSection(countermeasures.healthcare)}
                  </TabsContent>
                </Tabs>
              </TabsContent>

              <TabsContent value="patientFamily" className="space-y-6 mt-0">
                <Tabs defaultValue="barriers" className="space-y-4">
                  <TabsList className="grid grid-cols-2 w-full">
                    <TabsTrigger value="barriers">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Barriers
                    </TabsTrigger>
                    <TabsTrigger value="solutions">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Solutions
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="barriers">
                    {renderBarrierSection(barriers.patientFamily, Users)}
                  </TabsContent>
                  
                  <TabsContent value="solutions">
                    {renderCountermeasureSection(countermeasures.patientFamily)}
                  </TabsContent>
                </Tabs>
              </TabsContent>

              <TabsContent value="competitive" className="space-y-6 mt-0">
                <Tabs defaultValue="barriers" className="space-y-4">
                  <TabsList className="grid grid-cols-2 w-full">
                    <TabsTrigger value="barriers">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Barriers
                    </TabsTrigger>
                    <TabsTrigger value="solutions">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Solutions
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="barriers">
                    {renderBarrierSection(barriers.competitive, TrendingUp)}
                  </TabsContent>
                  
                  <TabsContent value="solutions">
                    {renderCountermeasureSection(countermeasures.competitive)}
                  </TabsContent>
                </Tabs>
              </TabsContent>

              <TabsContent value="operational" className="space-y-6 mt-0">
                <Tabs defaultValue="barriers" className="space-y-4">
                  <TabsList className="grid grid-cols-2 w-full">
                    <TabsTrigger value="barriers">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Barriers
                    </TabsTrigger>
                    <TabsTrigger value="solutions">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Solutions
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="barriers">
                    {renderBarrierSection(barriers.operational, AlertTriangle)}
                  </TabsContent>
                  
                  <TabsContent value="solutions">
                    {renderCountermeasureSection(countermeasures.operational)}
                  </TabsContent>
                </Tabs>
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default MarketingBarriersManager;