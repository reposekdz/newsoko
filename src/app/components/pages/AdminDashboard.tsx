import { Users, Package, ShoppingCart, DollarSign, TrendingUp, Shield, Settings, Activity, AlertCircle, CheckCircle, XCircle, Eye, Edit, Trash2, UserPlus } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { api } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';

export function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>({});
  const [users, setUsers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);

  useEffect(() => {
    if (user?.is_admin) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    const [statsRes, usersRes, productsRes, rolesRes, categoriesRes, logsRes] = await Promise.all([
      api.getAdminDashboard(),
      api.getAdminUsersList('', 'all', 50, 0),
      api.getAdminProductsPending(),
      api.getAdminRoles(),
      api.getAdminCategories(),
      api.getAdminActivityLogsAll(100)
    ]);
    
    if (statsRes.success) setStats(statsRes.data);
    if (usersRes.success) setUsers(usersRes.data);
    if (productsRes.success) setProducts(productsRes.data);
    if (rolesRes.success) setRoles(rolesRes.data);
    if (categoriesRes.success) setCategories(categoriesRes.data);
    if (logsRes.success) setLogs(logsRes.data);
  };

  const handleAssignRole = async (userId: number, roleId: number) => {
    const response = await api.assignRole(userId, roleId);
    if (response.success) {
      loadData();
      setShowRoleDialog(false);
    }
  };

  const handleBanUser = async (userId: number) => {
    const reason = prompt('Enter ban reason:');
    if (!reason) return;
    const response = await api.adminBanUser(userId, reason);
    if (response.success) loadData();
  };

  const handleVerifyUser = async (userId: number) => {
    const response = await api.adminVerifyUser(userId);
    if (response.success) loadData();
  };

  const handleApproveProduct = async (productId: number) => {
    const response = await api.adminApproveProduct(productId);
    if (response.success) loadData();
  };

  const handleRejectProduct = async (productId: number) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;
    const response = await api.adminRejectProduct(productId, reason);
    if (response.success) loadData();
  };

  const handleDeleteProduct = async (productId: number) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    const response = await api.adminDeleteProduct(productId);
    if (response.success) loadData();
  };

  if (!user?.is_admin) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <AlertCircle className="h-16 w-16 mx-auto text-red-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
        <p className="text-muted-foreground">You don't have permission to access this page</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Shield className="h-8 w-8" />
          Admin Dashboard
        </h1>
        <Badge variant="outline" className="text-lg px-4 py-2">
          {user.name} - Administrator
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <h3 className="text-3xl font-bold">{stats.total_users || 0}</h3>
              </div>
              <Users className="h-12 w-12 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Products</p>
                <h3 className="text-3xl font-bold">{stats.total_products || 0}</h3>
              </div>
              <Package className="h-12 w-12 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Approval</p>
                <h3 className="text-3xl font-bold">{stats.pending_products || 0}</h3>
              </div>
              <AlertCircle className="h-12 w-12 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <h3 className="text-3xl font-bold">{(stats.total_revenue || 0).toLocaleString()}</h3>
              </div>
              <DollarSign className="h-12 w-12 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="logs">Activity Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {users.map((u) => (
                  <div key={u.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Users className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-bold">{u.name}</p>
                        <p className="text-sm text-muted-foreground">{u.email}</p>
                        {u.roles && <Badge variant="outline" className="mt-1">{u.roles}</Badge>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {!u.is_verified && (
                        <Button size="sm" variant="outline" onClick={() => handleVerifyUser(u.id)}>
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Verify
                        </Button>
                      )}
                      <Dialog open={showRoleDialog && selectedUser?.id === u.id} onOpenChange={(open) => {
                        setShowRoleDialog(open);
                        if (open) setSelectedUser(u);
                      }}>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline">
                            <UserPlus className="h-4 w-4 mr-1" />
                            Role
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Assign Role to {u.name}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <Select onValueChange={(value) => handleAssignRole(u.id, parseInt(value))}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select role" />
                              </SelectTrigger>
                              <SelectContent>
                                {roles.map((role) => (
                                  <SelectItem key={role.id} value={role.id.toString()}>
                                    {role.display_name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button size="sm" variant="destructive" onClick={() => handleBanUser(u.id)}>
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Product Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {products.slice(0, 20).map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <img src={p.images?.[0]} alt={p.title} className="w-16 h-16 object-cover rounded" />
                      <div>
                        <p className="font-bold">{p.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {p.rent_price && `Rent: ${p.rent_price} RWF`}
                          {p.buy_price && ` | Buy: ${p.buy_price} RWF`}
                        </p>
                        {p.approved_at ? (
                          <Badge variant="outline" className="mt-1">Approved</Badge>
                        ) : (
                          <Badge variant="secondary" className="mt-1">Pending</Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {!p.approved_at && (
                        <>
                          <Button size="sm" onClick={() => handleApproveProduct(p.id)}>
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleRejectProduct(p.id)}>
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}
                      <Button size="sm" variant="destructive" onClick={() => handleDeleteProduct(p.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Role Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {roles.map((role) => (
                  <div key={role.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-lg">{role.display_name}</h3>
                      <Badge>Level {role.level}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{role.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Category Management</CardTitle>
                <Button>Add Category</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {categories.map((cat) => (
                  <div key={cat.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-bold">{cat.name}</p>
                      {cat.parent_name && (
                        <p className="text-sm text-muted-foreground">Parent: {cat.parent_name}</p>
                      )}
                    </div>
                    <Badge variant={cat.is_active ? 'default' : 'secondary'}>
                      {cat.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Activity Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {logs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg text-sm">
                    <div className="flex items-center gap-3">
                      <Activity className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p><span className="font-bold">{log.admin_name}</span> {log.action} {log.entity_type}</p>
                        <p className="text-xs text-muted-foreground">{new Date(log.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
