import { Users, Package, ShoppingCart, DollarSign, Shield, Settings, Activity, AlertCircle, CheckCircle, XCircle, Eye, Edit, Trash2, UserPlus, Ban, FileText, MessageSquare, TrendingUp, Database, Bell, Lock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { api } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import { toast } from 'sonner';

export function SuperAdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>({});
  const [users, setUsers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [settings, setSettings] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState('');

  useEffect(() => {
    if (user?.is_admin) loadData();
  }, [user]);

  const loadData = async () => {
    try {
      const [statsRes, usersRes, productsRes, bookingsRes, disputesRes, reviewsRes, rolesRes, categoriesRes, logsRes, settingsRes] = await Promise.all([
        api.get('/admin_advanced.php?action=stats'),
        api.get('/admin_advanced.php?action=users'),
        api.get('/admin_advanced.php?action=pending_approvals'),
        api.get('/admin_advanced.php?action=bookings'),
        api.get('/admin_advanced.php?action=disputes'),
        api.get('/admin_advanced.php?action=reviews'),
        api.get('/admin_advanced.php?action=roles'),
        api.get('/admin_advanced.php?action=categories'),
        api.get('/admin_advanced.php?action=logs&limit=50'),
        api.get('/admin_advanced.php?action=system_settings')
      ]);
      
      if (statsRes.success) setStats(statsRes.data);
      if (usersRes.success) setUsers(usersRes.data);
      if (productsRes.success) setProducts(productsRes.data);
      if (bookingsRes.success) setBookings(bookingsRes.data);
      if (disputesRes.success) setDisputes(disputesRes.data);
      if (reviewsRes.success) setReviews(reviewsRes.data);
      if (rolesRes.success) setRoles(rolesRes.data);
      if (categoriesRes.success) setCategories(categoriesRes.data);
      if (logsRes.success) setLogs(logsRes.data);
      if (settingsRes.success) setSettings(settingsRes.data);
    } catch (error) {
      toast.error('Failed to load data');
    }
  };

  const handleAction = async (action: string, data: any) => {
    try {
      const response = await api.post('/admin_advanced.php', { action, ...data });
      if (response.success) {
        toast.success(response.message);
        loadData();
        setDialogOpen('');
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      toast.error('Action failed');
    }
  };

  if (!user?.is_admin) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <Lock className="h-16 w-16 mx-auto text-red-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
        <p className="text-muted-foreground">Admin privileges required</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Shield className="h-8 w-8 text-primary" />
          Super Admin Control Panel
        </h1>
        <Badge variant="default" className="text-lg px-4 py-2">
          {user.name}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <h3 className="text-3xl font-bold">{stats.total_users || 0}</h3>
                <p className="text-xs text-green-600 mt-1">+{stats.active_users || 0} active</p>
              </div>
              <Users className="h-12 w-12 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Products</p>
                <h3 className="text-3xl font-bold">{stats.total_products || 0}</h3>
                <p className="text-xs text-yellow-600 mt-1">{stats.pending_products || 0} pending</p>
              </div>
              <Package className="h-12 w-12 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Bookings</p>
                <h3 className="text-3xl font-bold">{stats.total_bookings || 0}</h3>
                <p className="text-xs text-blue-600 mt-1">{stats.completed_bookings || 0} completed</p>
              </div>
              <ShoppingCart className="h-12 w-12 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Revenue</p>
                <h3 className="text-2xl font-bold">{(stats.total_revenue || 0).toLocaleString()} RWF</h3>
                <p className="text-xs text-green-600 mt-1">Fees: {(stats.platform_fees || 0).toLocaleString()}</p>
              </div>
              <DollarSign className="h-12 w-12 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="disputes">Disputes</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>User Management</span>
                <Button onClick={() => setDialogOpen('notification')}>
                  <Bell className="h-4 w-4 mr-2" />
                  Send Notification
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {users.map((u) => (
                  <div key={u.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <Users className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="font-bold">{u.name}</p>
                        <p className="text-sm text-muted-foreground">{u.email}</p>
                        <div className="flex gap-2 mt-1">
                          {u.is_verified && <Badge variant="outline">Verified</Badge>}
                          {u.is_active ? <Badge>Active</Badge> : <Badge variant="destructive">Banned</Badge>}
                          {u.roles && <Badge variant="secondary">{u.roles}</Badge>}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => { setSelectedItem(u); setDialogOpen('edit-user'); }}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => { setSelectedItem(u); setDialogOpen('assign-role'); }}>
                        <UserPlus className="h-4 w-4" />
                      </Button>
                      {!u.is_verified && (
                        <Button size="sm" onClick={() => handleAction('verify_user', { user_id: u.id })}>
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                      <Button size="sm" variant={u.is_active ? 'destructive' : 'default'} 
                        onClick={() => handleAction(u.is_active ? 'ban_user' : 'unban_user', { user_id: u.id, reason: 'Admin action' })}>
                        <Ban className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => {
                        if (confirm('Delete user permanently?')) handleAction('delete_user', { user_id: u.id });
                      }}>
                        <Trash2 className="h-4 w-4" />
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
              <CardTitle>Product Approvals & Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {products.map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <img src={p.images?.[0] || '/placeholder.png'} alt={p.title} className="w-20 h-20 object-cover rounded" />
                      <div>
                        <p className="font-bold">{p.title}</p>
                        <p className="text-sm text-muted-foreground">{p.owner_name}</p>
                        <p className="text-sm">
                          {p.rent_price && `Rent: ${p.rent_price} RWF`}
                          {p.buy_price && ` | Buy: ${p.buy_price} RWF`}
                        </p>
                        <Badge variant="secondary" className="mt-1">{p.category_name}</Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleAction('approve_product', { product_id: p.id })}>
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => { setSelectedItem(p); setDialogOpen('reject-product'); }}>
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => { setSelectedItem(p); setDialogOpen('edit-product'); }}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => {
                        if (confirm('Delete product?')) handleAction('delete_user', { product_id: p.id });
                      }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bookings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Booking Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {bookings.map((b) => (
                  <div key={b.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-bold">{b.product_title}</p>
                      <p className="text-sm text-muted-foreground">
                        {b.user_name} → {b.owner_name}
                      </p>
                      <p className="text-sm">Amount: {b.total_amount} RWF</p>
                      <Badge className="mt-1">{b.status}</Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => { setSelectedItem(b); setDialogOpen('cancel-booking'); }}>
                        Cancel
                      </Button>
                      <Button size="sm" onClick={() => { setSelectedItem(b); setDialogOpen('refund-booking'); }}>
                        Refund
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="disputes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Dispute Resolution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {disputes.map((d) => (
                  <div key={d.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-bold">{d.raised_by_name} vs {d.against_name}</p>
                      <Badge variant={d.status === 'open' ? 'destructive' : 'default'}>{d.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{d.reason}</p>
                    {d.status === 'open' && (
                      <Button size="sm" onClick={() => { setSelectedItem(d); setDialogOpen('resolve-dispute'); }}>
                        Resolve
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reviews" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Review Moderation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {reviews.map((r) => (
                  <div key={r.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-bold">{r.reviewer_name} - {r.product_title}</p>
                      <p className="text-sm text-muted-foreground">{r.comment}</p>
                      <Badge className="mt-1">{r.rating} ⭐</Badge>
                    </div>
                    <Button size="sm" variant="destructive" onClick={() => {
                      if (confirm('Delete review?')) handleAction('delete_review', { review_id: r.id });
                    }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
                <Button onClick={() => setDialogOpen('create-category')}>Add Category</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {categories.map((cat) => (
                  <div key={cat.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-bold">{cat.name}</p>
                      {cat.parent_name && <p className="text-sm text-muted-foreground">Parent: {cat.parent_name}</p>}
                      <p className="text-xs text-muted-foreground">{cat.product_count || 0} products</p>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant={cat.is_active ? 'default' : 'secondary'}>{cat.is_active ? 'Active' : 'Inactive'}</Badge>
                      <Button size="sm" variant="outline" onClick={() => { setSelectedItem(cat); setDialogOpen('edit-category'); }}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {settings.map((s) => (
                  <div key={s.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-bold">{s.setting_key}</p>
                      <p className="text-sm text-muted-foreground">{s.setting_value}</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => { setSelectedItem(s); setDialogOpen('edit-setting'); }}>
                      <Edit className="h-4 w-4" />
                    </Button>
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
                  <div key={log.id} className="flex items-center gap-3 p-3 border rounded-lg text-sm">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p><span className="font-bold">{log.admin_name}</span> {log.action} {log.entity_type}</p>
                      <p className="text-xs text-muted-foreground">{new Date(log.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <Dialog open={dialogOpen === 'assign-role'} onOpenChange={(open) => !open && setDialogOpen('')}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Role to {selectedItem?.name}</DialogTitle>
          </DialogHeader>
          <Select onValueChange={(value) => handleAction('assign_role', { user_id: selectedItem?.id, role_id: parseInt(value) })}>
            <SelectTrigger>
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              {roles.map((role) => (
                <SelectItem key={role.id} value={role.id.toString()}>{role.display_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogOpen === 'notification'} onOpenChange={(open) => !open && setDialogOpen('')}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Notification</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Target</Label>
              <Select defaultValue="all">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="single">Single User</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Title</Label>
              <Input id="notif-title" placeholder="Notification title" />
            </div>
            <div>
              <Label>Message</Label>
              <Textarea id="notif-message" placeholder="Notification message" />
            </div>
            <Button onClick={() => {
              const title = (document.getElementById('notif-title') as HTMLInputElement).value;
              const message = (document.getElementById('notif-message') as HTMLTextAreaElement).value;
              handleAction('send_notification', { target: 'all', type: 'system', title, message });
            }}>
              Send
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogOpen === 'resolve-dispute'} onOpenChange={(open) => !open && setDialogOpen('')}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Dispute</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea id="resolution" placeholder="Enter resolution details" />
            <Button onClick={() => {
              const resolution = (document.getElementById('resolution') as HTMLTextAreaElement).value;
              handleAction('resolve_dispute', { dispute_id: selectedItem?.id, resolution });
            }}>
              Resolve
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogOpen === 'refund-booking'} onOpenChange={(open) => !open && setDialogOpen('')}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Refund Booking</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Amount</Label>
              <Input id="refund-amount" type="number" defaultValue={selectedItem?.total_amount} />
            </div>
            <div>
              <Label>Reason</Label>
              <Textarea id="refund-reason" placeholder="Refund reason" />
            </div>
            <Button onClick={() => {
              const amount = (document.getElementById('refund-amount') as HTMLInputElement).value;
              const reason = (document.getElementById('refund-reason') as HTMLTextAreaElement).value;
              handleAction('refund_booking', { booking_id: selectedItem?.id, amount, reason });
            }}>
              Process Refund
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
