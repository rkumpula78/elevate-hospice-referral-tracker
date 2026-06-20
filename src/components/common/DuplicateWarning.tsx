import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import type { DuplicateMatch } from '@/hooks/useDuplicateCheck';

interface DuplicateWarningProps {
  matches: DuplicateMatch[];
  entity: string; // e.g. "organization" or "referral"
  getHref: (id: string) => string;
  /** Called when a user clicks an existing match (e.g. to close the dialog). */
  onOpenExisting?: () => void;
}

/**
 * Non-blocking duplicate warning. Shows possible existing records so the user
 * can open one instead of creating a duplicate. Renders nothing when there are
 * no matches.
 */
const DuplicateWarning = ({ matches, entity, getHref, onOpenExisting }: DuplicateWarningProps) => {
  if (!matches || matches.length === 0) return null;

  return (
    <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
      <div className="flex items-center gap-2 font-medium">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        Possible duplicate {entity}{matches.length > 1 ? 's' : ''} found
      </div>
      <ul className="mt-1.5 space-y-1">
        {matches.map((m) => (
          <li key={m.id} className="flex items-center justify-between gap-2">
            <span className="truncate">
              {m.label}
              {m.sublabel && <span className="text-amber-700"> — {m.sublabel}</span>}
            </span>
            <Link
              to={getHref(m.id)}
              onClick={onOpenExisting}
              className="shrink-0 font-semibold text-amber-800 underline hover:text-amber-950"
            >
              Open
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-1.5 text-xs text-amber-700">
        You can still continue if this is a new {entity}.
      </p>
    </div>
  );
};

export default DuplicateWarning;
