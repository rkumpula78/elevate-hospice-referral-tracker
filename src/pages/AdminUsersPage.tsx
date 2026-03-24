import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import PageLayout from '@/components/layout/PageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { UserPlus, Trash2, Shield, ShieldOff, Mail, RefreshCw, Loader2, KeyRound, Pencil } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface AuthUser {
  id: string;
  email: string;
  created_at: string;
  email_confirmed_at: string | null;
  last_sign_in_at: string | null;
  status: 'pending' | 'active' | 'disabled';
  first_name: string;
  last_name: string;
  staff_type: string;
}

interface UserWithRoles extends AuthUser {
  roles: string[];
}

export default function AdminUsersPage() {
  const { isAdmin, user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [resendingEmail, setResendingEmail] = useState<string | null>(null);
  const [deletingUser, setDeletingUser] = useState(false);
  const [passwordDialogUser, setPasswordDialogUser] = useState<UserWithRoles | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [settingPassword, setSettingPassword] = useState(false);
  const [editUser, setEditUser] = useState<UserWithRoles | null>(null);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [editStaffType, setEditStaffType] = useState('marketer');
  
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserFirstName, setNewUserFirstName] = useState('');
  const [newUserLastName, setNewUserLastName] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'user'>('user');
  const [newUserStaffType, setNewUserStaffType] = useState('marketer');
  const [addingUser, setAddingUser] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      loadUsers();
    }
  }, [isAdmin]);

  const loadUsers = async () => {
    try {
      setLoading(true);

      // Get auth users with status from edge function
      const { data, error } = await supabase.functions.invoke('admin-users', {
        body: { action: 'list' },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error.message);

      const authUsers: AuthUser[] = data.users || [];

      // Get all user roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');
      
      if (rolesError) throw rolesError;

      // Get profiles for staff_type
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, staff_type');

      // Combine data
      const usersWithRoles: UserWithRoles[] = authUsers.map(user => {
        const userRoles = rolesData?.filter(r => r.user_id === user.id).map(r => r.role) || [];
        const profile = profilesData?.find(p => p.id === user.id);
        return { ...user, roles: userRoles, staff_type: profile?.staff_type || 'marketer' };
      });

      setUsers(usersWithRoles);
    } catch (error: any) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    if (!newUserEmail || !newUserPassword) {
      toast.error('Email and password are required');
      return;
    }

    if (!newUserEmail.endsWith('@elevatehospiceaz.com')) {
      toast.error('Only @elevatehospiceaz.com email addresses are allowed');
      return;
    }

    try {
      setAddingUser(true);

      const { data, error } = await supabase.functions.invoke('validate-signup', {
        body: {
          mode: 'admin-invite',
          email: newUserEmail,
          password: newUserPassword,
          first_name: newUserFirstName,
          last_name: newUserLastName,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error.message);

      toast.success(data?.existing_user ? 'Password reset sent (user exists)' : 'Invitation sent!');

      const newUserId: string | undefined = data?.user?.id;

      if (newUserId) {
        // Set staff_type on profile
        await supabase.from('profiles').update({ staff_type: newUserStaffType }).eq('id', newUserId);

        if (newUserRole === 'admin') {
          const { error: roleError } = await supabase
            .from('user_roles')
            .insert({ user_id: newUserId, role: 'admin', assigned_by: currentUser?.id });

          if (roleError) console.error('Role assignment error:', roleError);

          await supabase.from('admin_audit_log').insert({
            admin_user_id: currentUser?.id,
            action: 'assign_admin_role',
            target_user_id: newUserId,
            details: { email: newUserEmail }
          });
        }
      }

      setShowAddDialog(false);
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserFirstName('');
      setNewUserLastName('');
      setNewUserRole('user');
      setNewUserStaffType('marketer');
      loadUsers();
    } catch (error: any) {
      console.error('Error adding user:', error);
      toast.error(error.message || 'Failed to create user');
    } finally {
      setAddingUser(false);
    }
  };

  const toggleAdminRole = async (userId: string, currentlyAdmin: boolean) => {
    try {
      if (currentlyAdmin) {
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', 'admin');

        if (error) throw error;

        await supabase.from('admin_audit_log').insert({
          admin_user_id: currentUser?.id,
          action: 'remove_admin_role',
          target_user_id: userId
        });

        toast.success('Admin role removed');
      } else {
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: 'admin', assigned_by: currentUser?.id });

        if (error) throw error;

        await supabase.from('admin_audit_log').insert({
          admin_user_id: currentUser?.id,
          action: 'assign_admin_role',
          target_user_id: userId
        });

        toast.success('Admin role assigned');
      }

      loadUsers();
    } catch (error: any) {
      console.error('Error toggling admin role:', error);
      toast.error('Failed to update role');
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteUserId) return;

    try {
      setDeletingUser(true);

      const { data, error } = await supabase.functions.invoke('admin-users', {
        body: { action: 'delete', userId: deleteUserId },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error.message);

      toast.success('User deleted successfully');
      setDeleteUserId(null);
      loadUsers();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast.error(error.message || 'Failed to delete user');
    } finally {
      setDeletingUser(false);
    }
  };

  const resendInvite = async (email: string) => {
    try {
      setResendingEmail(email);

      const { data, error } = await supabase.functions.invoke('admin-users', {
        body: { action: 'resend-invite', email },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error.message);

      toast.success(data.message || 'Email sent!');
    } catch (error: any) {
      console.error('Error resending invite:', error);
      toast.error(error.message || 'Failed to send email');
    } finally {
      setResendingEmail(null);
    }
  };

  const handleSetPassword = async () => {
    if (!passwordDialogUser || !newPassword) return;

    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    try {
      setSettingPassword(true);

      const { data, error } = await supabase.functions.invoke('admin-users', {
        body: { action: 'set-password', userId: passwordDialogUser.id, password: newPassword },
      });

      // Handle edge function errors (returned as error or in data.error)
      const errorObj = error || data?.error;
      if (errorObj) {
        // Parse weak password error
        const code = errorObj.code || errorObj?.error?.code;
        const reasons = errorObj.reasons || errorObj?.error?.reasons || [];
        
        if (code === 'weak_password') {
          if (reasons.includes('pwned')) {
            toast.error('This password has appeared in data breaches. Please choose a different, unique password.');
          } else {
            toast.error('Password is too weak. Use a mix of letters, numbers, and symbols.');
          }
          return;
        }
        
        // Try to parse error message from string if needed
        const message = typeof errorObj === 'string' 
          ? (errorObj.includes('weak_password') ? 'Password is too weak or has been compromised. Try a unique password.' : errorObj)
          : errorObj.message || 'Failed to set password';
        toast.error(message);
        return;
      }

      toast.success('Password updated successfully');
      setPasswordDialogUser(null);
      setNewPassword('');
    } catch (error: any) {
      console.error('Error setting password:', error);
      
      // Try to extract weak password info from caught error
      const errorStr = error?.message || String(error);
      if (errorStr.includes('weak_password') || errorStr.includes('pwned')) {
        toast.error('This password has appeared in data breaches. Please choose a different, unique password.');
        return;
      }
      
      toast.error('Failed to set password. Try a stronger, unique password.');
    } finally {
      setSettingPassword(false);
    }
  };

  const openEditDialog = (user: UserWithRoles) => {
    setEditUser(user);
    setEditFirstName(user.first_name || '');
    setEditLastName(user.last_name || '');
    setEditEmail(user.email || '');
    setEditStaffType(user.staff_type || 'marketer');
  };

  const handleEditUser = async () => {
    if (!editUser) return;

    try {
      setSavingEdit(true);

      const { data, error } = await supabase.functions.invoke('admin-users', {
        body: {
          action: 'update-user',
          userId: editUser.id,
          first_name: editFirstName,
          last_name: editLastName,
          staff_type: editStaffType,
          ...(editEmail !== editUser.email ? { email: editEmail } : {}),
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error.message);

      toast.success('User updated successfully');
      setEditUser(null);
      loadUsers();
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast.error(error.message || 'Failed to update user');
    } finally {
      setSavingEdit(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>;
      case 'pending':
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Pending</Badge>;
      case 'disabled':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Disabled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <PageLayout title="User Management" subtitle="Manage user accounts and permissions">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Users</CardTitle>
              <CardDescription>View and manage all user accounts</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={loadUsers} disabled={loading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add User
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New User</DialogTitle>
                    <DialogDescription>Add a new user to the system</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          value={newUserFirstName}
                          onChange={(e) => setNewUserFirstName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          value={newUserLastName}
                          onChange={(e) => setNewUserLastName(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newUserEmail}
                        onChange={(e) => setNewUserEmail(e.target.value)}
                        placeholder="user@elevatehospiceaz.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={newUserPassword}
                        onChange={(e) => setNewUserPassword(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      <Select value={newUserRole} onValueChange={(value: 'admin' | 'user') => setNewUserRole(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="staffType">Staff Type</Label>
                      <Select value={newUserStaffType} onValueChange={setNewUserStaffType}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="marketer">Marketer</SelectItem>
                          <SelectItem value="intake_coordinator">Intake Coordinator</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={handleAddUser} className="w-full" disabled={addingUser}>
                      {addingUser && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Create User
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading users...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Staff Type</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Last Sign In</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      {user.first_name || user.last_name ? 
                        `${user.first_name} ${user.last_name}`.trim() : 
                        <span className="text-muted-foreground">No name</span>
                      }
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{getStatusBadge(user.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {user.roles.includes('admin') && (
                          <Badge variant="default">Admin</Badge>
                        )}
                        {user.roles.length === 0 && (
                          <Badge variant="outline">User</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.last_sign_in_at 
                        ? new Date(user.last_sign_in_at).toLocaleDateString()
                        : <span className="text-muted-foreground">Never</span>
                      }
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEditDialog(user)}
                          title="Edit user"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleAdminRole(user.id, user.roles.includes('admin'))}
                          disabled={user.id === currentUser?.id}
                          title={user.roles.includes('admin') ? 'Remove admin role' : 'Make admin'}
                        >
                          {user.roles.includes('admin') ? (
                            <ShieldOff className="w-4 h-4" />
                          ) : (
                            <Shield className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setPasswordDialogUser(user)}
                          disabled={user.id === currentUser?.id}
                          title="Set password"
                        >
                          <KeyRound className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => resendInvite(user.email)}
                          disabled={resendingEmail === user.email}
                          title="Resend invite / password reset"
                        >
                          {resendingEmail === user.email ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Mail className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDeleteUserId(user.id)}
                          disabled={user.id === currentUser?.id}
                          title="Delete user"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteUserId} onOpenChange={(open) => !open && setDeleteUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete this user? This action cannot be undone and will remove the user from the authentication system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingUser}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} disabled={deletingUser} className="bg-destructive hover:bg-destructive/90">
              {deletingUser && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!editUser} onOpenChange={(open) => { if (!open) setEditUser(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user details for {editUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-firstName">First Name</Label>
                <Input
                  id="edit-firstName"
                  value={editFirstName}
                  onChange={(e) => setEditFirstName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-lastName">Last Name</Label>
                <Input
                  id="edit-lastName"
                  value={editLastName}
                  onChange={(e) => setEditLastName(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
              />
            </div>
            <Button onClick={handleEditUser} className="w-full" disabled={savingEdit}>
              {savingEdit && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!passwordDialogUser} onOpenChange={(open) => { if (!open) { setPasswordDialogUser(null); setNewPassword(''); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Password</DialogTitle>
            <DialogDescription>
              Set a new password for {passwordDialogUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="set-password">New Password</Label>
              <Input
                id="set-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 8 characters"
              />
              <p className="text-xs text-muted-foreground">
                Use a strong, unique password with letters, numbers, and symbols.
              </p>
            </div>
            <Button onClick={handleSetPassword} className="w-full" disabled={settingPassword || newPassword.length < 8}>
              {settingPassword && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Set Password
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
