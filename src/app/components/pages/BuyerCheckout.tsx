import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Badge } from '../ui/badge';
import { ShoppingCart, CreditCard, Shield, CheckCircle2, Truck } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = 'http://localhost/Rentalsalesmarketplace/api/controllers';

export function BuyerCheckout({ booking, onComplete }) {
  const [step, setStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('momo');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [processing, setProcessing] = useState(false);

  const processPayment = async () => {
    if (!phoneNumber) {
      toast.error('Enter phone number');
      return;
    }

    setProcessing(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_URL}/booking_payment.php`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'process_booking_payment',
          booking_id: booking.id,
          payment_method: paymentMethod,
          phone_number: phoneNumber
        })
      });
      
      const data = await response.json();
      if (data.success) {
        toast.success('Payment successful!');
        setStep(2);
        if (onComplete) onComplete();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('Payment failed');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="w-6 h-6" />
              Complete Your Order
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-secondary/30 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">{booking.product_title}</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Total Amount</p>
                  <p className="text-2xl font-bold">{booking.total_price?.toLocaleString()} RWF</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Deposit</p>
                  <p className="text-lg font-semibold">{booking.deposit?.toLocaleString()} RWF</p>
                </div>
              </div>
            </div>

            <div>
              <Label>Payment Method</Label>
              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="mt-2">
                <div className="flex items-center space-x-2 border p-3 rounded-lg">
                  <RadioGroupItem value="momo" id="momo" />
                  <Label htmlFor="momo" className="flex-1 cursor-pointer">
                    <div className="flex items-center justify-between">
                      <span>MTN Mobile Money</span>
                      <Badge>Recommended</Badge>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 border p-3 rounded-lg">
                  <RadioGroupItem value="airtel" id="airtel" />
                  <Label htmlFor="airtel" className="flex-1 cursor-pointer">Airtel Money</Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label>Phone Number</Label>
              <Input type="tel" placeholder="078XXXXXXX" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
            </div>

            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-blue-900">Secure Escrow Protection</p>
                  <p className="text-blue-700">Your payment is held securely until you confirm receipt</p>
                </div>
              </div>
            </div>

            <Button onClick={processPayment} disabled={processing} className="w-full h-12">
              <CreditCard className="w-5 h-5 mr-2" />
              {processing ? 'Processing...' : `Pay ${booking.total_price?.toLocaleString()} RWF`}
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Payment Successful!</h2>
              <p className="text-muted-foreground mb-6">Your order has been confirmed</p>
              
              <div className="bg-secondary/30 p-4 rounded-lg mb-6 text-left max-w-md mx-auto">
                <div className="flex items-center gap-3 mb-3">
                  <Truck className="w-5 h-5" />
                  <div>
                    <p className="font-semibold">Next Steps</p>
                    <p className="text-sm text-muted-foreground">Seller will prepare your order</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Order ID:</span>
                    <span className="font-mono">#{booking.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Amount Paid:</span>
                    <span className="font-semibold">{booking.total_price?.toLocaleString()} RWF</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <Badge>Confirmed</Badge>
                  </div>
                </div>
              </div>

              <Button onClick={() => window.location.href = '/bookings'} className="w-full max-w-md">View My Orders</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
