import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { CheckCircle, BookOpen, MessageSquare, Lightbulb } from 'lucide-react';

const ROLES = ['RN', 'LPN', 'CNA', 'Social Work', 'Chaplain', 'Office', 'Marketing', 'NP/MD', 'Other'];

const SubmitStoryTab = () => {
  const { displayName } = useAuth();
  const queryClient = useQueryClient();
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState({
    submitted_by: displayName || '',
    submitted_by_role: '',
    submission_type: 'patient_story' as 'patient_story' | 'family_feedback' | 'content_idea',
    patient_alias: '',
    story_notes: '',
    suggested_quote: '',
    consent_obtained: null as boolean | null,
    extra_notes: '',
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('story_submissions').insert({
        submitted_by: form.submitted_by,
        submitted_by_role: form.submitted_by_role || null,
        submission_type: form.submission_type,
        patient_alias: form.patient_alias || null,
        story_notes: [form.story_notes, form.extra_notes].filter(Boolean).join('\n\n---\n\n'),
        suggested_quote: form.suggested_quote || null,
        consent_obtained: form.consent_obtained ?? false,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['story-submissions'] });
      queryClient.invalidateQueries({ queryKey: ['story-submissions-count'] });
      setSubmitted(true);
    },
    onError: (err: any) => {
      toast.error('Failed to submit: ' + (err.message || 'Unknown error'));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.submitted_by.trim()) { toast.error('Please enter your name'); return; }
    if (!form.story_notes.trim()) { toast.error('Please describe what happened'); return; }
    mutation.mutate();
  };

  const resetForm = () => {
    setForm({
      submitted_by: displayName || '',
      submitted_by_role: '',
      submission_type: 'patient_story',
      patient_alias: '',
      story_notes: '',
      suggested_quote: '',
      consent_obtained: null,
      extra_notes: '',
    });
    setSubmitted(false);
  };

  if (submitted) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-8 text-center space-y-4">
          <CheckCircle className="w-16 h-16 mx-auto text-green-500" />
          <h2 className="text-2xl font-semibold text-foreground">Thank you!</h2>
          <p className="text-muted-foreground">
            Your submission has been received. Our team will review it and may follow up with you.
          </p>
          <Button onClick={resetForm} variant="outline">Submit Another Story</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-xl">Share a Story</CardTitle>
        <p className="text-sm text-muted-foreground">
          Did a family say something that stuck with you? Did you witness a moment worth remembering?
          Share it here — our team will follow up and handle the rest.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Your name *</Label>
            <Input id="name" value={form.submitted_by} onChange={e => setForm(f => ({ ...f, submitted_by: e.target.value }))} required />
          </div>

          {/* Role */}
          <div className="space-y-2">
            <Label>Your role</Label>
            <Select value={form.submitted_by_role} onValueChange={v => setForm(f => ({ ...f, submitted_by_role: v }))}>
              <SelectTrigger><SelectValue placeholder="Select your role" /></SelectTrigger>
              <SelectContent>
                {ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Submission Type */}
          <div className="space-y-3">
            <Label>What type of submission is this? *</Label>
            <RadioGroup value={form.submission_type} onValueChange={(v: any) => setForm(f => ({ ...f, submission_type: v }))}>
              <div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="patient_story" id="patient_story" className="mt-0.5" />
                <label htmlFor="patient_story" className="cursor-pointer">
                  <div className="flex items-center gap-2 font-medium text-sm">
                    <BookOpen className="w-4 h-4 text-teal-600" /> A patient or family story I witnessed or heard
                  </div>
                </label>
              </div>
              <div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="family_feedback" id="family_feedback" className="mt-0.5" />
                <label htmlFor="family_feedback" className="cursor-pointer">
                  <div className="flex items-center gap-2 font-medium text-sm">
                    <MessageSquare className="w-4 h-4 text-teal-600" /> Feedback a family shared with me directly
                  </div>
                </label>
              </div>
              <div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="content_idea" id="content_idea" className="mt-0.5" />
                <label htmlFor="content_idea" className="cursor-pointer">
                  <div className="flex items-center gap-2 font-medium text-sm">
                    <Lightbulb className="w-4 h-4 text-teal-600" /> A content idea (not a specific story)
                  </div>
                </label>
              </div>
            </RadioGroup>
          </div>

          {/* Patient Alias */}
          <div className="space-y-2">
            <Label htmlFor="alias">Patient alias (optional)</Label>
            <Input
              id="alias"
              value={form.patient_alias}
              onChange={e => setForm(f => ({ ...f, patient_alias: e.target.value }))}
              placeholder="e.g., 'Gene, age 100' or 'a patient I cared for in Glendale'"
            />
            <p className="text-xs text-muted-foreground">First name or a brief description only — no last names or identifiers.</p>
          </div>

          {/* Story Notes */}
          <div className="space-y-2">
            <Label htmlFor="story">Tell us what happened *</Label>
            <Textarea
              id="story"
              value={form.story_notes}
              onChange={e => setForm(f => ({ ...f, story_notes: e.target.value }))}
              rows={5}
              required
              placeholder="e.g., 'The patient's daughter told me after her dad passed that she had never felt so supported…'"
            />
            <p className="text-xs text-muted-foreground">Describe what you observed or heard. Direct quotes are gold — write them exactly if you can.</p>
          </div>

          {/* Suggested Quote */}
          <div className="space-y-2">
            <Label htmlFor="quote">Any direct quote from the family? (optional)</Label>
            <Textarea
              id="quote"
              value={form.suggested_quote}
              onChange={e => setForm(f => ({ ...f, suggested_quote: e.target.value }))}
              rows={3}
              placeholder="If you remember their exact words, write them here."
            />
          </div>

          {/* Consent */}
          <div className="space-y-3">
            <Label>Did the family express willingness to share their story?</Label>
            <RadioGroup
              value={form.consent_obtained === true ? 'yes' : form.consent_obtained === false ? 'no' : 'unknown'}
              onValueChange={v => setForm(f => ({ ...f, consent_obtained: v === 'yes' ? true : v === 'no' ? false : null }))}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="consent-yes" />
                <label htmlFor="consent-yes" className="text-sm cursor-pointer">Yes</label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="consent-no" />
                <label htmlFor="consent-no" className="text-sm cursor-pointer">No</label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="unknown" id="consent-unknown" />
                <label htmlFor="consent-unknown" className="text-sm cursor-pointer">Didn't come up</label>
              </div>
            </RadioGroup>
            {form.consent_obtained === true && (
              <p className="text-xs text-green-600 bg-green-50 p-2 rounded">
                Great — our team will reach out to them with a consent form.
              </p>
            )}
          </div>

          {/* Extra Notes */}
          <div className="space-y-2">
            <Label htmlFor="extra">Anything else we should know? (optional)</Label>
            <Textarea
              id="extra"
              value={form.extra_notes}
              onChange={e => setForm(f => ({ ...f, extra_notes: e.target.value }))}
              rows={2}
            />
          </div>

          <Button type="submit" disabled={mutation.isPending} className="w-full bg-teal-600 hover:bg-teal-700 text-white">
            {mutation.isPending ? 'Submitting...' : 'Submit Story →'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default SubmitStoryTab;
