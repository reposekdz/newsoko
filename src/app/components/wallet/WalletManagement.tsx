import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Wallet, Plus, Minus, TrendingUp, ArrowUpRight, ArrowDownLeft, Loader2 } from 'lucide-react';
import { api } from '../../../services/api';
import { useToast } from '../ui/use-toast';

export function WalletManagement() {
  const [wallet, setWallet] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    setLoading(true);
    try {
      const [walletResult, transactionsResult] = await Promise.all([
        api.getWalletBalance(),
        api.getWalletTransactions()
      ]);
      
      if (walletResult.success) setWallet(walletResult.wallet);
      if (transactionsResult.success) setTransactions(transactionsResult.transactions);
    } catch (error) {
      toast({ title: 'Failed to load wallet', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const addFunds = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({ title: 'Enter valid amount', variant: 'destructive' });
      return;
    }
    if (!phoneNumber) {
      toast({ title: 'Enter phone number', variant: 'destructive' });
      return;
    }

    setProcessing(true);
    try {
      const result = await api.addWalletFunds(parseFloat(amount), 'mobile_money', phoneNumber);
      if (result.success) {
        toast({ title: 'Funds added successfully' });
        setAmount('');
        setPhoneNumber('');
        fetchWalletData();
      } else {
        toast({ title: result.message || 'Failed to add funds', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Transaction failed', variant: 'destructive' });
    } finally {
      setProcessing(false);
    }
  };

  const withdrawFunds = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({ title: 'Enter valid amount', variant: 'destructive' });
      return;
    }
    if (!phoneNumber) {
      toast({ title: 'Enter phone number', variant: 'destructive' });
      return;
    }

    setProcessing(true);
    try {
      const result = await api.withdrawWalletFunds(parseFloat(amount), 'mobile_money', phoneNumber);
      if (result.success) {
        toast({ title: 'Withdrawal successful' });
        setAmount('');
        setPhoneNumber('');
        fetchWalletData();
      } else {
        toast({ title: result.message || 'Withdrawal failed', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Transaction failed', variant: 'destructive' });
    } finally {
      setProcessing(false);
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Available Balance</p>
                <p className="text-3xl font-bold text-primary">
                  {parseFloat(wallet?.balance || 0).toLocaleString()} RWF
                </p>
              </div>
              <Wallet className="h-10 w-10 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Earned</p>
                <p className="text-2xl font-bold text-green-600">
                  {parseFloat(wallet?.total_earned || 0).toLocaleString()} RWF
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
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {parseFloat(wallet?.pending_balance || 0).toLocaleString()} RWF
                </p>
              </div>
              <ArrowUpRight className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="add" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="add">Add Funds</TabsTrigger>
          <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="add">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Add Funds to Wallet
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Amount (RWF)</Label>
                <Input type="number" placeholder="10000" value={amount} onChange={(e) => setAmount(e.target.value)} />
              </div>
              <div>
                <Label>Mobile Money Number</Label>
                <Input type="tel" placeholder="078XXXXXXX" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
              </div>
              <Button onClick={addFunds} disabled={processing} className="w-full">
                {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                Add Funds
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="withdraw">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Minus className="h-5 w-5" />
                Withdraw Funds
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Amount (RWF)</Label>
                <Input type="number" placeholder="10000" value={amount} onChange={(e) => setAmount(e.target.value)} />
                <p className="text-xs text-muted-foreground mt-1">
                  Available: {parseFloat(wallet?.balance || 0).toLocaleString()} RWF
                </p>
              </div>
              <div>
                <Label>Mobile Money Number</Label>
                <Input type="tel" placeholder="078XXXXXXX" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
              </div>
              <Button onClick={withdrawFunds} disabled={processing} className="w-full" variant="destructive">
                {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Minus className="h-4 w-4 mr-2" />}
                Withdraw
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      {transaction.type === 'credit' ? (
                        <ArrowDownLeft className="h-5 w-5 text-green-600" />
                      ) : (
                        <ArrowUpRight className="h-5 w-5 text-red-600" />
                      )}
                      <div>
                        <p className="font-medium">{transaction.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(transaction.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                        {transaction.type === 'credit' ? '+' : '-'}{parseFloat(transaction.amount).toLocaleString()} RWF
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Balance: {parseFloat(transaction.balance_after).toLocaleString()}
                      </p>
                    </div>
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
