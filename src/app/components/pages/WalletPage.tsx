import { Wallet, TrendingUp, TrendingDown, Plus, ArrowDownToLine, CreditCard, Smartphone } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Label } from '../ui/label';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { api, completeApi } from '@/services';
import { useAuth } from '../../../context/AuthContext';

export function WalletPage() {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [showTopup, setShowTopup] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [topupAmount, setTopupAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('mtn');

  useEffect(() => {
    if (user) {
      loadWallet();
      loadTransactions();
    }
  }, [user]);

  const loadWallet = async () => {
    const response = await api.getWalletBalance();
    if (response.success) setBalance(response.data.balance || 0);
  };

  const loadTransactions = async () => {
    const response = await api.getWalletTransactions();
    if (response.success) setTransactions(response.data);
  };

  const handleTopup = async () => {
    const amount = parseFloat(topupAmount);
    if (isNaN(amount) || amount <= 0) return;
    
    const response = await api.topupWallet(amount, paymentMethod);
    if (response.success) {
      setShowTopup(false);
      setTopupAmount('');
      loadWallet();
      loadTransactions();
    }
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0 || amount > balance) return;
    
    const response = await api.withdrawWallet(amount, phoneNumber);
    if (response.success) {
      setShowWithdraw(false);
      setWithdrawAmount('');
      setPhoneNumber('');
      loadWallet();
      loadTransactions();
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-muted-foreground">Please login to view wallet</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Wallet className="h-8 w-8" />
          My Wallet
        </h1>
      </div>

      <Card className="border-2 border-primary">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Available Balance</p>
              <h2 className="text-5xl font-bold text-primary">{balance.toLocaleString()} RWF</h2>
            </div>
            
            <div className="flex gap-3 justify-center">
              <Dialog open={showTopup} onOpenChange={setShowTopup}>
                <DialogTrigger asChild>
                  <Button size="lg">
                    <Plus className="h-5 w-5 mr-2" />
                    Top Up
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Top Up Wallet</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Amount (RWF)</Label>
                      <Input 
                        type="number" 
                        placeholder="Enter amount"
                        value={topupAmount}
                        onChange={(e) => setTopupAmount(e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <Label>Payment Method</Label>
                      <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                        <div className="flex items-center space-x-2 p-3 border rounded-lg">
                          <RadioGroupItem value="mtn" id="mtn" />
                          <Label htmlFor="mtn" className="flex items-center gap-2 cursor-pointer flex-1">
                            <Smartphone className="h-5 w-5" />
                            MTN Mobile Money
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2 p-3 border rounded-lg">
                          <RadioGroupItem value="airtel" id="airtel" />
                          <Label htmlFor="airtel" className="flex items-center gap-2 cursor-pointer flex-1">
                            <Smartphone className="h-5 w-5" />
                            Airtel Money
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>
                    
                    <Button className="w-full" onClick={handleTopup}>
                      Confirm Top Up
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={showWithdraw} onOpenChange={setShowWithdraw}>
                <DialogTrigger asChild>
                  <Button size="lg" variant="outline">
                    <ArrowDownToLine className="h-5 w-5 mr-2" />
                    Withdraw
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Withdraw Funds</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Amount (RWF)</Label>
                      <Input 
                        type="number" 
                        placeholder="Enter amount"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        max={balance}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Available: {balance.toLocaleString()} RWF
                      </p>
                    </div>
                    
                    <div>
                      <Label>Phone Number</Label>
                      <Input 
                        type="tel" 
                        placeholder="078XXXXXXX"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                      />
                    </div>
                    
                    <Button className="w-full" onClick={handleWithdraw}>
                      Confirm Withdrawal
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {transactions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No transactions yet</p>
            ) : (
              transactions.map((txn) => (
                <div key={txn.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${txn.type === 'credit' ? 'bg-green-100' : 'bg-red-100'}`}>
                      {txn.type === 'credit' ? (
                        <TrendingUp className="h-5 w-5 text-green-600" />
                      ) : (
                        <TrendingDown className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-bold">{txn.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(txn.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${txn.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                      {txn.type === 'credit' ? '+' : '-'}{txn.amount.toLocaleString()} RWF
                    </p>
                    <Badge variant="outline">{txn.payment_method}</Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
