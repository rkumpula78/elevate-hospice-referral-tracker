import React, { useEffect, useRef, useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Pencil, Check, Loader2 } from 'lucide-react';

interface InlineStatusNoteProps {
  referralId: string;
  value: string | null | undefined;
  invalidateKeys?: string[][];
  placeholder?: string;
}

// Helper: run an async fn with one retry on transient network errors
async function withNetworkRetry<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err: any) {
    const msg = String(err?.message || err || '');
    if (/failed to fetch|network|aborted|load failed/i.test(msg)) {
      await new Promise((r) => setTimeout(r, 600));
      return await fn();
    }
    throw err;
  }
}

const InlineStatusNote: React.FC<InlineStatusNoteProps> = ({
  referralId,
  value,
  invalidateKeys = [],
  placeholder = 'Click to add status…',
}) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || '');
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string>(value || '');
  const ref = useRef<HTMLTextAreaElement>(null);
  const debounceRef = useRef<number | null>(null);
  const inFlightRef = useRef<boolean>(false);

  useEffect(() => {
    setDraft(value || '');
    setLastSaved(value || '');
  }, [value]);
  useEffect(() => { if (editing) ref.current?.focus(); }, [editing]);

  const persist = async (text: string): Promise<boolean> => {
    if (text === lastSaved) return true;
    if (inFlightRef.current) return false;
    inFlightRef.current = true;
    setSaving(true);
    try {
      const result = await withNetworkRetry(async () => {
        const { error } = await supabase
          .from('referrals')
          .update({ patient_status_note: text || null } as any)
          .eq('id', referralId);
        if (error) throw error;
      });
      void result;
      setLastSaved(text);
      invalidateKeys.forEach((k) => queryClient.invalidateQueries({ queryKey: k }));
      return true;
    } catch (error: any) {
      toast({
        title: 'Failed to save status',
        description: (error?.message || 'Please try again.') + ' Your text is preserved — click into the field and press Enter to retry.',
        variant: 'destructive',
      });
      return false;
    } finally {
      inFlightRef.current = false;
      setSaving(false);
    }
  };

  // Debounced auto-save while typing so saves complete even if the user clicks elsewhere
  useEffect(() => {
    if (!editing) return;
    if (draft === lastSaved) return;
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      void persist(draft);
    }, 700);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, editing]);

  const handleBlurSave = async () => {
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    const ok = await persist(draft);
    if (ok) {
      if (draft !== value) toast({ title: '✅ Status updated' });
      setEditing(false);
    }
  };

  const MAX = 50;

  if (editing) {
    return (
      <div className="flex items-start gap-1" onClick={(e) => e.stopPropagation()}>
        <div className="flex-1">
          <Textarea
            ref={ref}
            value={draft}
            onChange={(e) => setDraft(e.target.value.slice(0, MAX))}
            onBlur={handleBlurSave}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void handleBlurSave(); }
              if (e.key === 'Escape') { setDraft(lastSaved); setEditing(false); }
            }}
            rows={2}
            maxLength={MAX}
            className="min-h-[44px] text-sm resize-none"
            placeholder={placeholder}
          />
          <p className={`text-[10px] mt-0.5 text-right ${draft.length >= MAX ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
            {draft.length}/{MAX}
          </p>
        </div>
        <div className="pt-1">
          {saving
            ? <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
            : draft === lastSaved
              ? <Check className="w-3.5 h-3.5 text-green-600" />
              : <Check className="w-3.5 h-3.5 text-muted-foreground" />}
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); setEditing(true); }}
      className="group w-full text-left text-sm rounded px-1.5 py-1 hover:bg-muted/60 transition min-h-[28px] flex items-start gap-1.5"
      title="Click to edit status"
    >
      <span className={`flex-1 whitespace-pre-wrap ${value ? 'text-foreground' : 'text-muted-foreground italic'}`}>
        {value || placeholder}
      </span>
      <Pencil className="w-3 h-3 mt-0.5 opacity-0 group-hover:opacity-60 shrink-0" />
    </button>
  );
};

export default InlineStatusNote;
