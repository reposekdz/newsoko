import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Share2, Copy, Gift, Users, DollarSign, CheckCircle2, Loader2 } from 'lucide-react';
import { api } from '../../../services/api';
import { useToast } from '../ui/use-toast';

export function ReferralProgram() {
  const [referralCode, setReferralCode] = useState('');
  const [stats, setStats] = useState<any>(null);
  const [recentReferrals, setRecentReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [applyCode, setApplyCode] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchReferralData();
  }, []);

  const fetchReferralData = async () => {
    setLoading(true);
    try {
      const [codeResult, statsResult] = await Promise.all([
        api.getReferralCode(),
        api.getReferralStats()
      ]);
      
      if (codeResult.success) setReferralCode(codeResult.referral_code);
      if (statsResult.success) {
        setStats(statsResult.stats);
        setRecentReferrals(statsResult.recent_referrals);
      }
    } catch (error) {
      toast({ title: 'Failed to load referral data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralCode);
    toast({ title: 'Referral code copied!' });
  };

  const shareReferral = () => {
    const text = `Join Isoko Marketplace using my referral code ${referralCode} and get 5000 RWF bonus!`;
    if (navigator.share) {
      navigator.share({ title: 'Join Isoko', text });
    } else {
      navigator.clipboard.writeText(text);
      toast({ title: 'Referral message copied!' });
    }
  };

  const applyReferralCode = async () => {
    if (!applyCode) {
      toast({ title: 'Enter referral code', variant: 'destructive' });
      return;
    }

    try {
      const result = await api.applyReferralCode(applyCode);
      if (result.success) {
        toast({ title: `Success! You earned ${result.reward} RWF` });
        setApplyCode('');
        fetchReferralData();
      } else {
        toast({ title: result.message, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Failed to apply code', variant: 'destructive' });
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
                <p className="text-sm text-muted-foreground">Total Referrals</p>
                <p className="text-3xl font-bold text-primary">{stats?.total_referrals || 0}</p>
              </div>
              <Users className="h-10 w-10 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Rewards</p>
                <p className="text-2xl font-bold text-green-600">
                  {parseFloat(stats?.total_rewards || 0).toLocaleString()} RWF
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
                <p className="text-sm text-muted-foreground">Paid Rewards</p>
                <p className="text-2xl font-bold text-blue-600">
                  {parseFloat(stats?.paid_rewards || 0).toLocaleString()} RWF
                </p>
              </div>
              <Gift className="h-10 w-10 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Referral Code</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input value={referralCode} readOnly className="text-2xl font-bold text-center" />
            <Button onClick={copyToClipboard} variant="outline">
              <Copy className="h-4 w-4" />
            </Button>
            <Button onClick={shareReferral}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
          <p className="text-sm text-muted-foreground text-center">
            Share your code and earn 5000 RWF for each friend who signs up!
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Have a Referral Code?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input 
              placeholder="Enter referral code" 
              value={applyCode} 
              onChange={(e) => setApplyCode(e.target.value.toUpperCase())}
            />
            <Button onClick={applyReferralCode}>Apply</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Referrals</CardTitle>
        </CardHeader>
        <CardContent>
          {recentReferrals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No referrals yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentReferrals.map((referral) => (
                <div key={referral.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                  <div>
                    <p className="font-medium">{referral.referred_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(referral.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={referral.status === 'rewarded' ? 'default' : 'secondary'}>
                      {referral.status}
                    </Badge>
                    {referral.reward_paid && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
