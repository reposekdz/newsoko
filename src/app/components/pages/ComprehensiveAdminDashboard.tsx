import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { 
  TrendingUp, Users, Package, DollarSign, ShoppingCart, AlertTriangle, 
  CheckCircle, Clock, Activity, BarChart3, PieChart, Download 
} from 'lucide-react';
import { api } from '../../../services/api';
import { toast } from 'sonner';

export function ComprehensiveAdminDashboard() {
  const [stats, setStats] = useState<any>({});
  const [revenue, setRevenue] = useState<any>({});
  const [users, setUsers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [walletTxns, setWalletTxns] = useState<any[]>([]);
  const [fraudLogs, setFraudLogs] = useState<any[]>([]);
  const [period, setPeriod] = useState('30');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllData();
    const interval = setInterval(loadAllData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [period]);

  const loadAllData = async () => {
    try {
      const [
        statsRes,
        revenueRes,
        usersRes,
        productsRes,
        bookingsRes,
        disputesRes,
        walletRes,
        fraudRes
      ] = await Promise.all([
        api.getAdminDashboard(),
        api.getAdminRevenueAnalytics(parseInt(period)),
        api.getAdminUsersList('', 'all', 10, 0),
        api.getAdminProductsPending(),
        api.getAdminBookingsAll('all'),
        api.getAdminDisputesAll('open'),
        api.getAdminWalletTransactions(),
        api.getAdminFraudLogsAll()
      ]);

      if (statsRes.success) setStats(statsRes.data);
      if (revenueRes.success) setRevenue(revenueRes.data);
      if (usersRes.success) setUsers(usersRes.data);
      if (productsRes.success) setProducts(productsRes.data);
      if (bookingsRes.success) setBookings(bookingsRes.data);
      if (disputesRes.success) setDisputes(disputesRes.data);
      if (walletRes.success) setWalletTxns(walletRes.data);
      if (fraudRes.success) setFraudLogs(fraudRes.data);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const exportData = async (type: string) => {
    const result = await api.exportDataAdmin(type);
    if (result.success) {
      const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}-${Date.now()}.json`;
      a.click();
      toast.success(`${type} data exported`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <div className="flex gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => loadAllData()}>
            <Activity className="h-4 w-4 mr-2" /> Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <h3 className="text-3xl font-bold">{stats.total_users || 0}</h3>
                <p className="text-xs text-green-600 mt-1">
                  {stats.verified_users || 0} verified
                </p>
              </div>
              <Users className="h-12 w-12 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Products</p>
                <h3 className="text-3xl font-bold">{stats.total_products || 0}</h3>
                <p className="text-xs text-yellow-600 mt-1">
                  {stats.pending_products || 0} pending
                </p>
              </div>
              <Package className="h-12 w-12 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <h3 className="text-3xl font-bold">
                  {(stats.total_revenue || 0).toLocaleString()}
                </h3>
                <p className="text-xs text-green-600 mt-1">
                  {(stats.commission_earned || 0).toLocaleString()} commission
                </p>
              </div>
              <DollarSign className="h-12 w-12 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Bookings</p>
                <h3 className="text-3xl font-bold">{stats.active_bookings || 0}</h3>
                <p className="text-xs text-blue-600 mt-1">
                  {stats.completed_bookings || 0} completed
                </p>
              </div>
              <ShoppingCart className="h-12 w-12 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts & Warnings */}
      {(stats.pending_products > 0 || stats.pending_disputes > 0 || fraudLogs.length > 0) && (
        <Card className="border-yellow-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Requires Attention
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {stats.pending_products > 0 && (
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <p className="font-bold text-lg">{stats.pending_products}</p>
                  <p className="text-sm text-muted-foreground">Products awaiting approval</p>
                </div>
              )}
              {stats.pending_disputes > 0 && (
                <div className="p-4 bg-red-50 rounded-lg">
                  <p className="font-bold text-lg">{stats.pending_disputes}</p>
                  <p className="text-sm text-muted-foreground">Open disputes</p>
                </div>
              )}
              {fraudLogs.length > 0 && (
                <div className="p-4 bg-orange-50 rounded-lg">
                  <p className="font-bold text-lg">{fraudLogs.length}</p>
                  <p className="text-sm text-muted-foreground">Fraud alerts</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="disputes">Disputes</TabsTrigger>
          <TabsTrigger value="wallet">Wallet</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
              </CardHeader>
              <CardContent>
                {revenue.daily_revenue?.slice(0, 7).map((day: any) => (
                  <div key={day.date} className="flex items-center justify-between py-2 border-b">
                    <span className="text-sm">{new Date(day.date).toLocaleDateString()}</span>
                    <div className="text-right">
                      <p className="font-bold">{parseFloat(day.revenue || 0).toLocaleString()} RWF</p>
                      <p className="text-xs text-muted-foreground">{day.transaction_count} txns</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Platform Health</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span>User Verification Rate</span>
                  <Badge variant="default">
                    {((stats.verified_users / stats.total_users) * 100).toFixed(1)}%
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Product Approval Rate</span>
                  <Badge variant="default">
                    {((stats.approved_products / stats.total_products) * 100).toFixed(1)}%
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Booking Completion Rate</span>
                  <Badge variant="default">
                    {((stats.completed_bookings / stats.total_bookings) * 100).toFixed(1)}%
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Wallet Balance</span>
                  <Badge variant="secondary">
                    {(stats.wallet_balance || 0).toLocaleString()} RWF
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold">Recent Users</h3>
            <Button onClick={() => exportData('users')} size="sm">
              <Download className="h-4 w-4 mr-2" /> Export
            </Button>
          </div>
          {users.slice(0, 10).map((user) => (
            <Card key={user.id}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold">{user.name}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <div className="flex gap-2 mt-2">
                      {user.is_verified && <Badge>Verified</Badge>}
                      {user.is_admin && <Badge variant="secondary">Admin</Badge>}
                      {!user.is_active && <Badge variant="destructive">Banned</Badge>}
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <p>{user.product_count || 0} products</p>
                    <p>{user.booking_count || 0} bookings</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold">Pending Products ({products.length})</h3>
            <Button onClick={() => exportData('products')} size="sm">
              <Download className="h-4 w-4 mr-2" /> Export
            </Button>
          </div>
          {products.slice(0, 10).map((product) => (
            <Card key={product.id}>
              <CardContent className="pt-4">
                <div className="flex gap-4">
                  <img src={product.images?.[0]} alt={product.title} className="w-20 h-20 object-cover rounded" />
                  <div className="flex-1">
                    <p className="font-bold">{product.title}</p>
                    <p className="text-sm text-muted-foreground">{product.owner_name}</p>
                    <div className="flex gap-2 mt-2">
                      <Badge>{product.category_name}</Badge>
                      {product.ai_fraud_score > 0.5 && (
                        <Badge variant="destructive">High Risk</Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{product.rent_price || product.buy_price} RWF</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(product.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="bookings" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold">Recent Bookings ({bookings.length})</h3>
            <Button onClick={() => exportData('bookings')} size="sm">
              <Download className="h-4 w-4 mr-2" /> Export
            </Button>
          </div>
          {bookings.slice(0, 10).map((booking) => (
            <Card key={booking.id}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold">{booking.product_title}</p>
                    <p className="text-sm text-muted-foreground">
                      {booking.renter_name} → {booking.owner_name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(booking.start_date).toLocaleDateString()} - {new Date(booking.end_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{booking.total_amount} RWF</p>
                    <Badge variant={
                      booking.status === 'completed' ? 'default' :
                      booking.status === 'active' ? 'secondary' : 'outline'
                    }>
                      {booking.status}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="disputes" className="space-y-4">
          <h3 className="text-lg font-bold">Open Disputes ({disputes.length})</h3>
          {disputes.map((dispute) => (
            <Card key={dispute.id} className="border-red-200">
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-bold">{dispute.product_title}</p>
                    <p className="text-sm text-muted-foreground">
                      {dispute.filed_by_name} vs {dispute.against_name}
                    </p>
                    <p className="text-sm mt-2">{dispute.reason}</p>
                    <Badge variant="destructive" className="mt-2">{dispute.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(dispute.created_at).toLocaleDateString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="wallet" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Total Wallet Balance</p>
                <p className="text-2xl font-bold">{(stats.wallet_balance || 0).toLocaleString()} RWF</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Commission Earned</p>
                <p className="text-2xl font-bold">{(stats.commission_earned || 0).toLocaleString()} RWF</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Total Transactions</p>
                <p className="text-2xl font-bold">{walletTxns.length}</p>
              </CardContent>
            </Card>
          </div>

          <h3 className="text-lg font-bold">Recent Wallet Transactions</h3>
          {walletTxns.slice(0, 20).map((txn) => (
            <Card key={txn.id}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold">{txn.user_name}</p>
                    <p className="text-sm text-muted-foreground">{txn.transaction_type}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(txn.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">{txn.amount} RWF</p>
                    {txn.commission_amount > 0 && (
                      <p className="text-xs text-green-600">
                        Commission: {txn.commission_amount} RWF
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Balance: {txn.current_balance} RWF
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
