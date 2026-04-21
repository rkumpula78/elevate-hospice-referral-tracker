import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import PageLayout from '@/components/layout/PageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Loader2, Plus, Pencil, Trash2, Users, Phone, Mail } from 'lucide-react';
import { logAuditEvent } from '@/lib/auditLog';

// Roles match what CareTeamSection expects (case-insensitive on read).
const ROLE_OPTIONS = [
  { value: 'rn', label: 'Registered Nurse (RN)' },
  { value: 'np', label: 'Nurse Practitioner (NP)' },
  { value: 'cna', label: 'CNA / HHA' },
  { value: 'sw', label: 'Social Worker' },
  { value: 'chaplain', label: 'Chaplain' },
  { value: 'marketing', label: 'Marketer / Liaison' },
  { value: 'intake_coordinator', label: 'Intake Coordinator' },
  { value: 'admin', label: 'Admin / Office' },
  { value: 'other', label: 'Other' },
];

const roleLabel = (role: string) =>
  ROLE_OPTIONS.find(r => r.value === role)?.label || role;

interface StaffRow {
  id: string;
  name: string;
  role: string;
  phone: string | null;
  email: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const EMPTY_FORM = { name: '', role: 'rn', phone: '', email: '', is_active: true };

export default function StaffManagementPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<StaffRow | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [deleteTarget, setDeleteTarget] = useState<StaffRow | null>(null);

  const { data: staff = [], isLoading } = useQuery({
    queryKey: ['staff-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff')
        .select('id, name, role, phone, email, is_active, created_at, updated_at')
        .order('name');
      if (error) throw error;
      return (data || []) as StaffRow[];
    },
  });

  const upsertMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name.trim(),
        role: form.role,
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        is_active: form.is_active,
      };
      if (!payload.name) throw new Error('Name is required');
      if (!payload.role) throw new Error('Role is required');

      if (editing) {
        const { error } = await supabase.from('staff').update(payload).eq('id', editing.id);
        if (error) throw error;
        await logAuditEvent({
          action: 'update',
          tableName: 'staff',
          recordId: editing.id,
          changes: { before: editing, after: payload },
        });
      } else {
        const { data, error } = await supabase.from('staff').insert(payload).select().single();
        if (error) throw error;
        await logAuditEvent({
          action: 'create',
          tableName: 'staff',
          recordId: data.id,
          changes: { after: payload },
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-all'] });
      queryClient.invalidateQueries({ queryKey: ['staff-active'] });
      toast.success(editing ? 'Staff member updated' : 'Staff member added');
      setShowDialog(false);
      setEditing(null);
      setForm({ ...EMPTY_FORM });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, next }: { id: string; next: boolean }) => {
      const { error } = await supabase.from('staff').update({ is_active: next }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-all'] });
      queryClient.invalidateQueries({ queryKey: ['staff-active'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('staff').delete().eq('id', id);
      if (error) throw error;
      await logAuditEvent({ action: 'delete', tableName: 'staff', recordId: id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-all'] });
      queryClient.invalidateQueries({ queryKey: ['staff-active'] });
      toast.success('Staff member removed');
      setDeleteTarget(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM });
    setShowDialog(true);
  };

  const openEdit = (row: StaffRow) => {
    setEditing(row);
    setForm({
      name: row.name,
      role: row.role,
      phone: row.phone || '',
      email: row.email || '',
      is_active: row.is_active,
    });
    setShowDialog(true);
  };

  const filtered = staff.filter(s => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      roleLabel(s.role).toLowerCase().includes(q) ||
      (s.phone || '').toLowerCase().includes(q) ||
      (s.email || '').toLowerCase().includes(q)
    );
  });

  return (
    <PageLayout
      title="Care Team Staff"
      subtitle="Manage staff who can be assigned to patient care teams (RN, CNA, SW, Chaplain, Marketer, etc.)"
    >
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Staff Directory
              </CardTitle>
              <CardDescription>
                Anyone added here will appear in care team dropdowns across patient and referral records.
              </CardDescription>
            </div>
            <Button onClick={openCreate}>
              <Plus className="w-4 h-4 mr-1" /> Add Staff Member
            </Button>
          </div>
          <div className="mt-4">
            <Input
              placeholder="Search by name, role, phone or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-md"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Loading staff...
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
              {search ? 'No staff match your search.' : 'No staff yet. Add your first team member.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-center">Active</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">{row.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{roleLabel(row.role)}</Badge>
                      </TableCell>
                      <TableCell>
                        {row.phone ? (
                          <a
                            href={`tel:${row.phone}`}
                            className="text-blue-600 hover:underline inline-flex items-center gap-1"
                          >
                            <Phone className="w-3 h-3" />
                            {row.phone}
                          </a>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {row.email ? (
                          <a
                            href={`mailto:${row.email}`}
                            className="text-blue-600 hover:underline inline-flex items-center gap-1"
                          >
                            <Mail className="w-3 h-3" />
                            {row.email}
                          </a>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={row.is_active}
                          onCheckedChange={(next) =>
                            toggleActiveMutation.mutate({ id: row.id, next })
                          }
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(row)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => setDeleteTarget(row)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Staff Member' : 'Add Staff Member'}</DialogTitle>
            <DialogDescription>
              {editing
                ? 'Update this person\'s role or contact info.'
                : 'Add someone to the care team directory. They will be available in all care team dropdowns.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="staff_name">Name <span className="text-destructive">*</span></Label>
              <Input
                id="staff_name"
                value={form.name}
                onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder="e.g., Sarah Johnson"
              />
            </div>
            <div>
              <Label htmlFor="staff_role">Role <span className="text-destructive">*</span></Label>
              <Select value={form.role} onValueChange={(v) => setForm(p => ({ ...p, role: v }))}>
                <SelectTrigger id="staff_role"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map(r => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="staff_phone">Phone</Label>
                <Input
                  id="staff_phone"
                  value={form.phone}
                  onChange={(e) => setForm(p => ({ ...p, phone: e.target.value }))}
                  placeholder="(555) 123-4567"
                />
              </div>
              <div>
                <Label htmlFor="staff_email">Email</Label>
                <Input
                  id="staff_email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))}
                  placeholder="name@elevatehospiceaz.com"
                />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-md border px-3 py-2">
              <div>
                <Label htmlFor="staff_active" className="cursor-pointer">Active</Label>
                <p className="text-xs text-muted-foreground">Inactive staff are hidden from care team dropdowns.</p>
              </div>
              <Switch
                id="staff_active"
                checked={form.is_active}
                onCheckedChange={(v) => setForm(p => ({ ...p, is_active: v }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={() => upsertMutation.mutate()} disabled={upsertMutation.isPending}>
              {upsertMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editing ? 'Save Changes' : 'Add Staff Member'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove staff member?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove <strong>{deleteTarget?.name}</strong> from the directory. Existing
              care team assignments referencing this person will keep the assignment record but will no longer
              show contact info. Consider toggling them to <em>Inactive</em> instead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            >
              {deleteMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageLayout>
  );
}
