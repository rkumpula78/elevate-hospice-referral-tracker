import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
}

const displayName = (p: Profile) =>
  `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim() || (p.email ?? 'Unknown');

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Highlight @mentions in displayed note text (capitalized one/two-word tokens).
export const highlightMentions = (text: string): React.ReactNode => {
  const parts = text.split(/(@[A-Za-z][\w'-]*(?:\s[A-Z][\w'-]*)?)/g);
  return parts.map((part, i) =>
    part.startsWith('@')
      ? <span key={i} className="font-semibold text-blue-600">{part}</span>
      : <React.Fragment key={i}>{part}</React.Fragment>
  );
};

interface MentionTextareaProps {
  value: string;
  onChange: (value: string) => void;
  onMentionsChange?: (userIds: string[]) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
  id?: string;
}

const MentionTextarea = ({ value, onChange, onMentionsChange, placeholder, rows = 3, className, id }: MentionTextareaProps) => {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [query, setQuery] = useState<string | null>(null);

  const { data: profiles = [] } = useQuery({
    queryKey: ['mentionable-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email');
      if (error) throw error;
      return data as Profile[];
    },
  });

  // Derive mentioned user IDs from the text itself (robust to edits/deletes)
  useEffect(() => {
    if (!onMentionsChange) return;
    const ids = profiles
      .filter(p => new RegExp(`@${escapeRegExp(displayName(p))}(?!\\w)`).test(value))
      .map(p => p.id);
    onMentionsChange([...new Set(ids)]);
  }, [value, profiles, onMentionsChange]);

  const suggestions = useMemo(() => {
    if (query === null) return [];
    const q = query.toLowerCase();
    return profiles
      .filter(p => displayName(p).toLowerCase().includes(q) || (p.email ?? '').toLowerCase().includes(q))
      .slice(0, 6);
  }, [query, profiles]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    onChange(text);
    const beforeCaret = text.slice(0, e.target.selectionStart ?? text.length);
    const match = beforeCaret.match(/@(\w*)$/);
    setQuery(match ? match[1] : null);
  };

  const insertMention = (p: Profile) => {
    const el = ref.current;
    const caret = el?.selectionStart ?? value.length;
    const before = value.slice(0, caret).replace(/@(\w*)$/, `@${displayName(p)} `);
    const after = value.slice(caret);
    const newValue = before + after;
    onChange(newValue);
    setQuery(null);
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(before.length, before.length);
    });
  };

  return (
    <div className="relative">
      <Textarea
        id={id}
        ref={ref}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        rows={rows}
        className={className}
        onBlur={() => setTimeout(() => setQuery(null), 150)}
      />
      {suggestions.length > 0 && (
        <div className={cn(
          'absolute z-50 mt-1 w-full max-w-xs rounded-md border bg-popover shadow-md',
          'max-h-48 overflow-y-auto'
        )}>
          {suggestions.map(p => (
            <button
              key={p.id}
              type="button"
              className="flex w-full flex-col items-start px-3 py-2 text-left text-sm hover:bg-accent"
              onMouseDown={(e) => { e.preventDefault(); insertMention(p); }}
            >
              <span className="font-medium">{displayName(p)}</span>
              {p.email && <span className="text-xs text-muted-foreground">{p.email}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default MentionTextarea;
