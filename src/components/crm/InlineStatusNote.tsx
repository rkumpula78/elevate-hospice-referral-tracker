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
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { setDraft(value || ''); }, [value]);
  useEffect(() => { if (editing) ref.current?.focus(); }, [editing]);

  const save = async () => {
    if ((draft || '') === (value || '')) {
      setEditing(false);
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from('referrals')
      .update({ patient_status_note: draft || null } as any)
      .eq('id', referralId);
    setSaving(false);
    if (error) {
      toast({ title: 'Failed to save status', description: error.message, variant: 'destructive' });
      return;
    }
    invalidateKeys.forEach((k) => queryClient.invalidateQueries({ queryKey: k }));
    toast({ title: '✅ Status updated' });
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-start gap-1" onClick={(e) => e.stopPropagation()}>
        <Textarea
          ref={ref}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); save(); }
            if (e.key === 'Escape') { setDraft(value || ''); setEditing(false); }
          }}
          rows={2}
          className="min-h-[44px] text-sm resize-y"
          placeholder={placeholder}
        />
        <div className="pt-1">
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" /> : <Check className="w-3.5 h-3.5 text-muted-foreground" />}
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
