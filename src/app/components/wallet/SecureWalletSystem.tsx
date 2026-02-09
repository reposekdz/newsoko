import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Wallet, Lock, Send, TrendingUp, Shield, Eye, EyeOff, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = 'http://localhost/Rentalsalesmarketplace/api/controllers';

export function SecureWalletSystem() {
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSetup, setShowSetup] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawPin, setWithdrawPin] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [requestId, setRequestId] = useState(null);
  const [showOtp, setShowOtp] = useState(false);

  useEffect(() => {
    loadWallet();
    loadTransactions();
  }, []);

  const loadWallet = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_URL}/secure_wallet.php?wallet_info=1`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setWallet(data.data);
      } else if (data.message.includes('not found')) {
        setShowSetup(true);
      }
    } catch (error) {
      console.error('Error loading wallet:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_URL}/secure_wallet.php?transactions=1&limit=20`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setTransactions(data.data);
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  const setupWallet = async () => {
    if (pin !== confirmPin) {
      toast.error('PINs do not match');
      return;
    }
    if (pin.length !== 4) {
      toast.error('PIN must be 4 digits');
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_URL}/secure_wallet.php`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'setup_wallet',
          pin,
          confirm_pin: confirmPin,
          mobile_money_number: wallet?.phone || '',
          mobile_money_provider: 'mtn'
        })
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Wallet setup successfully!');
        setShowSetup(false);
        loadWallet();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('Failed to setup wallet');
    }
  };

  const requestWithdrawal = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) < 5000) {
      toast.error('Minimum withdrawal is 5,000 RWF');
      return;
    }
    if (!withdrawPin || withdrawPin.length !== 4) {
      toast.error('Enter your 4-digit PIN');
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_URL}/secure_wallet.php`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'request_payout',
          amount: parseFloat(withdrawAmount),
          pin: withdrawPin,
          payout_method: 'mobile_money'
        })
      });
      const data = await response.json();
      if (data.success) {
        setRequestId(data.request_id);
        setShowOtp(true);
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('Failed to request withdrawal');
    }
  };

  const verifyOtpAndWithdraw = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_URL}/secure_wallet.php`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'verify_otp_payout',
          request_id: requestId,
          otp: otpCode
        })
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Withdrawal completed!');
        setShowWithdraw(false);
        setShowOtp(false);
        setWithdrawAmount('');
        setWithdrawPin('');
        setOtpCode('');
        loadWallet();
        loadTransactions();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('Failed to verify OTP');
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  if (showSetup) {
    return (
      <div className="container mx-auto p-4 max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-6 h-6" />
              Setup Secure Wallet
            </CardTitle>
            <CardDescription>Create a 4-digit PIN to secure your wallet</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Create PIN (4 digits)</Label>
              <Input type={showPin ? 'text' : 'password'} maxLength={4} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} />
            </div>
            <div>
              <Label>Confirm PIN</Label>
              <Input type={showPin ? 'text' : 'password'} maxLength={4} value={confirmPin} onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))} />
            </div>
            <Button onClick={() => setShowPin(!showPin)} variant="ghost" size="sm">
              {showPin ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
              {showPin ? 'Hide' : 'Show'} PIN
            </Button>
            <Button onClick={setupWallet} className="w-full">Setup Wallet</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{wallet?.balance?.toLocaleString() || 0} RWF</div>
            <p className="text-xs text-muted-foreground mt-1">Ready to withdraw</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pending Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{wallet?.pending_balance?.toLocaleString() || 0} RWF</div>
            <p className="text-xs text-muted-foreground mt-1">In escrow</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{wallet?.total_earned?.toLocaleString() || 0} RWF</div>
            <p className="text-xs text-muted-foreground mt-1">Commission: {wallet?.commission_paid?.toLocaleString() || 0} RWF</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Button onClick={() => setShowWithdraw(true)} className="h-20">
          <Send className="w-5 h-5 mr-2" />
          Withdraw Money
        </Button>
        <Card className="col-span-2">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Security Level</p>
                <Badge variant={wallet?.kyc_verified ? 'default' : 'secondary'}>
                  {wallet?.kyc_level || 'Basic'}
                </Badge>
              </div>
              <Shield className={`w-8 h-8 ${wallet?.kyc_verified ? 'text-green-500' : 'text-gray-400'}`} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="transactions">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {transactions.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No transactions yet</p>
                ) : (
                  transactions.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          tx.transaction_type === 'credit' ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          {tx.transaction_type === 'credit' ? <TrendingUp className="w-5 h-5 text-green-600" /> : <Send className="w-5 h-5 text-red-600" />}
                        </div>
                        <div>
                          <p className="font-semibold">{tx.description}</p>
                          <p className="text-xs text-muted-foreground">{new Date(tx.created_at).toLocaleString()}</p>
                          {tx.commission_amount > 0 && (
                            <p className="text-xs text-yellow-600">Commission: {tx.commission_amount.toLocaleString()} RWF ({tx.commission_rate}%)</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${tx.transaction_type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                          {tx.transaction_type === 'credit' ? '+' : '-'}{tx.amount.toLocaleString()} RWF
                        </p>
                        <Badge variant={tx.status === 'completed' ? 'default' : 'secondary'}>{tx.status}</Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Wallet Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-semibold">PIN Protection</p>
                  <p className="text-sm text-muted-foreground">4-digit security PIN</p>
                </div>
                <Lock className="w-5 h-5 text-green-500" />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-semibold">Mobile Money</p>
                  <p className="text-sm text-muted-foreground">{wallet?.mobile_money_number}</p>
                </div>
                <Badge>{wallet?.mobile_money_provider?.toUpperCase()}</Badge>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-semibold">Daily Limit</p>
                  <p className="text-sm text-muted-foreground">{wallet?.withdrawal_limit_daily?.toLocaleString()} RWF</p>
                </div>
                <Progress value={50} className="w-24" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showWithdraw} onOpenChange={setShowWithdraw}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Withdraw Money</DialogTitle>
            <DialogDescription>Enter amount and PIN to withdraw</DialogDescription>
          </DialogHeader>
          {!showOtp ? (
            <div className="space-y-4">
              <div>
                <Label>Amount (RWF)</Label>
                <Input type="number" placeholder="Minimum 5,000" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} />
              </div>
              <div>
                <Label>Enter PIN</Label>
                <Input type="password" maxLength={4} value={withdrawPin} onChange={(e) => setWithdrawPin(e.target.value.replace(/\D/g, ''))} />
              </div>
              <Button onClick={requestWithdrawal} className="w-full">Request Withdrawal</Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center py-4">
                <Clock className="w-12 h-12 mx-auto mb-4 text-primary" />
                <p className="font-semibold">OTP sent to your phone</p>
                <p className="text-sm text-muted-foreground">Enter the 6-digit code</p>
              </div>
              <div>
                <Label>OTP Code</Label>
                <Input type="text" maxLength={6} value={otpCode} onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))} className="text-center text-2xl tracking-widest" />
              </div>
              <Button onClick={verifyOtpAndWithdraw} className="w-full">Verify & Withdraw</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
