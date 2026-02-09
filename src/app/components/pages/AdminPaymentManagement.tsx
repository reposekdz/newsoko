import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { DollarSign, AlertCircle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { api } from '../../../services/api';
import { toast } from 'sonner';

export function AdminPaymentManagement() {
  const [payments, setPayments] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPayments();
  }, [filter]);

  const loadPayments = async () => {
    try {
      const result = await api.getAdminPaymentsAll(filter, 100);
      if (result.success) setPayments(result.data);
    } catch (error) {
      toast.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'pending': return 'secondary';
      case 'failed': return 'destructive';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'pending': return <RefreshCw className="h-4 w-4" />;
      case 'failed': return <XCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>;

  const totalAmount = payments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
  const completedAmount = payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold mb-6">Payment Management</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Transactions</p>
                <p className="text-2xl font-bold">{payments.length}</p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="text-2xl font-bold">{totalAmount.toLocaleString()} RWF</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{completedAmount.toLocaleString()} RWF</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Payments</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {payments.map((payment) => (
          <Card key={payment.id}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-bold">{payment.user_name}</h3>
                    <Badge variant={getStatusColor(payment.status)} className="flex items-center gap-1">
                      {getStatusIcon(payment.status)}
                      {payment.status}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p><span className="text-muted-foreground">Email:</span> {payment.user_email}</p>
                      <p><span className="text-muted-foreground">Method:</span> {payment.payment_method}</p>
                      <p><span className="text-muted-foreground">Type:</span> {payment.payment_type}</p>
                    </div>
                    <div>
                      <p><span className="text-muted-foreground">Amount:</span> <span className="font-bold">{parseFloat(payment.amount).toLocaleString()} RWF</span></p>
                      <p><span className="text-muted-foreground">Reference:</span> {payment.reference}</p>
                      <p><span className="text-muted-foreground">Date:</span> {new Date(payment.created_at).toLocaleString()}</p>
                    </div>
                  </div>

                  {payment.phone_number && (
                    <p className="text-sm mt-2">
                      <span className="text-muted-foreground">Phone:</span> {payment.phone_number}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  {payment.status === 'pending' && (
                    <>
                      <Button size="sm">Mark Completed</Button>
                      <Button size="sm" variant="destructive">Mark Failed</Button>
                    </>
                  )}
                  {payment.status === 'completed' && (
                    <Button size="sm" variant="outline">View Details</Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {payments.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            No payments found
          </CardContent>
        </Card>
      )}
    </div>
  );
}
