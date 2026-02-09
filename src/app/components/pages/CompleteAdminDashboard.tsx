import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Users, Package, DollarSign, AlertTriangle, Settings, Activity, CheckCircle, XCircle, Eye, Trash2, Ban, Shield } from 'lucide-react';
import { api } from '../../../services/api';
import { toast } from 'sonner';

export function CompleteAdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [settings, setSettings] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'overview') {
        const result = await api.getAdminStatsComplete();
        if (result.success) setStats(result.data);
      } else if (activeTab === 'users') {
        const result = await api.getAdminUsersComplete();
        if (result.success) setUsers(result.data);
      } else if (activeTab === 'products') {
        const result = await api.getAdminPendingApprovals();
        if (result.success) setProducts(result.data);
      } else if (activeTab === 'bookings') {
        const result = await api.getAdminBookings();
        if (result.success) setBookings(result.data);
      } else if (activeTab === 'disputes') {
        const result = await api.getAdminDisputesComplete();
        if (result.success) setDisputes(result.data);
      } else if (activeTab === 'categories') {
        const result = await api.getAdminCategoriesComplete();
        if (result.success) setCategories(result.data);
      } else if (activeTab === 'reviews') {
        const result = await api.getAdminReviews();
        if (result.success) setReviews(result.data);
      } else if (activeTab === 'settings') {
        const result = await api.getSystemSettingsComplete();
        if (result.success) setSettings(result.data);
      } else if (activeTab === 'logs') {
        const result = await api.getAdminLogsComplete(100);
        if (result.success) setLogs(result.data);
      }
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleBanUser = async (userId: number, reason: string) => {
    const result = await api.banUserAdmin(userId, reason);
    if (result.success) {
      toast.success('User banned');
      loadData();
    }
  };

  const handleApproveProduct = async (productId: number) => {
    const result = await api.approveProductAdmin(productId);
    if (result.success) {
      toast.success('Product approved');
      loadData();
    }
  };

  const handleRejectProduct = async (productId: number, reason: string) => {
    const result = await api.rejectProductAdmin(productId, reason);
    if (result.success) {
      toast.success('Product rejected');
      loadData();
    }
  };

  const handleResolveDispute = async (disputeId: number, resolution: string) => {
    const result = await api.resolveDisputeAdmin(disputeId, resolution);
    if (result.success) {
      toast.success('Dispute resolved');
      loadData();
    }
  };

  const handleBulkApprove = async () => {
    const result = await api.bulkActionAdmin('approve', selectedItems);
    if (result.success) {
      toast.success(result.message);
      setSelectedItems([]);
      loadData();
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>;
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      {/* Navigation Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {['overview', 'users', 'products', 'bookings', 'disputes', 'categories', 'reviews', 'settings', 'logs'].map((tab) => (
          <Button
            key={tab}
            variant={activeTab === tab ? 'default' : 'outline'}
            onClick={() => setActiveTab(tab)}
            className="capitalize"
          >
            {tab}
          </Button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold">{stats.total_users}</p>
                  <p className="text-xs text-green-600">{stats.active_users} active</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Products</p>
                  <p className="text-2xl font-bold">{stats.total_products}</p>
                  <p className="text-xs text-yellow-600">{stats.pending_products} pending</p>
                </div>
                <Package className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Revenue</p>
                  <p className="text-2xl font-bold">{(stats.total_revenue || 0).toLocaleString()} RWF</p>
                  <p className="text-xs text-green-600">{(stats.platform_fees || 0).toLocaleString()} fees</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Disputes</p>
                  <p className="text-2xl font-bold">{stats.total_disputes}</p>
                  <p className="text-xs text-red-600">{stats.open_disputes} open</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {users.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{user.name}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <div className="flex gap-2 mt-2">
                      {user.is_verified && <Badge>Verified</Badge>}
                      {!user.is_active && <Badge variant="destructive">Banned</Badge>}
                      {user.is_admin && <Badge variant="secondary">Admin</Badge>}
                      {user.roles && <Badge variant="outline">{user.roles}</Badge>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {!user.is_verified && (
                      <Button size="sm" onClick={() => api.verifyUserAdmin(user.id).then(() => loadData())}>
                        <Shield className="h-4 w-4 mr-1" /> Verify
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant={user.is_active ? 'destructive' : 'default'}
                      onClick={() => user.is_active ? handleBanUser(user.id, 'Admin action') : api.unbanUserAdmin(user.id).then(() => loadData())}
                    >
                      <Ban className="h-4 w-4 mr-1" /> {user.is_active ? 'Ban' : 'Unban'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Products Tab */}
      {activeTab === 'products' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Pending Products</CardTitle>
              {selectedItems.length > 0 && (
                <Button onClick={handleBulkApprove}>
                  Approve Selected ({selectedItems.length})
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {products.map((product) => (
                <div key={product.id} className="flex items-start gap-4 p-4 border rounded-lg">
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(product.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedItems([...selectedItems, product.id]);
                      } else {
                        setSelectedItems(selectedItems.filter(id => id !== product.id));
                      }
                    }}
                    className="mt-1"
                  />
                  {product.images && product.images[0] && (
                    <img src={product.images[0]} alt={product.title} className="w-20 h-20 object-cover rounded" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium">{product.title}</p>
                    <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
                    <div className="flex gap-2 mt-2">
                      <Badge>{product.category_name}</Badge>
                      <Badge variant="outline">{product.owner_name}</Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleApproveProduct(product.id)}>
                      <CheckCircle className="h-4 w-4 mr-1" /> Approve
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleRejectProduct(product.id, 'Does not meet guidelines')}>
                      <XCircle className="h-4 w-4 mr-1" /> Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bookings Tab */}
      {activeTab === 'bookings' && (
        <Card>
          <CardHeader>
            <CardTitle>Bookings Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {bookings.map((booking) => (
                <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{booking.product_title}</p>
                    <p className="text-sm text-muted-foreground">
                      {booking.user_name} → {booking.owner_name}
                    </p>
                    <div className="flex gap-2 mt-2">
                      <Badge>{booking.status}</Badge>
                      <span className="text-sm font-bold">{booking.total_amount} RWF</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => api.refundBookingAdmin(booking.id, booking.total_amount, 'Admin refund').then(() => loadData())}>
                      Refund
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => api.cancelBookingAdmin(booking.id).then(() => loadData())}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Disputes Tab */}
      {activeTab === 'disputes' && (
        <Card>
          <CardHeader>
            <CardTitle>Disputes Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {disputes.map((dispute) => (
                <div key={dispute.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium">{dispute.product_title}</p>
                      <p className="text-sm text-muted-foreground">
                        {dispute.raised_by_name} vs {dispute.against_name}
                      </p>
                      <Badge className="mt-2">{dispute.status}</Badge>
                    </div>
                  </div>
                  <p className="text-sm mb-3">{dispute.description}</p>
                  {dispute.status === 'open' && (
                    <div className="flex gap-2">
                      <Input placeholder="Resolution..." className="flex-1" id={`resolution-${dispute.id}`} />
                      <Button size="sm" onClick={() => {
                        const input = document.getElementById(`resolution-${dispute.id}`) as HTMLInputElement;
                        handleResolveDispute(dispute.id, input.value);
                      }}>
                        Resolve
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <Card>
          <CardHeader>
            <CardTitle>Categories Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {categories.map((category) => (
                <div key={category.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{category.name}</p>
                    <p className="text-sm text-muted-foreground">{category.description}</p>
                    <Badge className="mt-2">{category.product_count} products</Badge>
                  </div>
                  <Button size="sm" variant="destructive" onClick={() => api.deleteCategoryAdmin(category.id).then(() => loadData())}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reviews Tab */}
      {activeTab === 'reviews' && (
        <Card>
          <CardHeader>
            <CardTitle>Reviews Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reviews.map((review) => (
                <div key={review.id} className="flex items-start justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{review.reviewer_name}</p>
                    <p className="text-sm text-muted-foreground">{review.product_title}</p>
                    <p className="text-sm mt-2">{review.comment}</p>
                    <Badge className="mt-2">{review.rating} ⭐</Badge>
                  </div>
                  <Button size="sm" variant="destructive" onClick={() => api.deleteReviewAdmin(review.id).then(() => loadData())}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <Card>
          <CardHeader>
            <CardTitle>System Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {settings.map((setting) => (
                <div key={setting.id} className="flex items-center gap-4">
                  <div className="flex-1">
                    <p className="font-medium">{setting.setting_key}</p>
                    <Input
                      defaultValue={setting.setting_value}
                      id={`setting-${setting.id}`}
                      className="mt-2"
                    />
                  </div>
                  <Button onClick={() => {
                    const input = document.getElementById(`setting-${setting.id}`) as HTMLInputElement;
                    api.updateSettingAdmin(setting.setting_key, input.value).then(() => toast.success('Setting updated'));
                  }}>
                    Save
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Logs Tab */}
      {activeTab === 'logs' && (
        <Card>
          <CardHeader>
            <CardTitle>Activity Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {logs.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-3 border-b">
                  <div>
                    <p className="text-sm font-medium">{log.admin_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {log.action} on {log.entity_type} #{log.entity_id}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(log.created_at).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
