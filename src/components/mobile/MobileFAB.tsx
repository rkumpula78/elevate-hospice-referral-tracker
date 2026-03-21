import React, { useState } from 'react';
import { Plus, X, Pencil, MapPin, UserPlus } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { QuickNoteSheet } from './QuickNoteSheet';
import AddReferralDialog from '../crm/AddReferralDialog';
import { useLocation } from 'react-router-dom';

export function MobileFAB() {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
  const [showQuickNote, setShowQuickNote] = useState(false);
  const [showAddReferral, setShowAddReferral] = useState(false);
  const location = useLocation();

  if (!isMobile) return null;

  // Extract org ID if on org detail page
  const orgMatch = location.pathname.match(/^\/organizations\/([^/]+)$/);
  const prefilledOrgId = orgMatch ? orgMatch[1] : undefined;

  const handleAction = (action: 'note' | 'visit' | 'referral') => {
    setIsOpen(false);
    if (action === 'note' || action === 'visit') {
      setShowQuickNote(true);
    } else if (action === 'referral') {
      setShowAddReferral(true);
    }
  };

  const speedDialItems = [
    { key: 'referral' as const, icon: UserPlus, label: 'Add Referral', color: 'bg-primary' },
    { key: 'visit' as const, icon: MapPin, label: 'Log Visit', color: 'bg-emerald-600' },
    { key: 'note' as const, icon: Pencil, label: 'Quick Note', color: 'bg-amber-600' },
  ];

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 animate-in fade-in duration-200"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Speed dial options */}
      <div className={cn("fixed bottom-20 right-4 z-50 flex flex-col-reverse items-end gap-3", !isOpen && "pointer-events-none")}>
        {isOpen && speedDialItems.map((item, i) => (
          <button
            key={item.key}
            onClick={() => handleAction(item.key)}
            className={cn(
              "flex items-center gap-3 animate-in slide-in-from-bottom-2 fade-in duration-200",
            )}
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <span className="bg-card text-card-foreground text-sm font-medium px-3 py-1.5 rounded-lg shadow-lg border border-border whitespace-nowrap">
              {item.label}
            </span>
            <div className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center shadow-lg text-white",
              item.color
            )}>
              <item.icon className="w-5 h-5" />
            </div>
          </button>
        ))}

        {/* Main FAB */}
        <button
          onClick={() => setIsOpen(prev => !prev)}
          className={cn(
            "w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-transform duration-200 bg-primary text-primary-foreground",
            isOpen && "rotate-45"
          )}
          aria-label={isOpen ? "Close menu" : "Quick actions"}
        >
          {isOpen ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
        </button>
      </div>

      <QuickNoteSheet
        open={showQuickNote}
        onOpenChange={setShowQuickNote}
        prefilledOrgId={prefilledOrgId}
      />

      <AddReferralDialog
        open={showAddReferral}
        onOpenChange={setShowAddReferral}
      />
    </>
  );
}
