import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Smartphone, Building2, DollarSign, CheckCircle2, Loader2, TrendingUp } from 'lucide-react';
import { api } from '../../../services/api';
import { toast } from 'sonner';

export function InstantPayoutSetup() {
  const [payoutMethod, setPayoutMethod] = useState<'mobile_money' | 'bank_transfer'>('mobile_money');
  const [payoutPhone, setPayoutPhone] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [bankName, setBankName] = useState('');
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const result = await api.get('/advanced_payments.php?payment_analytics');
      if (result.success) {
        setAnalytics(result.analytics);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePayoutMethod = async () => {
    if (payoutMethod === 'mobile_money' && !payoutPhone) {
      toast.error('Please enter your phone number');
      return;
    }
    if (payoutMethod === 'bank_transfer' && (!bankAccount || !bankName)) {
      toast.error('Please enter bank details');
      return;
    }

    setSaving(true);
    try {
      const result = await api.post('/advanced_payments.php', {
        action: 'setup_payout',
        payout_method: payoutMethod,
        payout_phone: payoutPhone,
        payout_bank_account: bankAccount,
        payout_bank_name: bankName
      });

      if (result.success) {
        toast.success('Payout method configured successfully!');
      } else {
        toast.error(result.message || 'Failed to save payout method');
      }
    } catch (error) {
      toast.error('Error saving payout method');
    } finally {
      setSaving(false);
    }
  };

  const requestPayout = async (escrowId: number) => {
    try {
      const result = await api.post('/advanced_payments.php', {
        action: 'request_payout',
        escrow_id: escrowId
      });

      if (result.success) {
        toast.success(`Payout successful! ${result.amount.toLocaleString()} RWF sent to your account`);
        fetchAnalytics();
      } else {
        toast.error(result.message || 'Payout failed');
      }
    } catch (error) {
      toast.error('Error processing payout');
    }
  };

  return (
    <div className="space-y-6">
      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Earnings</p>
                <p className="text-2xl font-bold text-primary">
                  {analytics?.total_earnings?.toLocaleString() || '0'} RWF
                </p>
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
              </div>
              <DollarSign className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Count</p>
                <p className="text-2xl font-bold">
                  {analytics?.pending_count || 0}
                </p>
              </div>
              <Badge variant="secondary" className="text-lg px-3 py-1">
                {analytics?.pending_count || 0}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payout Method Setup */}
      <Card>
        <CardHeader>
          <CardTitle>1-Click Payout Setup</CardTitle>
          <CardDescription>
            Configure your payout method for instant withdrawals (&lt; 30 seconds)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Method Selection */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setPayoutMethod('mobile_money')}
              className={`p-4 border-2 rounded-lg transition-all ${
                payoutMethod === 'mobile_money'
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <Smartphone className="h-6 w-6 mx-auto mb-2 text-primary" />
              <div className="font-bold">Mobile Money</div>
              <div className="text-xs text-muted-foreground">MTN/Airtel • Instant</div>
            </button>

            <button
              onClick={() => setPayoutMethod('bank_transfer')}
              className={`p-4 border-2 rounded-lg transition-all ${
                payoutMethod === 'bank_transfer'
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <Building2 className="h-6 w-6 mx-auto mb-2 text-primary" />
              <div className="font-bold">Bank Transfer</div>
              <div className="text-xs text-muted-foreground">&lt; 5 minutes</div>
            </button>
          </div>

          {/* Mobile Money Form */}
          {payoutMethod === 'mobile_money' && (
            <div>
              <Label htmlFor="payout-phone">Phone Number</Label>
              <Input
                id="payout-phone"
                type="tel"
                placeholder="+250 788 123 456"
                value={payoutPhone}
                onChange={(e) => setPayoutPhone(e.target.value)}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Enter your MTN MoMo or Airtel Money number
              </p>
            </div>
          )}

          {/* Bank Transfer Form */}
          {payoutMethod === 'bank_transfer' && (
            <div className="space-y-3">
              <div>
                <Label htmlFor="bank-name">Bank Name</Label>
                <Input
                  id="bank-name"
                  placeholder="Bank of Kigali"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="bank-account">Account Number</Label>
                <Input
                  id="bank-account"
                  placeholder="1234567890"
                  value={bankAccount}
                  onChange={(e) => setBankAccount(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          )}

          <Button 
            onClick={handleSavePayoutMethod} 
            disabled={saving}
            className="w-full"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Save Payout Method
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      {analytics?.recent_transactions && analytics.recent_transactions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.recent_transactions.map((transaction: any) => (
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
      )}
    </div>
  );
}
