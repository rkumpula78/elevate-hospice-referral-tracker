import React, { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import type { MapOrganization } from './useMapOrganizations';

interface MapSearchProps {
  organizations: MapOrganization[];
  onSelect: (org: MapOrganization) => void;
}

const MapSearch = ({ organizations, onSelect }: MapSearchProps) => {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const results = query.length >= 2
    ? organizations.filter(o => o.name.toLowerCase().includes(query.toLowerCase())).slice(0, 8)
    : [];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative w-64">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Search organizations..."
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          className="pl-8 h-9 text-sm bg-card"
        />
        {query && (
          <button onClick={() => { setQuery(''); setOpen(false); }} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      {open && results.length > 0 && (
        <div className="absolute top-full mt-1 w-full bg-card border rounded-lg shadow-lg max-h-60 overflow-y-auto z-50">
          {results.map(org => (
            <button
              key={org.id}
              className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50 flex items-center gap-2 border-b last:border-0"
              onClick={() => { onSelect(org); setQuery(org.name); setOpen(false); }}
            >
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ background: org.account_rating === 'A' ? '#22c55e' : org.account_rating === 'B' ? '#3b82f6' : org.account_rating === 'C' ? '#f59e0b' : '#9ca3af' }}
              />
              <span className="truncate">{org.name}</span>
              <span className="text-xs text-muted-foreground ml-auto shrink-0">{org.type}</span>
            </button>
          ))}
        </div>
      )}
      {open && query.length >= 2 && results.length === 0 && (
        <div className="absolute top-full mt-1 w-full bg-card border rounded-lg shadow-lg p-3 text-sm text-muted-foreground z-50">
          No organizations found
        </div>
      )}
    </div>
  );
};

export default MapSearch;
