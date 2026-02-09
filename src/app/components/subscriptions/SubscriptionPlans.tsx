import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Check, Crown, Zap, Star, TrendingUp } from 'lucide-react';
import { subscriptionApi } from '../../../services/advancedApi';
import { toast } from 'sonner';

export function SubscriptionPlans() {
  const [plans, setPlans] = useState([]);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [plansRes, subRes] = await Promise.all([
        subscriptionApi.getPlans(),
        subscriptionApi.getMySubscription()
      ]);

      if (plansRes.success) setPlans(plansRes.data);
      if (subRes.success) setCurrentSubscription(subRes.data);
    } catch (error) {
      toast.error('Failed to load subscription data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planId) => {
    try {
      const response = await subscriptionApi.subscribe(planId, 'momo', 'monthly');
      if (response.success) {
        toast.success('Subscription activated successfully!');
        loadData();
      }
    } catch (error) {
      toast.error('Failed to subscribe');
    }
  };

  const handleUpgrade = async (planId) => {
    try {
      const response = await subscriptionApi.upgradeSubscription(planId);
      if (response.success) {
        toast.success('Subscription upgraded successfully!');
        loadData();
      }
    } catch (error) {
      toast.error('Failed to upgrade');
    }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel your subscription?')) return;
    
    try {
      const response = await subscriptionApi.cancelSubscription();
      if (response.success) {
        toast.success('Subscription cancelled');
        loadData();
      }
    } catch (error) {
      toast.error('Failed to cancel subscription');
    }
  };

  const getPlanIcon = (planType) => {
    switch (planType) {
      case 'free': return <Zap className="w-6 h-6" />;
      case 'basic': return <Star className="w-6 h-6" />;
      case 'premium': return <Crown className="w-6 h-6" />;
      case 'enterprise': return <TrendingUp className="w-6 h-6" />;
      default: return <Zap className="w-6 h-6" />;
    }
  };

  const getPlanColor = (planType) => {
    switch (planType) {
      case 'free': return 'bg-gray-500';
      case 'basic': return 'bg-blue-500';
      case 'premium': return 'bg-purple-500';
      case 'enterprise': return 'bg-gradient-to-r from-yellow-500 to-orange-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading subscription plans...</div>;
  }

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2">Choose Your Plan</h1>
        <p className="text-muted-foreground text-lg">Unlock more features and grow your business</p>
      </div>

      {currentSubscription && (
        <Card className="mb-8 border-2 border-primary">
          <CardHeader>
            <CardTitle>Current Subscription</CardTitle>
            <CardDescription>Your active plan details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Plan</p>
                <p className="text-lg font-semibold">{currentSubscription.plan_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Listings Used</p>
                <p className="text-lg font-semibold">
                  {currentSubscription.current_listings} / {currentSubscription.max_listings}
                </p>
                <Progress 
                  value={(currentSubscription.current_listings / currentSubscription.max_listings) * 100} 
                  className="mt-2"
                />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge variant={currentSubscription.status === 'active' ? 'default' : 'secondary'}>
                  {currentSubscription.status}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Renews On</p>
                <p className="text-lg font-semibold">
                  {new Date(currentSubscription.end_date).toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="destructive" onClick={handleCancel}>Cancel Subscription</Button>
          </CardFooter>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => {
          const isCurrentPlan = currentSubscription?.plan_id === plan.id;
          const features = plan.features || [];

          return (
            <Card key={plan.id} className={`relative ${isCurrentPlan ? 'border-2 border-primary shadow-lg' : ''}`}>
              {plan.plan_type === 'premium' && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-gradient-to-r from-purple-500 to-pink-500">Most Popular</Badge>
                </div>
              )}

              <CardHeader>
                <div className={`w-12 h-12 rounded-full ${getPlanColor(plan.plan_type)} flex items-center justify-center text-white mb-4`}>
                  {getPlanIcon(plan.plan_type)}
                </div>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>

              <CardContent>
                <div className="mb-6">
                  <span className="text-4xl font-bold">{plan.price.toLocaleString()}</span>
                  <span className="text-muted-foreground"> RWF/month</span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-sm">{plan.max_listings} listings</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-sm">{plan.featured_listings} featured listings</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-sm">{plan.commission_rate}% commission</span>
                  </div>
                  {plan.analytics_access && (
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      <span className="text-sm">Analytics dashboard</span>
                    </div>
                  )}
                  {plan.priority_support && (
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      <span className="text-sm">Priority support</span>
                    </div>
                  )}
                  {features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>

              <CardFooter>
                {isCurrentPlan ? (
                  <Button className="w-full" disabled>Current Plan</Button>
                ) : currentSubscription ? (
                  <Button className="w-full" onClick={() => handleUpgrade(plan.id)}>
                    Upgrade to {plan.name}
                  </Button>
                ) : (
                  <Button className="w-full" onClick={() => handleSubscribe(plan.id)}>
                    Get Started
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>

      <div className="mt-12 text-center">
        <p className="text-muted-foreground">
          All plans include secure payments, 24/7 platform access, and mobile app support
        </p>
      </div>
    </div>
  );
}
