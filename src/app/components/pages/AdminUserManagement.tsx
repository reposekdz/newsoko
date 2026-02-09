import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Shield, Ban, Trash2, Search, Download } from 'lucide-react';
import { api } from '../../../services/api';
import { toast } from 'sonner';

export function AdminUserManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [usersData, rolesData] = await Promise.all([
        api.getAdminUsersList('', filter, 100, 0),
        api.getAdminRoles()
      ]);
      
      if (usersData.success) setUsers(usersData.data);
      if (rolesData.success) setRoles(rolesData.data);
    } catch (error) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (userId: number) => {
    const result = await api.adminVerifyUser(userId);
    if (result.success) {
      toast.success('User verified');
      loadData();
    }
  };

  const handleBan = async (userId: number) => {
    const reason = prompt('Ban reason:');
    if (!reason) return;
    
    const result = await api.adminBanUser(userId, reason);
    if (result.success) {
      toast.success('User banned');
      loadData();
    }
  };

  const handleUnban = async (userId: number) => {
    const result = await api.adminUnbanUser(userId);
    if (result.success) {
      toast.success('User unbanned');
      loadData();
    }
  };

  const handleDelete = async (userId: number) => {
    if (!confirm('Delete this user permanently?')) return;
    
    const result = await api.adminDeleteUser(userId);
    if (result.success) {
      toast.success('User deleted');
      loadData();
    }
  };

  const handleAssignRole = async (userId: number, roleId: number) => {
    const result = await api.assignRoleAdmin(userId, roleId);
    if (result.success) {
      toast.success('Role assigned');
      loadData();
    }
  };

  const handleExport = async () => {
    const result = await api.exportDataAdmin('users');
    if (result.success) {
      const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `users-${Date.now()}.json`;
      a.click();
      toast.success('Users exported');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(search.toLowerCase()) || 
                         user.email?.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || 
                         (filter === 'verified' && user.is_verified) ||
                         (filter === 'banned' && !user.is_active) ||
                         (filter === 'unverified' && !user.is_verified);
    return matchesSearch && matchesFilter;
  });

  if (loading) return <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>;

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">User Management</h1>
        <Button onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" /> Export
        </Button>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="unverified">Unverified</SelectItem>
                <SelectItem value="banned">Banned</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {filteredUsers.map((user) => (
          <Card key={user.id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-bold text-lg">{user.name}</h3>
                    {user.is_verified && <Badge>Verified</Badge>}
                    {!user.is_active && <Badge variant="destructive">Banned</Badge>}
                    {user.is_admin && <Badge variant="secondary">Admin</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">{user.email}</p>
                  <p className="text-sm text-muted-foreground mb-3">{user.phone}</p>
                  
                  <div className="flex items-center gap-4 text-sm">
                    <span>Rating: {user.rating || 0} ⭐</span>
                    <span>Deposit: {user.seller_deposit || 0} RWF</span>
                    <span>Joined: {new Date(user.created_at).toLocaleDateString()}</span>
                  </div>

                  {user.roles && (
                    <div className="mt-3">
                      <span className="text-sm text-muted-foreground">Roles: </span>
                      <Badge variant="outline">{user.roles}</Badge>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  {!user.is_verified && (
                    <Button size="sm" onClick={() => handleVerify(user.id)}>
                      <Shield className="h-4 w-4 mr-1" /> Verify
                    </Button>
                  )}
                  
                  {user.is_active ? (
                    <Button size="sm" variant="destructive" onClick={() => handleBan(user.id)}>
                      <Ban className="h-4 w-4 mr-1" /> Ban
                    </Button>
                  ) : (
                    <Button size="sm" onClick={() => handleUnban(user.id)}>
                      Unban
                    </Button>
                  )}

                  <Select onValueChange={(value) => handleAssignRole(user.id, parseInt(value))}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Assign Role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.id.toString()}>
                          {role.display_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button size="sm" variant="outline" onClick={() => handleDelete(user.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            No users found
          </CardContent>
        </Card>
      )}
    </div>
  );
}
