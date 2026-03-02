import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Info } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const ratingDetails: Record<string, { label: string; color: string; description: string }> = {
  A: { label: 'A', color: 'bg-green-100 text-green-800 border-green-300', description: 'Top Partner: 10+ referrals/year, strong relationship' },
  B: { label: 'B', color: 'bg-blue-100 text-blue-800 border-blue-300', description: 'Growing: 5-10 referrals/year, regular visits' },
  C: { label: 'C', color: 'bg-amber-100 text-amber-800 border-amber-300', description: 'Developing: 1-4 referrals/year, building relationship' },
  D: { label: 'D', color: 'bg-gray-100 text-gray-800 border-gray-300', description: 'New/Low: No referrals yet, needs nurturing' },
  P: { label: 'P', color: 'bg-purple-100 text-purple-800 border-purple-300', description: 'Prospect: Not yet rated' },
};

interface AccountRatingBadgeProps {
  rating: string | null;
  showInfo?: boolean;
}

export const getRatingColor = (rating: string | null) => {
  return ratingDetails[rating || 'C']?.color || ratingDetails.C.color;
};

export const AccountRatingBadge = ({ rating, showInfo = false }: AccountRatingBadgeProps) => {
  const key = rating || 'C';
  const detail = ratingDetails[key] || ratingDetails.C;

  return (
    <div className="flex items-center gap-1">
      <Badge className={`font-bold ${detail.color}`}>{detail.label}</Badge>
      {showInfo && (
        <Popover>
          <PopoverTrigger asChild>
            <button type="button" className="text-muted-foreground hover:text-foreground transition-colors">
              <Info className="w-3.5 h-3.5" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3" align="start">
            <p className="text-sm font-semibold mb-2">Account Rating Guide</p>
            <ul className="space-y-1.5 text-xs">
              {Object.entries(ratingDetails).filter(([k]) => k !== 'P').map(([k, v]) => (
                <li key={k} className="flex items-start gap-2">
                  <Badge className={`${v.color} text-[10px] px-1.5 py-0 shrink-0`}>{v.label}</Badge>
                  <span className="text-muted-foreground">{v.description}</span>
                </li>
              ))}
            </ul>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
};

export default AccountRatingBadge;
