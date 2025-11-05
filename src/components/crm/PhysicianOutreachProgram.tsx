import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Sparkles, Users, Mail, Download } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const PhysicianOutreachProgram = () => {
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedMessage, setGeneratedMessage] = useState('');
  const [messageContext, setMessageContext] = useState('');

  const handleGenerateMessage = async () => {
    if (!messageContext.trim()) {
      toast({
        title: "Context Required",
        description: "Please provide context about the physician or situation.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-assist', {
        body: {
          context: 'referral',
          situation: 'physician_outreach',
          notes: messageContext,
          contactName: 'Physician',
          organizationName: 'Medical Practice'
        }
      });

      if (error) throw error;

      setGeneratedMessage(data.message);
      toast({
        title: "Message Generated",
        description: "AI has created a personalized outreach message.",
      });
    } catch (error) {
      console.error('Error generating message:', error);
      toast({
        title: "Generation Failed",
        description: "Unable to generate message. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const materials = [
    {
      title: "Transforming End-of-Life Care White Paper",
      description: "Comprehensive guide on timely hospice partnership and its impact on patient outcomes",
      type: "whitepaper",
      icon: FileText,
      url: "/marketing-materials/physician-outreach-whitepaper.html"
    }
  ];

  return (
    <div className={`space-y-${isMobile ? '4' : '6'}`}>
      <Card>
        <CardHeader className={isMobile ? "p-4" : "p-6"}>
          <CardTitle className={isMobile ? "text-lg" : "text-xl"}>Physician Outreach Program</CardTitle>
          <CardDescription className={isMobile ? "text-sm" : ""}>
            Materials and AI-powered tools for building physician relationships
          </CardDescription>
        </CardHeader>
        <CardContent className={isMobile ? "p-4 pt-0" : "p-6 pt-0"}>
          <Tabs defaultValue="materials" className={isMobile ? "space-y-3" : "space-y-4"}>
            <TabsList className={`grid grid-cols-3 ${isMobile ? 'w-full h-11' : 'w-fit'}`}>
              <TabsTrigger value="materials" className={isMobile ? "text-xs px-2" : ""}>
                <FileText className={`${isMobile ? 'h-3 w-3 mr-1' : 'h-4 w-4 mr-2'}`} />
                {isMobile ? "Materials" : "Materials"}
              </TabsTrigger>
              <TabsTrigger value="ai-assist" className={isMobile ? "text-xs px-2" : ""}>
                <Sparkles className={`${isMobile ? 'h-3 w-3 mr-1' : 'h-4 w-4 mr-2'}`} />
                {isMobile ? "AI Help" : "AI Assist"}
              </TabsTrigger>
              <TabsTrigger value="targeting" className={isMobile ? "text-xs px-2" : ""}>
                <Users className={`${isMobile ? 'h-3 w-3 mr-1' : 'h-4 w-4 mr-2'}`} />
                {isMobile ? "Target" : "Targeting"}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="materials" className={`space-y-${isMobile ? '3' : '4'}`}>
              {materials.map((material, index) => {
                const Icon = material.icon;
                return (
                  <Card key={index}>
                    <CardHeader className={isMobile ? "p-4" : "p-5"}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <Icon className={`${isMobile ? 'h-5 w-5' : 'h-6 w-6'} text-primary mt-1`} />
                          <div>
                            <CardTitle className={isMobile ? "text-base" : "text-lg"}>{material.title}</CardTitle>
                            <CardDescription className={isMobile ? "text-xs mt-1" : "mt-1"}>
                              {material.description}
                            </CardDescription>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size={isMobile ? "sm" : "default"}
                          onClick={() => window.open(material.url, '_blank')}
                          className="shrink-0"
                        >
                          <Download className={`${isMobile ? 'h-3 w-3 mr-1' : 'h-4 w-4 mr-2'}`} />
                          {isMobile ? "View" : "View/Download"}
                        </Button>
                      </div>
                    </CardHeader>
                  </Card>
                );
              })}
            </TabsContent>

            <TabsContent value="ai-assist" className={`space-y-${isMobile ? '3' : '4'}`}>
              <Card>
                <CardHeader className={isMobile ? "p-4" : "p-5"}>
                  <CardTitle className={isMobile ? "text-base" : "text-lg"}>AI Message Generator</CardTitle>
                  <CardDescription className={isMobile ? "text-xs" : ""}>
                    Generate personalized outreach messages for physicians
                  </CardDescription>
                </CardHeader>
                <CardContent className={isMobile ? "p-4 pt-0 space-y-3" : "p-5 pt-0 space-y-4"}>
                  <div className="space-y-2">
                    <Label htmlFor="context">Message Context</Label>
                    <Textarea
                      id="context"
                      placeholder="e.g., Cardiologist with 5+ years experience, interested in hospice partnerships, previous concerns about patient referral timing..."
                      value={messageContext}
                      onChange={(e) => setMessageContext(e.target.value)}
                      className={isMobile ? "min-h-[100px]" : "min-h-[120px]"}
                    />
                  </div>
                  <Button
                    onClick={handleGenerateMessage}
                    disabled={isGenerating}
                    className={`w-full ${isMobile ? 'h-11' : ''}`}
                  >
                    <Sparkles className={`${isMobile ? 'h-3 w-3 mr-1' : 'h-4 w-4 mr-2'}`} />
                    {isGenerating ? "Generating..." : "Generate Message"}
                  </Button>
                  {generatedMessage && (
                    <Card className="bg-muted/50">
                      <CardContent className={isMobile ? "p-4" : "p-5"}>
                        <div className="space-y-3">
                          <Label>Generated Message</Label>
                          <div className={`${isMobile ? 'text-sm' : ''} whitespace-pre-wrap`}>
                            {generatedMessage}
                          </div>
                          <Button
                            variant="outline"
                            size={isMobile ? "sm" : "default"}
                            onClick={() => {
                              navigator.clipboard.writeText(generatedMessage);
                              toast({
                                title: "Copied",
                                description: "Message copied to clipboard"
                              });
                            }}
                            className="w-full"
                          >
                            Copy to Clipboard
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="targeting" className={`space-y-${isMobile ? '3' : '4'}`}>
              <Card>
                <CardHeader className={isMobile ? "p-4" : "p-5"}>
                  <CardTitle className={isMobile ? "text-base" : "text-lg"}>Target Physician Groups</CardTitle>
                  <CardDescription className={isMobile ? "text-xs" : ""}>
                    Identify and segment physicians for outreach
                  </CardDescription>
                </CardHeader>
                <CardContent className={isMobile ? "p-4 pt-0" : "p-5 pt-0"}>
                  <div className="text-center py-8">
                    <Users className={`h-${isMobile ? '10' : '12'} w-${isMobile ? '10' : '12'} text-muted-foreground mx-auto mb-3`} />
                    <p className={`${isMobile ? 'text-sm' : ''} text-muted-foreground mb-2`}>
                      Physician Targeting Tools
                    </p>
                    <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
                      Filter and identify physicians by specialty, location, referral history, and engagement level
                    </p>
                    <Button variant="outline" className={`mt-4 ${isMobile ? 'h-10' : ''}`}>
                      View Physician Database
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default PhysicianOutreachProgram;
