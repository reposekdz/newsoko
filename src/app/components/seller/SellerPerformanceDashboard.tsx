import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { TrendingUp, DollarSign, Star, Clock, CheckCircle2, XCircle, Users, AlertTriangle, Loader2 } from 'lucide-react';
import { api } from '../../../services/api';
import { useToast } from '../ui/use-toast';

export function SellerPerformanceDashboard() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const result = await api.getSellerMetrics();
      if (result.success) {
        setMetrics(result.metrics);
      }
    } catch (error) {
      toast({ title: 'Failed to load metrics', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const getPerformanceColor = (rate: number) => {
    if (rate >= 90) return 'text-green-600';
    if (rate >= 70) return 'text-yellow-600';
    return 'text-red-600';
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Sales</p>
                <p className="text-3xl font-bold text-primary">{metrics?.total_sales || 0}</p>
              </div>
              <TrendingUp className="h-10 w-10 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">
                  {parseFloat(metrics?.total_revenue || 0).toLocaleString()} RWF
                </p>
              </div>
              <DollarSign className="h-10 w-10 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Rating</p>
                <p className="text-3xl font-bold text-yellow-600">
                  {parseFloat(metrics?.avg_rating || 0).toFixed(1)}
                </p>
              </div>
              <Star className="h-10 w-10 text-yellow-600 fill-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Response Time</p>
                <p className="text-2xl font-bold">{metrics?.response_time_minutes || 0} min</p>
              </div>
              <Clock className="h-10 w-10 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Performance Rates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span>Completion Rate</span>
              </div>
              <span className={`text-xl font-bold ${getPerformanceColor(metrics?.completion_rate || 0)}`}>
                {parseFloat(metrics?.completion_rate || 0).toFixed(1)}%
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-600" />
                <span>Cancellation Rate</span>
              </div>
              <span className={`text-xl font-bold ${metrics?.cancellation_rate > 10 ? 'text-red-600' : 'text-green-600'}`}>
                {parseFloat(metrics?.cancellation_rate || 0).toFixed(1)}%
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <span>Dispute Rate</span>
              </div>
              <span className={`text-xl font-bold ${metrics?.dispute_rate > 5 ? 'text-red-600' : 'text-green-600'}`}>
                {parseFloat(metrics?.dispute_rate || 0).toFixed(1)}%
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                <span>Repeat Customer Rate</span>
              </div>
              <span className={`text-xl font-bold ${getPerformanceColor(metrics?.repeat_customer_rate || 0)}`}>
                {parseFloat(metrics?.repeat_customer_rate || 0).toFixed(1)}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {parseFloat(metrics?.completion_rate || 0) >= 95 && (
              <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                <p className="font-semibold text-green-600">Excellent Performance!</p>
                <p className="text-sm text-muted-foreground">Your completion rate is outstanding</p>
              </div>
            )}

            {parseFloat(metrics?.avg_rating || 0) >= 4.5 && (
              <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <p className="font-semibold text-yellow-600">Top Rated Seller!</p>
                <p className="text-sm text-muted-foreground">Customers love your service</p>
              </div>
            )}

            {metrics?.response_time_minutes < 30 && (
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="font-semibold text-blue-600">Fast Responder!</p>
                <p className="text-sm text-muted-foreground">You respond quickly to customers</p>
              </div>
            )}

            {parseFloat(metrics?.cancellation_rate || 0) > 10 && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="font-semibold text-red-600">High Cancellation Rate</p>
                <p className="text-sm text-muted-foreground">Try to reduce cancellations to improve performance</p>
              </div>
            )}

            {parseFloat(metrics?.repeat_customer_rate || 0) >= 30 && (
              <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                <p className="font-semibold text-purple-600">Customer Loyalty!</p>
                <p className="text-sm text-muted-foreground">Many customers return to buy from you</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Performance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-primary">{metrics?.total_sales || 0}</p>
              <p className="text-sm text-muted-foreground">Total Orders</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">
                {parseFloat(metrics?.total_revenue || 0).toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">Revenue (RWF)</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-600">
                {parseFloat(metrics?.avg_rating || 0).toFixed(1)}/5.0
              </p>
              <p className="text-sm text-muted-foreground">Average Rating</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">{metrics?.response_time_minutes || 0}</p>
              <p className="text-sm text-muted-foreground">Avg Response (min)</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
