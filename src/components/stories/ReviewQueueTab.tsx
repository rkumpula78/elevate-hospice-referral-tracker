import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { BookOpen, MessageSquare, Lightbulb, Check, X, Eye } from 'lucide-react';
import { MultiSelect } from '@/components/ui/multi-select';

const SUBMISSION_ICONS: Record<string, React.ReactNode> = {
  patient_story: <BookOpen className="w-4 h-4 text-teal-600" />,
  family_feedback: <MessageSquare className="w-4 h-4 text-blue-600" />,
  content_idea: <Lightbulb className="w-4 h-4 text-amber-600" />,
};

const TAG_OPTIONS = [
  'family-centered', 'caregiver-support', 'snf-placement', 'early-enrollment',
  'bereavement', 'psychiatric-support', 'veteran', 'pain-management',
  'spiritual-care', 'respite-care',
];

const SOURCE_OPTIONS = ['google_review', 'bereavement_call', 'family_submission', 'staff_observed', 'other'];
const SOURCE_LABELS: Record<string, string> = {
  google_review: 'Google Review', bereavement_call: 'Bereavement Call',
  family_submission: 'Family Submission', staff_observed: 'Staff Observed', other: 'Other',
};

const ReviewQueueTab = () => {
  const queryClient = useQueryClient();
  const [reviewingSubmission, setReviewingSubmission] = useState<any | null>(null);
  const [reviewerNotes, setReviewerNotes] = useState('');
  const [creatingStory, setCreatingStory] = useState(false);

  // Story creation form
  const [storyForm, setStoryForm] = useState({
    patient_alias: '', quote_short: '', quote_full: '', source: 'staff_observed',
    consent_status: 'pending_consent', tags: [] as string[], staff_mentioned: '',
    notes: '',
  });

  // Fetch new submissions
  const { data: submissions = [] } = useQuery({
    queryKey: ['story-submissions', 'new'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('story_submissions')
        .select('*')
        .eq('status', 'new')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch in_review stories
  const { data: pendingStories = [] } = useQuery({
    queryKey: ['stories-in-review'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .eq('status', 'in_review')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const declineMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      const { error } = await supabase.from('story_submissions')
        .update({ status: 'declined', reviewer_notes: notes } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['story-submissions'] });
      queryClient.invalidateQueries({ queryKey: ['story-submissions-count'] });
      setReviewingSubmission(null);
      toast.success('Submission declined');
    },
  });

  const createStoryMutation = useMutation({
    mutationFn: async (submissionId: string) => {
      // Create the story
      const { error: storyErr } = await supabase.from('stories').insert({
        patient_alias: storyForm.patient_alias || null,
        quote_short: storyForm.quote_short || null,
        quote_full: storyForm.quote_full || null,
        source: storyForm.source as any,
        consent_status: storyForm.consent_status as any,
        tags: storyForm.tags,
        staff_mentioned: storyForm.staff_mentioned ? storyForm.staff_mentioned.split(',').map(s => s.trim()) : [],
        notes: storyForm.notes || null,
        submitted_by: reviewingSubmission?.submitted_by || null,
        status: 'in_review' as any,
      });
      if (storyErr) throw storyErr;

      // Update submission status
      const { error: subErr } = await supabase.from('story_submissions')
        .update({ status: 'approved', reviewer_notes: reviewerNotes } as any)
        .eq('id', submissionId);
      if (subErr) throw subErr;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['story-submissions'] });
      queryClient.invalidateQueries({ queryKey: ['story-submissions-count'] });
      queryClient.invalidateQueries({ queryKey: ['stories-in-review'] });
      setReviewingSubmission(null);
      setCreatingStory(false);
      toast.success('Story created and submission approved');
    },
  });

  const approveStoryMutation = useMutation({
    mutationFn: async (storyId: string) => {
      const { error } = await supabase.from('stories')
        .update({ status: 'approved' as any })
        .eq('id', storyId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stories-in-review'] });
      queryClient.invalidateQueries({ queryKey: ['stories-approved'] });
      toast.success('Story approved and published');
    },
  });

  const draftStoryMutation = useMutation({
    mutationFn: async (storyId: string) => {
      const { error } = await supabase.from('stories')
        .update({ status: 'draft' as any })
        .eq('id', storyId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stories-in-review'] });
      toast.success('Story sent to draft');
    },
  });

  const openReview = (submission: any) => {
    setReviewingSubmission(submission);
    setReviewerNotes('');
    setCreatingStory(false);
    setStoryForm({
      patient_alias: submission.patient_alias || '',
      quote_short: submission.suggested_quote || '',
      quote_full: submission.story_notes || '',
      source: 'staff_observed',
      consent_status: submission.consent_obtained ? 'consent_on_file' : 'pending_consent',
      tags: [],
      staff_mentioned: submission.submitted_by || '',
      notes: '',
    });
  };

  return (
    <div className="space-y-8">
      {/* Section A: New Submissions */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          New Submissions
          {submissions.length > 0 && (
            <Badge variant="destructive" className="text-xs">{submissions.length}</Badge>
          )}
        </h3>

        {submissions.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              No new submissions to review.
            </CardContent>
          </Card>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Submitted By</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead className="hidden md:table-cell">Snippet</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((sub: any) => (
                  <TableRow key={sub.id}>
                    <TableCell>
                      <div>
                        <span className="font-medium text-sm">{sub.submitted_by}</span>
                        {sub.submitted_by_role && (
                          <span className="text-xs text-muted-foreground block">{sub.submitted_by_role}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{SUBMISSION_ICONS[sub.submission_type]}</TableCell>
                    <TableCell className="text-sm">{sub.patient_alias || '—'}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground max-w-[200px] truncate">
                      {sub.story_notes?.slice(0, 100)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(sub.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={() => openReview(sub)}>
                        <Eye className="w-3 h-3 mr-1" /> Review
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>

      {/* Section B: Stories Pending Approval */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Stories Pending Final Approval</h3>
        {pendingStories.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              No stories pending approval.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingStories.map((story: any) => (
              <Card key={story.id}>
                <CardContent className="p-5 space-y-3">
                  <h4 className="font-semibold">{story.patient_alias || 'Anonymous'}</h4>
                  {story.quote_short && (
                    <div className="border-l-4 border-teal-500 pl-3">
                      <p className="text-sm italic text-muted-foreground">"{story.quote_short}"</p>
                    </div>
                  )}
                  {story.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {story.tags.map((t: string) => (
                        <Badge key={t} variant="secondary" className="text-xs">{t.replace(/-/g, ' ')}</Badge>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => approveStoryMutation.mutate(story.id)}
                      disabled={approveStoryMutation.isPending}>
                      <Check className="w-3 h-3 mr-1" /> Approve & Publish
                    </Button>
                    <Button size="sm" variant="outline"
                      onClick={() => draftStoryMutation.mutate(story.id)}
                      disabled={draftStoryMutation.isPending}>
                      Send to Draft
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Review Modal */}
      <Dialog open={!!reviewingSubmission} onOpenChange={() => setReviewingSubmission(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review Submission</DialogTitle>
          </DialogHeader>

          {reviewingSubmission && !creatingStory && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground block">Submitted by</span>{reviewingSubmission.submitted_by} ({reviewingSubmission.submitted_by_role || '—'})</div>
                <div><span className="text-muted-foreground block">Type</span><span className="flex items-center gap-1">{SUBMISSION_ICONS[reviewingSubmission.submission_type]} {reviewingSubmission.submission_type.replace(/_/g, ' ')}</span></div>
                <div><span className="text-muted-foreground block">Patient</span>{reviewingSubmission.patient_alias || '—'}</div>
                <div><span className="text-muted-foreground block">Consent</span>{reviewingSubmission.consent_obtained ? 'Yes' : 'No / Not discussed'}</div>
              </div>

              <div>
                <span className="text-sm text-muted-foreground block mb-1">Story Notes</span>
                <p className="text-sm bg-muted/50 p-3 rounded-md whitespace-pre-wrap">{reviewingSubmission.story_notes || '—'}</p>
              </div>

              {reviewingSubmission.suggested_quote && (
                <div>
                  <span className="text-sm text-muted-foreground block mb-1">Suggested Quote</span>
                  <div className="border-l-4 border-teal-500 pl-3">
                    <p className="text-sm italic">"{reviewingSubmission.suggested_quote}"</p>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Reviewer Notes</Label>
                <Textarea value={reviewerNotes} onChange={e => setReviewerNotes(e.target.value)} rows={2} placeholder="Add any notes..." />
              </div>

              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={() => setCreatingStory(true)}>
                  <Check className="w-4 h-4 mr-1" /> Approve — Create Story
                </Button>
                <Button variant="destructive" onClick={() => declineMutation.mutate({ id: reviewingSubmission.id, notes: reviewerNotes })}>
                  <X className="w-4 h-4 mr-1" /> Decline
                </Button>
              </DialogFooter>
            </div>
          )}

          {reviewingSubmission && creatingStory && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Create a story from this submission. Edit the fields below before saving.</p>

              <div className="space-y-2">
                <Label>Patient Alias</Label>
                <Input value={storyForm.patient_alias} onChange={e => setStoryForm(f => ({ ...f, patient_alias: e.target.value }))} />
              </div>

              <div className="space-y-2">
                <Label>Pull Quote (short)</Label>
                <Textarea value={storyForm.quote_short} onChange={e => setStoryForm(f => ({ ...f, quote_short: e.target.value }))} rows={2} />
              </div>

              <div className="space-y-2">
                <Label>Full Quote / Story</Label>
                <Textarea value={storyForm.quote_full} onChange={e => setStoryForm(f => ({ ...f, quote_full: e.target.value }))} rows={4} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Source</Label>
                  <Select value={storyForm.source} onValueChange={v => setStoryForm(f => ({ ...f, source: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SOURCE_OPTIONS.map(s => <SelectItem key={s} value={s}>{SOURCE_LABELS[s]}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Consent Status</Label>
                  <Select value={storyForm.consent_status} onValueChange={v => setStoryForm(f => ({ ...f, consent_status: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public_source">Public Source</SelectItem>
                      <SelectItem value="consent_on_file">Consent on File</SelectItem>
                      <SelectItem value="pending_consent">Pending Consent</SelectItem>
                      <SelectItem value="anonymous_approved">Anonymous Approved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tags</Label>
                <MultiSelect
                  options={TAG_OPTIONS.map(t => ({ label: t.replace(/-/g, ' '), value: t }))}
                  selected={storyForm.tags}
                  onChange={tags => setStoryForm(f => ({ ...f, tags }))}
                  placeholder="Select tags"
                />
              </div>

              <div className="space-y-2">
                <Label>Staff Mentioned (comma-separated)</Label>
                <Input value={storyForm.staff_mentioned} onChange={e => setStoryForm(f => ({ ...f, staff_mentioned: e.target.value }))} />
              </div>

              <div className="space-y-2">
                <Label>Internal Notes</Label>
                <Textarea value={storyForm.notes} onChange={e => setStoryForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
              </div>

              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button variant="outline" onClick={() => setCreatingStory(false)}>← Back</Button>
                <Button className="bg-teal-600 hover:bg-teal-700 text-white"
                  onClick={() => createStoryMutation.mutate(reviewingSubmission.id)}
                  disabled={createStoryMutation.isPending}>
                  {createStoryMutation.isPending ? 'Creating...' : 'Create Story & Approve'}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReviewQueueTab;
