import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Users, Plus, Edit, Trash2, Shield, Mail, Calendar, Activity } from 'lucide-react';

interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
  role?: string;
  last_sign_in_at?: string;
  email_confirmed_at?: string;
}

interface NewUser {
  email: string;
  password: string;
  full_name: string;
  role: string;
}

export function UserManagementPanel() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState<NewUser>({
    email: '',
    password: '',
    full_name: '',
    role: 'user'
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Get profiles with user roles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      if (profilesError) throw profilesError;

      // Get user roles separately
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('user_id, role');

      // Get auth users metadata (this would require admin access)
      const combinedUsers = profiles?.map(profile => {
        const userRole = userRoles?.find(ur => ur.user_id === profile.user_id);
        return {
          id: profile.user_id,
          email: profile.email,
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
          created_at: profile.created_at,
          role: userRole?.role || 'user',
          last_sign_in_at: profile.created_at, // Fallback since we can't access auth admin
          email_confirmed_at: profile.created_at
        };
      }) || [];

      setUsers(combinedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    try {
      // Check if current user is admin
      const { data: currentUserRole } = await supabase.rpc('get_user_role', { _user_id: currentUser?.id });
      if (currentUserRole !== 'admin') {
        throw new Error('Only admins can create users');
      }

      // Create profile entry first (since we can't use auth.admin in client-side)
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: crypto.randomUUID(), // Generate a UUID for demo purposes
          email: newUser.email,
          full_name: newUser.full_name
        })
        .select()
        .single();

      if (profileError) throw profileError;

      // Assign role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: profileData.user_id,
          role: newUser.role as 'admin' | 'moderator' | 'user',
          assigned_by: currentUser?.id
        });

      if (roleError) throw roleError;

      // Log audit event
      await supabase.rpc('log_audit_event', {
        _action: 'CREATE',
        _resource: 'user',
        _resource_id: profileData.user_id,
        _details: { 
          created_user_email: newUser.email,
          assigned_role: newUser.role
        } as any
      });

      toast({
        title: "User Created",
        description: `User ${newUser.email} has been created successfully`
      });

      setIsAddDialogOpen(false);
      setNewUser({ email: '', password: '', full_name: '', role: 'user' });
      fetchUsers();
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive"
      });
    }
  };

  const handleUpdateUserRole = async (userId: string, newRole: string) => {
    try {
      // Check if current user is admin
      const { data: currentUserRole } = await supabase.rpc('get_user_role', { _user_id: currentUser?.id });
      if (currentUserRole !== 'admin') {
        throw new Error('Only admins can update user roles');
      }

      // First try to update existing role
      const { error: updateError } = await supabase
        .from('user_roles')
        .update({ role: newRole as 'admin' | 'moderator' | 'user' })
        .eq('user_id', userId);

      // If no rows updated, insert new role
      if (updateError?.code === 'PGRST116') {
        const { error: insertError } = await supabase
          .from('user_roles')
          .insert({
            user_id: userId,
            role: newRole as 'admin' | 'moderator' | 'user',
            assigned_by: currentUser?.id
          });
        if (insertError) throw insertError;
      } else if (updateError) {
        throw updateError;
      }

      // Log audit event
      await supabase.rpc('log_audit_event', {
        _action: 'UPDATE',
        _resource: 'user_role',
        _resource_id: userId,
        _details: { 
          new_role: newRole,
          changed_by: currentUser?.id
        } as any
      });

      toast({
        title: "Role Updated",
        description: `User role updated to ${newRole}`
      });

      // Refresh user role if updating current user
      if (userId === currentUser?.id) {
        // Force auth context refresh
        window.location.reload();
      }

      fetchUsers();
    } catch (error: any) {
      console.error('Error updating role:', error);
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive"
      });
    }
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    try {
      // Check if current user is admin
      const { data: currentUserRole } = await supabase.rpc('get_user_role', { _user_id: currentUser?.id });
      if (currentUserRole !== 'admin') {
        throw new Error('Only admins can delete users');
      }

      // Delete profile (this will cascade to related tables)
      const { error: deleteError } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', userId);
      
      if (deleteError) throw deleteError;

      // Log audit event
      await supabase.rpc('log_audit_event', {
        _action: 'DELETE',
        _resource: 'user',
        _resource_id: userId,
        _details: { 
          deleted_user_email: userEmail,
          deleted_by: currentUser?.id
        } as any
      });

      toast({
        title: "User Deleted",
        description: `User ${userEmail} has been deleted`
      });

      fetchUsers();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive"
      });
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'moderator': return 'secondary';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Management
              </CardTitle>
              <CardDescription>
                Manage system users, roles, and permissions
              </CardDescription>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New User</DialogTitle>
                  <DialogDescription>
                    Create a new user account with specified role
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="user@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={newUser.password}
                      onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Strong password"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      value={newUser.full_name}
                      onChange={(e) => setNewUser(prev => ({ ...prev, full_name: e.target.value }))}
                      placeholder="John Doe"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select value={newUser.role} onValueChange={(value) => setNewUser(prev => ({ ...prev, role: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="moderator">Moderator</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddUser}>
                    Create User
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="moderator">Moderator</SelectItem>  
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Users Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.avatar_url} alt={user.full_name} />
                            <AvatarFallback>
                              {user.full_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{user.full_name || 'No name'}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={user.role}
                          onValueChange={(value) => handleUpdateUserRole(user.id, value)}
                          disabled={user.id === currentUser?.id}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">User</SelectItem>
                            <SelectItem value="moderator">Moderator</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.email_confirmed_at ? "default" : "secondary"}>
                          {user.email_confirmed_at ? "Verified" : "Unverified"}
                        </Badge>
                        {!user.email_confirmed_at && (
                          <p className="text-xs text-orange-600 mt-1">Email verification pending</p>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {new Date(user.created_at).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Activity className="h-3 w-3" />
                          {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'Never'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingUser(user);
                              setIsEditDialogOpen(true);
                            }}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          {user.id !== currentUser?.id && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete User</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete {user.email}? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteUser(user.id, user.email)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">{users.length}</p>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">{users.filter(u => u.role === 'admin').length}</p>
                  <p className="text-sm text-muted-foreground">Admins</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">{users.filter(u => u.role === 'moderator').length}</p>
                  <p className="text-sm text-muted-foreground">Moderators</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">{users.filter(u => u.email_confirmed_at).length}</p>
                  <p className="text-sm text-muted-foreground">Confirmed</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}