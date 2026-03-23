import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SortHeader } from '@/components/ui/sort-header';
import { AccountRatingBadge } from '@/components/crm/AccountRatingBadge';
import type { MapOrganization } from './useMapOrganizations';

interface MapListViewProps {
  organizations: MapOrganization[];
}

const MapListView = ({ organizations }: MapListViewProps) => {
  const navigate = useNavigate();
  const [sort, setSort] = useState<{ field: string; direction: 'asc' | 'desc' } | null>(null);

  const handleSort = (field: string) => {
    setSort(prev =>
      prev?.field === field
        ? { field, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { field, direction: 'asc' }
    );
  };

  const sorted = [...organizations].sort((a, b) => {
    if (!sort) return 0;
    const dir = sort.direction === 'asc' ? 1 : -1;
    const f = sort.field as keyof MapOrganization;
    const va = a[f] ?? '';
    const vb = b[f] ?? '';
    if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir;
    return String(va).localeCompare(String(vb)) * dir;
  });

  const formatDate = (d: string | null) => {
    if (!d) return '—';
    const days = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    return `${days}d ago`;
  };

  const isOverdue = (d: string | null) => {
    if (!d) return true;
    return (Date.now() - new Date(d).getTime()) / 86400000 > 14;
  };

  return (
    <div className="bg-card border rounded-lg overflow-auto h-full">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead><SortHeader label="Name" field="name" currentSort={sort} onSort={handleSort} /></TableHead>
            <TableHead><SortHeader label="Type" field="type" currentSort={sort} onSort={handleSort} /></TableHead>
            <TableHead><SortHeader label="Rating" field="account_rating" currentSort={sort} onSort={handleSort} /></TableHead>
            <TableHead><SortHeader label="Last Visit" field="last_visit_date" currentSort={sort} onSort={handleSort} /></TableHead>
            <TableHead><SortHeader label="YTD Referrals" field="ytd_referrals" currentSort={sort} onSort={handleSort} /></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map(org => (
            <TableRow
              key={org.id}
              className="cursor-pointer"
              onClick={() => navigate(`/organizations/${org.id}`)}
            >
              <TableCell className="font-medium">{org.name}</TableCell>
              <TableCell className="text-muted-foreground">{org.type}</TableCell>
              <TableCell><AccountRatingBadge rating={org.account_rating} /></TableCell>
              <TableCell>
                <span className={isOverdue(org.last_visit_date) ? 'text-destructive font-medium' : 'text-muted-foreground'}>
                  {formatDate(org.last_visit_date)}
                </span>
              </TableCell>
              <TableCell className="font-medium">{org.ytd_referrals}</TableCell>
            </TableRow>
          ))}
          {sorted.length === 0 && (
            <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No organizations match filters</TableCell></TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default MapListView;
