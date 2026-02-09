import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { TrendingUp, Users, DollarSign, ShoppingBag, Loader2 } from 'lucide-react';
import { api } from '../../../services/api';
import { useToast } from '../ui/use-toast';

export function PlatformAnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [periodType, setPeriodType] = useState('daily');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchAnalytics();
  }, [periodType]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const result = await api.getPlatformAnalytics(periodType);
      if (result.success) {
        setAnalytics(result.analytics);
      }
    } catch (error) {
      toast({ title: 'Failed to load analytics', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Platform Analytics</h2>
        <Select value={periodType} onValueChange={setPeriodType}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="hourly">Hourly</SelectItem>
            <SelectItem value="daily">Daily</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-3xl font-bold text-primary">{analytics?.total_users || 0}</p>
                <p className="text-xs text-green-600 mt-1">+{analytics?.new_users || 0} new</p>
              </div>
              <Users className="h-10 w-10 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">
                  {parseFloat(analytics?.total_revenue || 0).toLocaleString()} RWF
                </p>
                <p className="text-xs text-green-600 mt-1">+{analytics?.revenue_growth || 0}%</p>
              </div>
              <DollarSign className="h-10 w-10 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Orders</p>
                <p className="text-3xl font-bold text-blue-600">{analytics?.total_orders || 0}</p>
                <p className="text-xs text-blue-600 mt-1">+{analytics?.order_growth || 0}%</p>
              </div>
              <ShoppingBag className="h-10 w-10 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Order Value</p>
                <p className="text-2xl font-bold">
                  {parseFloat(analytics?.avg_order_value || 0).toLocaleString()} RWF
                </p>
              </div>
              <TrendingUp className="h-10 w-10 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(analytics?.top_categories || []).map((cat: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                  <span className="font-medium">{cat.category}</span>
                  <span className="text-primary font-bold">{cat.count} items</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Platform Health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg">
              <span>Active Listings</span>
              <span className="font-bold text-green-600">{analytics?.active_listings || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-500/10 rounded-lg">
              <span>Pending Approvals</span>
              <span className="font-bold text-blue-600">{analytics?.pending_approvals || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-500/10 rounded-lg">
              <span>Open Disputes</span>
              <span className="font-bold text-yellow-600">{analytics?.open_disputes || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-purple-500/10 rounded-lg">
              <span>Support Tickets</span>
              <span className="font-bold text-purple-600">{analytics?.open_tickets || 0}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
