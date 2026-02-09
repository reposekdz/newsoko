import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Package, DollarSign, TrendingUp, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = 'http://localhost/Rentalsalesmarketplace/api/controllers';

export function SellerOrderManagement() {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({ pending: 0, active: 0, completed: 0, revenue: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_URL}/bookings.php?seller_orders=1`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setOrders(data.data);
        calculateStats(data.data);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (orders) => {
    const stats = {
      pending: orders.filter(o => o.status === 'pending').length,
      active: orders.filter(o => o.status === 'active' || o.status === 'confirmed').length,
      completed: orders.filter(o => o.status === 'completed').length,
      revenue: orders.filter(o => o.seller_payout_status === 'completed').reduce((sum, o) => sum + parseFloat(o.seller_payout_amount || 0), 0)
    };
    setStats(stats);
  };

  const confirmDelivery = async (bookingId) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_URL}/booking_payment.php`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'release_escrow',
          booking_id: bookingId
        })
      });
      
      const data = await response.json();
      if (data.success) {
        toast.success('Payment released to your wallet!');
        loadOrders();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('Failed to release payment');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'confirmed': return <Package className="w-5 h-5 text-blue-500" />;
      case 'active': return <TrendingUp className="w-5 h-5 text-green-500" />;
      case 'completed': return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'cancelled': return <XCircle className="w-5 h-5 text-red-500" />;
      default: return <Clock className="w-5 h-5" />;
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <h1 className="text-3xl font-bold mb-6">Order Management</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold">{stats.active}</p>
              </div>
              <Package className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{stats.completed}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Revenue</p>
                <p className="text-2xl font-bold">{stats.revenue.toLocaleString()} RWF</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="active">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active">Active Orders</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <Card>
            <CardHeader>
              <CardTitle>Active Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orders.filter(o => o.status === 'active' || o.status === 'confirmed').map((order) => (
                  <div key={order.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(order.status)}
                        <div>
                          <h3 className="font-semibold">{order.product_title}</h3>
                          <p className="text-sm text-muted-foreground">Order #{order.id}</p>
                        </div>
                      </div>
                      <Badge>{order.status}</Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Total Amount</p>
                        <p className="font-semibold">{order.total_price?.toLocaleString()} RWF</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Commission</p>
                        <p className="font-semibold text-yellow-600">{order.commission_amount?.toLocaleString()} RWF</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Your Payout</p>
                        <p className="font-semibold text-green-600">{order.seller_payout_amount?.toLocaleString()} RWF</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Payment Status</p>
                        <Badge variant={order.payment_status === 'paid' ? 'default' : 'secondary'}>
                          {order.payment_status}
                        </Badge>
                      </div>
                    </div>

                    {order.payment_status === 'paid' && order.seller_payout_status === 'pending' && (
                      <Button onClick={() => confirmDelivery(order.id)} className="w-full">
                        Confirm Delivery & Release Payment
                      </Button>
                    )}

                    {order.seller_payout_status === 'completed' && (
                      <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
                        <p className="text-sm text-green-800 font-semibold">
                          ✓ Payment released to your wallet
                        </p>
                      </div>
                    )}
                  </div>
                ))}

                {orders.filter(o => o.status === 'active' || o.status === 'confirmed').length === 0 && (
                  <p className="text-center text-muted-foreground py-8">No active orders</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Pending Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orders.filter(o => o.status === 'pending').map((order) => (
                  <div key={order.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(order.status)}
                        <div>
                          <h3 className="font-semibold">{order.product_title}</h3>
                          <p className="text-sm text-muted-foreground">Waiting for payment</p>
                        </div>
                      </div>
                      <Badge variant="secondary">{order.status}</Badge>
                    </div>
                  </div>
                ))}

                {orders.filter(o => o.status === 'pending').length === 0 && (
                  <p className="text-center text-muted-foreground py-8">No pending orders</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed">
          <Card>
            <CardHeader>
              <CardTitle>Completed Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orders.filter(o => o.status === 'completed').map((order) => (
                  <div key={order.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(order.status)}
                        <div>
                          <h3 className="font-semibold">{order.product_title}</h3>
                          <p className="text-sm text-muted-foreground">
                            Completed on {new Date(order.seller_payout_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Badge variant="default">Completed</Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Total</p>
                        <p className="font-semibold">{order.total_price?.toLocaleString()} RWF</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Commission</p>
                        <p className="font-semibold text-yellow-600">-{order.commission_amount?.toLocaleString()} RWF</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Earned</p>
                        <p className="font-semibold text-green-600">{order.seller_payout_amount?.toLocaleString()} RWF</p>
                      </div>
                    </div>
                  </div>
                ))}

                {orders.filter(o => o.status === 'completed').length === 0 && (
                  <p className="text-center text-muted-foreground py-8">No completed orders</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
