import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle, 
  AlertCircle, 
  Copy, 
  ExternalLink, 
  MessageSquare,
  Users,
  Settings,
  Webhook,
  Calendar,
  Bell
} from 'lucide-react';
import { validateTeamsConfiguration } from '@/config/teamsRouting';
import { useToast } from '@/hooks/use-toast';

interface TeamsConfigurationWizardProps {
  onConfigurationComplete?: () => void;
}

const TeamsConfigurationWizard: React.FC<TeamsConfigurationWizardProps> = ({
  onConfigurationComplete
}) => {
  const { toast } = useToast();
  const [activeStep, setActiveStep] = useState(0);
  // Webhook URLs are stored as Edge Function secrets, not client-side env vars
  const [webhookUrls, setWebhookUrls] = useState({
    primary: '',
    urgent: '',
    scheduling: '',
    system: '',
    regionA: '',
    regionB: ''
  });

  const configValidation = validateTeamsConfiguration();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "Environment variable copied to clipboard"
    });
  };

  const testWebhook = async (url: string, type: string) => {
    if (!url) {
      toast({
        title: "No URL configured",
        description: `Please configure the ${type} webhook URL first`,
        variant: "destructive"
      });
      return;
    }

    const testPayload = {
      "@type": "MessageCard",
      "@context": "http://schema.org/extensions",
      "themeColor": "#4A90E2",
      "summary": "Teams Integration Test",
      "sections": [{
        "activityTitle": "🧪 Configuration Test",
        "activitySubtitle": `Testing ${type} webhook integration`,
        "facts": [
          { "name": "Status", "value": "Configuration test successful" },
          { "name": "Channel Type", "value": type },
          { "name": "Timestamp", "value": new Date().toLocaleString() }
        ]
      }]
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testPayload)
      });

      if (response.ok) {
        toast({
          title: "Test successful!",
          description: `${type} webhook is working correctly`
        });
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      toast({
        title: "Test failed",
        description: `Failed to send test message: ${error}`,
        variant: "destructive"
      });
    }
  };

  const ConfigurationStep = ({ 
    step, 
    title, 
    description, 
    children 
  }: { 
    step: number; 
    title: string; 
    description: string; 
    children: React.ReactNode; 
  }) => (
    <div className={`space-y-4 ${activeStep === step ? '' : 'hidden'}`}>
      <div className="space-y-2">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
            activeStep > step ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
          }`}>
            {activeStep > step ? <CheckCircle className="w-4 h-4" /> : step + 1}
          </div>
          {title}
        </h3>
        <p className="text-gray-600">{description}</p>
      </div>
      <div className="pl-10">
        {children}
      </div>
    </div>
  );

  const WebhookConfigCard = ({ 
    title, 
    description, 
    envVar, 
    value, 
    placeholder,
    testType,
    isRequired = false
  }: {
    title: string;
    description: string;
    envVar: string;
    value: string;
    placeholder: string;
    testType: string;
    isRequired?: boolean;
  }) => (
    <Card className="p-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-medium">{title}</h4>
              {isRequired && <Badge variant="destructive" className="text-xs">Required</Badge>}
              {!isRequired && <Badge variant="outline" className="text-xs">Optional</Badge>}
            </div>
            <p className="text-sm text-gray-600 mt-1">{description}</p>
          </div>
          {value && (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <CheckCircle className="w-3 h-3 mr-1" />
              Configured
            </Badge>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(envVar)}
              className="text-xs"
            >
              <Copy className="w-3 h-3 mr-1" />
              {envVar}
            </Button>
            {value && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => testWebhook(value, testType)}
              >
                <Bell className="w-3 h-3 mr-1" />
                Test
              </Button>
            )}
          </div>
          
          {value ? (
            <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
              {value.substring(0, 50)}...
            </div>
          ) : (
            <div className="text-xs text-gray-500 bg-yellow-50 p-2 rounded border-yellow-200 border">
              Set {envVar}={placeholder} in your environment
            </div>
          )}
        </div>
      </div>
    </Card>
  );

  const steps = [
    {
      title: "Create Teams Channels",
      description: "Set up the recommended channel structure in your Teams workspace"
    },
    {
      title: "Configure Webhooks", 
      description: "Create incoming webhooks for each channel and add them to environment variables"
    },
    {
      title: "Test Configuration",
      description: "Verify your webhooks are working correctly"
    },
    {
      title: "Setup Complete",
      description: "Your Teams integration is ready to use!"
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Teams Integration Setup Wizard
        </CardTitle>
        <CardDescription>
          Configure Microsoft Teams notifications for your hospice referral workflow
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Progress Indicator */}
        <div className="flex items-center gap-2">
          {steps.map((step, index) => (
            <React.Fragment key={index}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                activeStep > index ? 'bg-green-100 text-green-700' : 
                activeStep === index ? 'bg-blue-100 text-blue-700' : 
                'bg-gray-100 text-gray-500'
              }`}>
                {activeStep > index ? <CheckCircle className="w-4 h-4" /> : index + 1}
              </div>
              {index < steps.length - 1 && (
                <div className={`h-0.5 w-8 ${
                  activeStep > index ? 'bg-green-200' : 'bg-gray-200'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Configuration Status */}
        {!configValidation.isValid && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <div className="font-medium">Configuration Issues:</div>
                {configValidation.errors.map((error, index) => (
                  <div key={index} className="text-sm">• {error}</div>
                ))}
                {configValidation.warnings.map((warning, index) => (
                  <div key={index} className="text-sm text-yellow-700">⚠ {warning}</div>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Step 1: Teams Channel Setup */}
        <ConfigurationStep
          step={0}
          title="Create Teams Channels"
          description="Set up the recommended channel structure for organized notifications"
        >
          <div className="space-y-4">
            <Alert>
              <Users className="h-4 w-4" />
              <AlertDescription>
                Create these channels in your Teams workspace for optimal notification routing:
              </AlertDescription>
            </Alert>

            <div className="grid gap-3">
              {[
                { name: "#referrals-general", purpose: "All new referrals and general updates" },
                { name: "#referrals-urgent", purpose: "High priority referrals and overdue F2F visits" },
                { name: "#scheduling", purpose: "F2F appointment scheduling and calendar sync" },
                { name: "#system-alerts", purpose: "Integration status and system notifications" }
              ].map((channel, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <div className="font-medium">{channel.name}</div>
                    <div className="text-sm text-gray-600">{channel.purpose}</div>
                  </div>
                  <MessageSquare className="h-4 w-4 text-gray-400" />
                </div>
              ))}
            </div>

            <Button onClick={() => setActiveStep(1)}>
              Next: Configure Webhooks
            </Button>
          </div>
        </ConfigurationStep>

        {/* Step 2: Webhook Configuration */}
        <ConfigurationStep
          step={1}
          title="Configure Webhooks"
          description="Create incoming webhooks for each channel and set environment variables"
        >
          <div className="space-y-4">
            <Alert>
              <Webhook className="h-4 w-4" />
              <AlertDescription>
                For each channel, go to channel settings → Connectors → Incoming Webhook → Configure
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <WebhookConfigCard
                title="Primary Referrals Channel"
                description="Main channel for new referrals and general updates"
                envVar="REACT_APP_TEAMS_WEBHOOK_URL"
                value={webhookUrls.primary}
                placeholder="https://outlook.office.com/webhook/xxx-xxx-xxx"
                testType="Primary"
                isRequired
              />

              <WebhookConfigCard
                title="Urgent Referrals Channel"
                description="High priority and overdue F2F notifications"
                envVar="REACT_APP_TEAMS_WEBHOOK_URGENT_URL"
                value={webhookUrls.urgent}
                placeholder="https://outlook.office.com/webhook/xxx-xxx-xxx"
                testType="Urgent"
              />

              <WebhookConfigCard
                title="Scheduling Channel"
                description="F2F appointment scheduling notifications"
                envVar="REACT_APP_TEAMS_WEBHOOK_SCHEDULING_URL"
                value={webhookUrls.scheduling}
                placeholder="https://outlook.office.com/webhook/xxx-xxx-xxx"
                testType="Scheduling"
              />

              <WebhookConfigCard
                title="System Alerts Channel"
                description="Integration status and system notifications"
                envVar="REACT_APP_TEAMS_WEBHOOK_SYSTEM_URL"
                value={webhookUrls.system}
                placeholder="https://outlook.office.com/webhook/xxx-xxx-xxx"
                testType="System"
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setActiveStep(0)}>
                Back
              </Button>
              <Button 
                onClick={() => setActiveStep(2)}
                disabled={!webhookUrls.primary}
              >
                Next: Test Configuration
              </Button>
            </div>
          </div>
        </ConfigurationStep>

        {/* Step 3: Test Configuration */}
        <ConfigurationStep
          step={2}
          title="Test Configuration"
          description="Send test messages to verify your webhooks are working"
        >
          <div className="space-y-4">
            <Alert>
              <Bell className="h-4 w-4" />
              <AlertDescription>
                Click the test buttons above each configured webhook to send test messages
              </AlertDescription>
            </Alert>

            <div className="grid gap-4">
              {webhookUrls.primary && (
                <Button
                  onClick={() => testWebhook(webhookUrls.primary, 'Primary Channel')}
                  className="w-full"
                >
                  <Bell className="w-4 h-4 mr-2" />
                  Test Primary Channel
                </Button>
              )}
              
              {webhookUrls.urgent && (
                <Button
                  variant="destructive"
                  onClick={() => testWebhook(webhookUrls.urgent, 'Urgent Channel')}
                  className="w-full"
                >
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Test Urgent Channel
                </Button>
              )}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setActiveStep(1)}>
                Back
              </Button>
              <Button onClick={() => setActiveStep(3)}>
                Complete Setup
              </Button>
            </div>
          </div>
        </ConfigurationStep>

        {/* Step 4: Complete */}
        <ConfigurationStep
          step={3}
          title="Setup Complete!"
          description="Your Teams integration is configured and ready to use"
        >
          <div className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <div className="font-medium">Teams integration is now active!</div>
                  <div className="text-sm">
                    • New referrals will automatically send notifications<br/>
                    • F2F deadline alerts will be sent to appropriate channels<br/>
                    • Status changes will trigger relevant notifications
                  </div>
                </div>
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <h4 className="font-medium">What happens next:</h4>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>✓ New referrals trigger automatic Teams notifications</li>
                <li>✓ F2F deadlines send alerts to urgent channels when approaching</li>
                <li>✓ Status changes notify relevant team members</li>
                <li>✓ Failed notifications are logged for manual retry</li>
              </ul>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={onConfigurationComplete}
                className="w-full"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Start Using Teams Integration
              </Button>
            </div>
          </div>
        </ConfigurationStep>
      </CardContent>
    </Card>
  );
};

export default TeamsConfigurationWizard;