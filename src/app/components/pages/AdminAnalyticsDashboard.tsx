import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { TrendingUp, Users, DollarSign, Package, Activity } from 'lucide-react';
import { api } from '../../../services/api';
import { toast } from 'sonner';

export function AdminAnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [revenue, setRevenue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const [statsData, revenueData] = await Promise.all([
        api.getAdminStatsComplete(),
        api.getRevenueAnalytics(30)
      ]);
      
      if (statsData.success) setAnalytics(statsData.data);
      if (revenueData.success) setRevenue(revenueData.data);
    } catch (error) {
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>;

  const totalRevenue = revenue.reduce((sum, day) => sum + parseFloat(day.total_revenue || 0), 0);
  const avgTransaction = revenue.reduce((sum, day) => sum + parseFloat(day.avg_transaction || 0), 0) / (revenue.length || 1);

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold mb-6">Analytics Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">{totalRevenue.toLocaleString()} RWF</p>
                <p className="text-xs text-green-600">Last 30 days</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Transaction</p>
                <p className="text-2xl font-bold">{avgTransaction.toLocaleString()} RWF</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Users</p>
                <p className="text-2xl font-bold">{analytics?.active_users || 0}</p>
                <p className="text-xs text-muted-foreground">of {analytics?.total_users || 0} total</p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Products</p>
                <p className="text-2xl font-bold">{analytics?.approved_products || 0}</p>
                <p className="text-xs text-yellow-600">{analytics?.pending_products || 0} pending</p>
              </div>
              <Package className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Revenue Trend (30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {revenue.slice(0, 10).map((day, index) => (
              <div key={index} className="flex items-center justify-between p-3 border-b">
                <span className="text-sm">{new Date(day.date).toLocaleDateString()}</span>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium">{parseFloat(day.total_revenue).toLocaleString()} RWF</span>
                  <span className="text-xs text-muted-foreground">{day.transaction_count} transactions</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
