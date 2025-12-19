import React, { useState, useEffect } from 'react';
import { MessageSquare, X, Sparkles, Building2, Users, Loader2, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

interface AIQuickHelpProps {
  contactName?: string;
  organizationName?: string;
  contextData?: any;
  fullWidth?: boolean;
  variant?: 'default' | 'sidebar';
}

const AIQuickHelp: React.FC<AIQuickHelpProps> = ({ 
  contactName = '', 
  organizationName = '',
  contextData = {},
  fullWidth = false,
  variant = 'default'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [context, setContext] = useState<'family' | 'referral'>('family');
  const [situation, setSituation] = useState('');
  const [notes, setNotes] = useState('');
  const [generatedMessage, setGeneratedMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [inputMode, setInputMode] = useState<'guided' | 'freeform'>('guided');

  const familySituations = [
    { value: 'initial_outreach', label: 'Initial outreach after referral' },
    { value: 'follow_up_resistant', label: 'Follow up - family is resistant' },
    { value: 'urgent_admission', label: 'Urgent admission needed' },
    { value: 'check_in', label: 'Regular check-in call' },
    { value: 'difficult_news', label: 'Sharing difficult news' }
  ];

  const referralSituations = [
    { value: 'introduce_services', label: 'Introduce our services' },
    { value: 'thank_referral', label: 'Thank you for referral' },
    { value: 'partnership_proposal', label: 'Propose partnership' },
    { value: 'follow_up_meeting', label: 'Follow up after meeting' },
    { value: 'share_outcomes', label: 'Share patient outcomes' },
    { value: 'schedule_inservice', label: 'Schedule an in-service' }
  ];

  const handleGenerate = async () => {
    if (inputMode === 'guided' && !situation) return;
    if (inputMode === 'freeform' && !notes.trim()) return;
    
    setLoading(true);
    setGeneratedMessage('');
    
    try {
      const { data, error } = await supabase.functions.invoke('ai-assist', {
        body: {
          context,
          situation: inputMode === 'freeform' ? 'freeform' : situation,
          notes,
          contactName: context === 'family' ? contactName : '',
          organizationName: context === 'referral' ? organizationName : '',
          ...contextData
        }
      });

      if (error) throw error;
      
      setGeneratedMessage(data.message || 'Unable to generate message. Please try again.');
    } catch (error) {
      console.error('AI generation error:', error);
      setGeneratedMessage('I apologize, but I encountered an error. Please try again or contact support.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUseMessage = () => {
    // In a full implementation, this would insert the message into a form field
    handleCopy();
    setIsOpen(false);
  };

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  return (
    <>
      {/* Trigger Button */}
      <Button
        variant={variant === 'sidebar' ? 'secondary' : 'outline'}
        size="sm"
        onClick={() => setIsOpen(true)}
        className={`gap-2 ${fullWidth ? 'w-full' : ''} ${
          variant === 'sidebar' 
            ? 'bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white border-gray-700' 
            : ''
        }`}
      >
        <Sparkles className="h-4 w-4" />
        AI Message Help
      </Button>

      {/* Modal */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            // Close if clicking on backdrop (not the modal content)
            if (e.target === e.currentTarget) {
              setIsOpen(false);
            }
          }}
        >
          <div className="w-full max-w-2xl max-h-[90vh] overflow-hidden bg-white shadow-2xl rounded-lg">
            {/* Header */}
            <div className="border-b border-gray-200 p-4 flex items-center justify-between bg-white">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">AI Message Assistant</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 p-0 hover:bg-gray-100 rounded-md text-gray-500 hover:text-gray-700"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(90vh-120px)] bg-white">
              {/* Mode Toggle */}
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-900">Input Mode:</span>
                <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
                  <button
                    onClick={() => {
                      setInputMode('guided');
                      setSituation('');
                      setNotes('');
                      setGeneratedMessage('');
                    }}
                    className={`py-1 px-3 rounded text-xs font-medium transition-all ${
                      inputMode === 'guided' 
                        ? 'bg-white text-blue-600 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Guided
                  </button>
                  <button
                    onClick={() => {
                      setInputMode('freeform');
                      setSituation('');
                      setNotes('');
                      setGeneratedMessage('');
                    }}
                    className={`py-1 px-3 rounded text-xs font-medium transition-all ${
                      inputMode === 'freeform' 
                        ? 'bg-white text-blue-600 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Free Text
                  </button>
                </div>
              </div>

              {/* Context Toggle */}
              <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
                <button
                  onClick={() => setContext('family')}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                    context === 'family' 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Users className="h-4 w-4" />
                  Family Communication
                </button>
                <button
                  onClick={() => setContext('referral')}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                    context === 'referral' 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Building2 className="h-4 w-4" />
                  Referral Sources
                </button>
              </div>

              {inputMode === 'guided' ? (
                <>
                  {/* Situation Selection */}
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      What's the situation?
                    </label>
                    <select
                      value={situation}
                      onChange={(e) => setSituation(e.target.value)}
                      className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer hover:border-gray-400 transition-colors"
                    >
                      <option value="" className="text-gray-500">Select a situation...</option>
                      {(context === 'family' ? familySituations : referralSituations).map(sit => (
                        <option key={sit.value} value={sit.value} className="text-gray-900">
                          {sit.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Additional Notes */}
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Any specific details? (Optional)
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder={
                        context === 'family'
                          ? "e.g., Patient is 85yo mother with dementia, family is conflicted about hospice..."
                          : "e.g., Met Dr. Smith at conference last week, she seemed interested in our COPD program..."
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 h-20 resize-none bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </>
              ) : (
                /* Free Text Mode */
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    What do you need help with?
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={
                      context === 'family'
                        ? "Describe the family situation and what kind of message you need help writing..."
                        : "Describe the referral source context and what message you need to craft..."
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 h-32 resize-none bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    autoFocus
                  />
                </div>
              )}

              {/* Generate Button */}
              <Button
                onClick={handleGenerate}
                disabled={
                  loading || 
                  (inputMode === 'guided' && !situation) || 
                  (inputMode === 'freeform' && !notes.trim())
                }
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Message
                  </>
                )}
              </Button>

              {/* Generated Message */}
              {generatedMessage && (
                <div className="space-y-3 bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-900">Generated Message:</label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopy}
                      className="gap-2 bg-white hover:bg-gray-50 text-gray-700 border-gray-300"
                    >
                      {copied ? (
                        <>
                          <Check className="h-3 w-3 text-green-600" />
                          <span className="text-green-600">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                  
                  <div className="bg-white border-2 border-gray-300 rounded-lg p-4 shadow-sm">
                    <p className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">{generatedMessage}</p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="default"
                      onClick={handleUseMessage}
                      className="flex-1 gap-2"
                      title="Copy to clipboard and close"
                    >
                      <Copy className="h-4 w-4" />
                      Use This Message
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleGenerate}
                      className="flex-1"
                    >
                      Try Again
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 text-center mt-2">
                    "Use This Message" copies to clipboard and closes this window
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AIQuickHelp; 