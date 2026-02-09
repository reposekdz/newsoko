import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { TrendingUp, DollarSign, Clock, CheckCircle2, Loader2, ArrowUpRight } from 'lucide-react';
import { api } from '../../../services/api';

export function PaymentAnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const result = await api.getPaymentAnalytics();
      if (result.success) {
        setAnalytics(result.analytics);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Earnings</p>
                <p className="text-2xl font-bold text-primary">
                  {analytics?.total_earnings?.toLocaleString() || '0'} RWF
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <ArrowUpRight className="h-3 w-3 text-green-600" />
                  <span className="text-xs text-green-600">+12.5%</span>
                </div>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Payouts</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {analytics?.pending_amount?.toLocaleString() || '0'} RWF
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {analytics?.pending_count || 0} transactions
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-green-600">
                  {analytics?.completed_count || 0}
                </p>
                <p className="text-xs text-muted-foreground mt-1">This month</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Transaction</p>
                <p className="text-2xl font-bold">
                  {analytics?.avg_transaction?.toLocaleString() || '0'} RWF
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="recent" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="recent">Recent</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value="recent">
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics?.recent_transactions?.map((transaction: any) => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                    <div>
                      <p className="font-medium">{parseFloat(transaction.net_amount).toLocaleString()} RWF</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(transaction.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant={transaction.status === 'released' ? 'default' : 'secondary'}>
                      {transaction.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Pending Payouts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics?.recent_transactions?.filter((t: any) => t.status === 'held').map((transaction: any) => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 bg-yellow-500/10 rounded-lg">
                    <div>
                      <p className="font-medium">{parseFloat(transaction.net_amount).toLocaleString()} RWF</p>
                      <p className="text-xs text-muted-foreground">
                        Auto-release: {new Date(transaction.auto_release_date).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge className="bg-yellow-500">Pending</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed">
          <Card>
            <CardHeader>
              <CardTitle>Completed Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics?.recent_transactions?.filter((t: any) => t.status === 'released').map((transaction: any) => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg">
                    <div>
                      <p className="font-medium">{parseFloat(transaction.net_amount).toLocaleString()} RWF</p>
                      <p className="text-xs text-muted-foreground">
                        Released: {new Date(transaction.released_at).toLocaleDateString()}
                      </p>
                    </div>
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
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
