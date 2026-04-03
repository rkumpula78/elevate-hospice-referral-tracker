import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Search, Plus, Star, Phone, Users, Check, X, User } from 'lucide-react';
import { MultiSelect } from '@/components/ui/multi-select';

const TAG_OPTIONS = [
  'family-centered', 'caregiver-support', 'snf-placement', 'early-enrollment',
  'bereavement', 'psychiatric-support', 'veteran', 'pain-management',
  'spiritual-care', 'respite-care',
];

const SOURCE_LABELS: Record<string, { label: string; icon: React.ReactNode }> = {
  google_review: { label: 'Google Review', icon: <Star className="w-3 h-3" /> },
  bereavement_call: { label: 'Bereavement Call', icon: <Phone className="w-3 h-3" /> },
  family_submission: { label: 'Family Submission', icon: <Users className="w-3 h-3" /> },
  staff_observed: { label: 'Staff Observed', icon: <User className="w-3 h-3" /> },
  other: { label: 'Other', icon: null },
};

const ASSET_TYPES = ['blog', 'linkedin', 'snf_leave_behind', 'physician_packet', 'facebook', 'youtube_script'];
const ASSET_LABELS: Record<string, string> = {
  blog: 'Blog', linkedin: 'LinkedIn', snf_leave_behind: 'SNF',
  physician_packet: 'MD Packet', facebook: 'Facebook', youtube_script: 'YouTube',
};

const TAG_COLORS: Record<string, string> = {
  'family-centered': 'bg-teal-100 text-teal-800', 'caregiver-support': 'bg-teal-100 text-teal-800',
  'snf-placement': 'bg-blue-100 text-blue-800', 'early-enrollment': 'bg-blue-100 text-blue-800',
  'bereavement': 'bg-teal-100 text-teal-800', 'veteran': 'bg-amber-100 text-amber-800',
  'psychiatric-support': 'bg-teal-100 text-teal-800', 'pain-management': 'bg-teal-100 text-teal-800',
  'spiritual-care': 'bg-teal-100 text-teal-800', 'respite-care': 'bg-blue-100 text-blue-800',
};

interface StoryLibraryTabProps {
  onSubmitClick: () => void;
}

