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
import { UserPlus, Edit, Trash2, Shield, ShieldOff, Mail } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface UserWithRoles {
  id: string;
  email: string;
  created_at: string;
  roles: string[];
  profile?: {
    first_name: string;
    last_name: string;
  };
}

export default function AdminUsersPage() {
  const { isAdmin, user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithRoles | null>(null);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserFirstName, setNewUserFirstName] = useState('');
  const [newUserLastName, setNewUserLastName] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'user'>('user');

  useEffect(() => {
    if (isAdmin) {
      loadUsers();
    }
  }, [isAdmin]);

  const loadUsers = async () => {
    try {
      setLoading(true);

      // Get all profiles (which includes user data)
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, created_at');
      
      if (profilesError) throw profilesError;

      // Get all user roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');
      
      if (rolesError) throw rolesError;

      // Combine data
      const usersWithRoles: UserWithRoles[] = (profilesData || []).map(profile => {
        const userRoles = rolesData?.filter(r => r.user_id === profile.id).map(r => r.role) || [];
        
        return {
          id: profile.id,
          email: profile.email || '',
          created_at: profile.created_at,
          roles: userRoles,
          profile: {
            first_name: profile.first_name || '',
            last_name: profile.last_name || ''
          }
        };
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
      // Create user via edge function (admin invite)
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

      toast.success('Invitation sent to user email');

      const newUserId: string | undefined = data?.user?.id;

      if (newUserId && newUserRole === 'admin') {
        // Assign admin role
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({ user_id: newUserId, role: 'admin', assigned_by: currentUser?.id });

        if (roleError) throw roleError;

        // Log action
        await supabase.from('admin_audit_log').insert({
          admin_user_id: currentUser?.id,
          action: 'assign_admin_role',
          target_user_id: newUserId,
          details: { email: newUserEmail }
        });
      }

      setShowAddDialog(false);
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserFirstName('');
      setNewUserLastName('');
      setNewUserRole('user');
      loadUsers();
    } catch (error: any) {
      console.error('Error adding user:', error);
      toast.error(error.message || 'Failed to create user');
    }
  };

  const toggleAdminRole = async (userId: string, currentlyAdmin: boolean) => {
    try {
      if (currentlyAdmin) {
        // Remove admin role
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
        // Add admin role
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
      // Delete user roles first (will cascade delete profile via auth trigger)
      const { error: roleError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', deleteUserId);

      // Note: Actual user deletion from auth.users requires service role access
      // For now, we remove their roles which effectively locks them out
      
      await supabase.from('admin_audit_log').insert({
        admin_user_id: currentUser?.id,
        action: 'disable_user',
        target_user_id: deleteUserId
      });

      toast.success('User access removed');
      setDeleteUserId(null);
      loadUsers();
    } catch (error: any) {
      console.error('Error removing user access:', error);
      toast.error('Failed to remove user access');
    }
  };

  const sendPasswordReset = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth`
      });

      if (error) throw error;

      toast.success('Password reset email sent');
    } catch (error: any) {
      console.error('Error sending password reset:', error);
      toast.error('Failed to send password reset email');
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
                  <Button onClick={handleAddUser} className="w-full">
                    Create User
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
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
                  <TableHead>Roles</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      {user.profile ? 
                        `${user.profile.first_name} ${user.profile.last_name}` : 
                        <span className="text-muted-foreground">No name</span>
                      }
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {user.roles.includes('admin') && (
                          <Badge variant="default">Admin</Badge>
                        )}
                        {user.roles.includes('user') && (
                          <Badge variant="secondary">User</Badge>
                        )}
                        {user.roles.length === 0 && (
                          <Badge variant="outline">No roles</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(user.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
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
                          onClick={() => sendPasswordReset(user.email)}
                          title="Send password reset"
                        >
                          <Mail className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDeleteUserId(user.id)}
                          disabled={user.id === currentUser?.id}
                          title="Delete user"
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
            <AlertDialogTitle>Remove User Access</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this user's access? This will remove all their roles and prevent them from logging in.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser}>Remove Access</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageLayout>
  );
}
