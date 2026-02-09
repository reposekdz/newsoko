import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Tag, Percent, Gift, Loader2 } from 'lucide-react';
import { api } from '../../../services/api';
import { useToast } from '../ui/use-toast';

export function PromoCodeManager() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [promoCode, setPromoCode] = useState('');
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchActiveCampaigns();
  }, []);

  const fetchActiveCampaigns = async () => {
    setLoading(true);
    try {
      const result = await api.getActivePromoCodes();
      if (result.success) {
        setCampaigns(result.campaigns);
      }
    } catch (error) {
      toast({ title: 'Failed to load promo codes', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const validateCode = async () => {
    if (!promoCode) return;
    
    setValidating(true);
    try {
      const result = await api.validatePromoCode(promoCode, 50000);
      if (result.success) {
        setValidationResult(result);
        toast({ title: 'Valid promo code!' });
      } else {
        toast({ title: result.message, variant: 'destructive' });
        setValidationResult(null);
      }
    } catch (error) {
      toast({ title: 'Failed to validate code', variant: 'destructive' });
    } finally {
      setValidating(false);
    }
  };

  const getDiscountText = (campaign: any) => {
    if (campaign.discount_type === 'percentage') {
      return `${campaign.discount_value}% OFF`;
    } else if (campaign.discount_type === 'fixed_amount') {
      return `${parseFloat(campaign.discount_value).toLocaleString()} RWF OFF`;
    } else {
      return 'FREE SHIPPING';
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Validate Promo Code
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input 
              placeholder="Enter promo code" 
              value={promoCode} 
              onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
            />
            <Button onClick={validateCode} disabled={validating}>
              {validating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Validate'}
            </Button>
          </div>
          
          {validationResult && (
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-green-600">Valid Code!</h4>
                <Badge className="bg-green-500">{validationResult.campaign.code}</Badge>
              </div>
              <p className="text-sm mb-2">{validationResult.campaign.description}</p>
              <div className="flex items-center justify-between text-sm">
                <span>Discount:</span>
                <span className="font-bold text-green-600">
                  {validationResult.discount_amount.toLocaleString()} RWF
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active Promo Codes</CardTitle>
        </CardHeader>
        <CardContent>
          {campaigns.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Gift className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No active promo codes</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {campaigns.map((campaign) => (
                <Card key={campaign.id} className="border-2 border-primary/20">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-lg">{campaign.name}</h3>
                        <p className="text-sm text-muted-foreground">{campaign.description}</p>
                      </div>
                      <Percent className="h-6 w-6 text-primary" />
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg mb-3">
                      <span className="text-sm font-medium">Code:</span>
                      <Badge className="text-lg px-4 py-1">{campaign.code}</Badge>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Discount:</span>
                        <span className="font-bold text-primary">{getDiscountText(campaign)}</span>
                      </div>
                      
                      {campaign.min_purchase_amount > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Min Purchase:</span>
                          <span>{parseFloat(campaign.min_purchase_amount).toLocaleString()} RWF</span>
                        </div>
                      )}
                      
                      {campaign.usage_limit && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Uses Left:</span>
                          <span>{campaign.usage_limit - campaign.usage_count}</span>
                        </div>
                      )}
                      
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Valid Until:</span>
                        <span>{new Date(campaign.end_date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