const StoryLibraryTab = ({ onSubmitClick }: StoryLibraryTabProps) => {
  const [search, setSearch] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sourceFilter, setSourceFilter] = useState<string>('');
  const [selectedStory, setSelectedStory] = useState<any | null>(null);

  const { data: stories = [], isLoading } = useQuery({
    queryKey: ['stories-approved'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const filtered = stories.filter((s: any) => {
    const q = search.toLowerCase();
    const matchSearch = !q || [s.patient_alias, s.quote_short, s.quote_full, ...(s.staff_mentioned || [])]
      .filter(Boolean).some((v: string) => v.toLowerCase().includes(q));
    const matchTags = selectedTags.length === 0 || selectedTags.some(t => (s.tags || []).includes(t));
    const matchSource = !sourceFilter || s.source === sourceFilter;
    return matchSearch && matchTags && matchSource;
  });

  const clearFilters = () => { setSearch(''); setSelectedTags([]); setSourceFilter(''); };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">
            Approved patient and family stories — ready to use in referral materials, leave-behinds, and social media.
          </p>
        </div>
        <Button onClick={onSubmitClick} className="bg-teal-600 hover:bg-teal-700 text-white shrink-0">
          <Plus className="w-4 h-4 mr-2" /> Submit a Story
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search stories..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <MultiSelect
          options={TAG_OPTIONS.map(t => ({ label: t.replace(/-/g, ' '), value: t }))}
          selected={selectedTags}
          onChange={setSelectedTags}
          placeholder="Filter by tag"
          className="min-w-[160px]"
        />
        <select
          value={sourceFilter}
          onChange={e => setSourceFilter(e.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">All Sources</option>
          {Object.entries(SOURCE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
        {(search || selectedTags.length > 0 || sourceFilter) && (
          <button onClick={clearFilters} className="text-sm text-muted-foreground hover:text-foreground underline">
            Clear filters
          </button>
        )}
      </div>

      {/* Story Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="animate-pulse"><CardContent className="p-6 h-48" /></Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <BookOpenIcon className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No stories yet</h3>
            <p className="text-muted-foreground mb-4">Be the first to submit one — every story makes a difference.</p>
            <Button onClick={onSubmitClick} variant="outline">Submit a Story</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((story: any) => (
            <StoryCard key={story.id} story={story} onClick={() => setSelectedStory(story)} />
          ))}
        </div>
      )}

      {/* Detail Drawer */}
      <Sheet open={!!selectedStory} onOpenChange={() => setSelectedStory(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selectedStory && <StoryDetail story={selectedStory} />}
        </SheetContent>
      </Sheet>
    </div>
  );
};

const BookOpenIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
  </svg>
);

const StoryCard = ({ story, onClick }: { story: any; onClick: () => void }) => {
  const assets = (story.assets || {}) as Record<string, boolean>;
  const source = SOURCE_LABELS[story.source] || SOURCE_LABELS.other;

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={onClick}>
      <CardContent className="p-5 space-y-3">
        <h3 className="font-semibold text-foreground text-lg">{story.patient_alias || 'Anonymous'}</h3>
        
        {story.quote_short && (
          <div className="border-l-4 border-teal-500 pl-3">
            <p className="text-sm italic text-muted-foreground">"{story.quote_short}"</p>
          </div>
        )}

        {story.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {story.tags.map((tag: string) => (
              <Badge key={tag} variant="secondary" className={`text-xs ${TAG_COLORS[tag] || 'bg-muted text-muted-foreground'}`}>
                {tag.replace(/-/g, ' ')}
              </Badge>
            ))}
          </div>
        )}

        {story.staff_mentioned?.length > 0 && (
          <p className="text-xs text-muted-foreground">
            <User className="w-3 h-3 inline mr-1" />
            {story.staff_mentioned.join(', ')}
          </p>
        )}

        <div className="flex items-center gap-1.5 flex-wrap">
          {ASSET_TYPES.map(a => (
            <Badge key={a} variant="outline" className={`text-[10px] px-1.5 py-0.5 ${assets[a] ? 'border-green-500 text-green-700 bg-green-50' : 'border-muted text-muted-foreground'}`}>
              {assets[a] ? <Check className="w-2.5 h-2.5 mr-0.5" /> : <X className="w-2.5 h-2.5 mr-0.5" />}
              {ASSET_LABELS[a]}
            </Badge>
          ))}
        </div>

        <div className="flex items-center justify-between pt-1">
          <Button variant="ghost" size="sm" className="text-teal-600 hover:text-teal-700 p-0 h-auto text-xs">
            View Full Story →
          </Button>
          <Badge variant="outline" className="text-[10px] gap-1">
            {source.icon} {source.label}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};

const StoryDetail = ({ story }: { story: any }) => {
  const assets = (story.assets || {}) as Record<string, boolean>;
  const source = SOURCE_LABELS[story.source] || SOURCE_LABELS.other;

  const consentLabels: Record<string, string> = {
    public_source: 'Public Source (no consent needed)',
    consent_on_file: 'Consent on File',
    pending_consent: 'Pending Consent',
    anonymous_approved: 'Anonymous — Approved',
  };

  return (
    <div className="space-y-6">
      <SheetHeader>
        <SheetTitle className="text-xl">{story.patient_alias || 'Anonymous'}</SheetTitle>
      </SheetHeader>

      {story.quote_full && (
        <div className="border-l-4 border-teal-500 pl-4 py-2">
          <p className="italic text-muted-foreground leading-relaxed">"{story.quote_full}"</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-muted-foreground block">Date</span>
          <span>{story.story_date ? new Date(story.story_date).toLocaleDateString() : '—'}</span>
        </div>
        <div>
          <span className="text-muted-foreground block">Source</span>
          <span className="flex items-center gap-1">{source.icon} {source.label}</span>
        </div>
        <div>
          <span className="text-muted-foreground block">Consent</span>
          <span>{consentLabels[story.consent_status] || story.consent_status}</span>
        </div>
        <div>
          <span className="text-muted-foreground block">Submitted by</span>
          <span>{story.submitted_by || '—'}</span>
        </div>
      </div>

      {story.tags?.length > 0 && (
        <div>
          <span className="text-sm text-muted-foreground block mb-2">Tags</span>
          <div className="flex flex-wrap gap-1.5">
            {story.tags.map((tag: string) => (
              <Badge key={tag} variant="secondary" className={`text-xs ${TAG_COLORS[tag] || ''}`}>
                {tag.replace(/-/g, ' ')}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {story.staff_mentioned?.length > 0 && (
        <div>
          <span className="text-sm text-muted-foreground block mb-1">Staff Mentioned</span>
          <p className="text-sm">{story.staff_mentioned.join(', ')}</p>
        </div>
      )}

      <div>
        <span className="text-sm text-muted-foreground block mb-2">Assets</span>
        <div className="space-y-2">
          {ASSET_TYPES.map(a => (
            <div key={a} className="flex items-center justify-between py-1.5 px-3 rounded-md bg-muted/50">
              <span className="text-sm font-medium">{ASSET_LABELS[a]}</span>
              {assets[a] ? (
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="text-xs text-green-600">Generated</span>
                </div>
              ) : (
                <span className="text-xs text-muted-foreground">Not yet generated</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StoryLibraryTab;
