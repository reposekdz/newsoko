import { useState } from 'react';
import { Calendar, CreditCard, MapPin, Shield, CheckCircle, AlertCircle, Truck, Clock, DollarSign } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Separator } from '../ui/separator';
import { Badge } from '../ui/badge';
import { Calendar as CalendarComponent } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { toast } from 'sonner';
import { api } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import { format, differenceInDays, addDays } from 'date-fns';

export function BookingPurchaseFlow({ product, viewMode, isOpen, onClose }: any) {
  const { user, isAuthenticated } = useAuth();
  const [step, setStep] = useState(1);
  const [bookingData, setBookingData] = useState({
    startDate: null,
    endDate: null,
    days: 1,
    deliveryMethod: 'pickup',
    deliveryAddress: '',
    paymentMethod: 'momo_mtn',
    phoneNumber: user?.phone || '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [bookingId, setBookingId] = useState(null);

  const calculateTotal = () => {
    const basePrice = viewMode === 'rent' 
      ? (product.rent_price || product.rentPrice) * bookingData.days 
      : (product.buy_price || product.buyPrice);
    const deposit = viewMode === 'rent' ? (product.deposit || 0) : 0;
    const deliveryFee = bookingData.deliveryMethod === 'delivery' ? 5000 : 0;
    const serviceFee = basePrice * 0.05;
    return { basePrice, deposit, deliveryFee, serviceFee, total: basePrice + deposit + deliveryFee + serviceFee };
  };

  const handleDateSelect = (date: any) => {
    if (!bookingData.startDate) {
      setBookingData({ ...bookingData, startDate: date });
    } else if (!bookingData.endDate && date > bookingData.startDate) {
      const days = differenceInDays(date, bookingData.startDate) + 1;
      setBookingData({ ...bookingData, endDate: date, days });
    } else {
      setBookingData({ ...bookingData, startDate: date, endDate: null, days: 1 });
    }
  };

  const handleCreateBooking = async () => {
    if (!isAuthenticated) {
      toast.error('Injira mbere yo gukodesha');
      return;
    }

    setLoading(true);
    const costs = calculateTotal();
    
    const data = {
      product_id: product.id,
      owner_id: product.owner_id || product.owner.id,
      booking_type: viewMode === 'rent' ? 'rental' : 'purchase',
      start_date: bookingData.startDate ? format(bookingData.startDate, 'yyyy-MM-dd') : null,
      end_date: bookingData.endDate ? format(bookingData.endDate, 'yyyy-MM-dd') : null,
      days: bookingData.days,
      total_price: costs.total,
      deposit: costs.deposit,
      status: 'pending',
      payment_status: 'pending',
      delivery_method: bookingData.deliveryMethod,
      delivery_address: bookingData.deliveryAddress,
      delivery_fee: costs.deliveryFee,
      notes: bookingData.notes
    };

    const response = await api.createBooking(data);
    setLoading(false);

    if (response.success) {
      setBookingId(response.booking_id);
      setStep(3);
      toast.success('Booking created successfully!');
    } else {
      toast.error('Failed to create booking');
    }
  };

  const handlePayment = async () => {
    setLoading(true);
    const costs = calculateTotal();
    
    const response = await api.initiatePayment(
      bookingId,
      costs.total,
      bookingData.phoneNumber,
      bookingData.paymentMethod
    );
    
    setLoading(false);

    if (response.success) {
      setStep(4);
      toast.success('Payment initiated! Check your phone.');
    } else {
      toast.error('Payment failed');
    }
  };

  const costs = calculateTotal();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {viewMode === 'rent' ? 'Kodesha' : 'Gura'} - {product.title}
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 mb-4">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className={`flex-1 h-2 rounded-full ${step >= s ? 'bg-primary' : 'bg-muted'}`} />
          ))}
        </div>

        <Tabs value={`step${step}`} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="step1" disabled={step !== 1}>
              <Calendar className="h-4 w-4 mr-2" />
              {viewMode === 'rent' ? 'Dates' : 'Details'}
            </TabsTrigger>
            <TabsTrigger value="step2" disabled={step !== 2}>
              <Truck className="h-4 w-4 mr-2" />
              Delivery
            </TabsTrigger>
            <TabsTrigger value="step3" disabled={step !== 3}>
              <CreditCard className="h-4 w-4 mr-2" />
              Payment
            </TabsTrigger>
            <TabsTrigger value="step4" disabled={step !== 4}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Confirm
            </TabsTrigger>
          </TabsList>

          <TabsContent value="step1" className="space-y-4 mt-6">
            {viewMode === 'rent' ? (
              <Card>
                <CardHeader>
                  <CardTitle>Hitamo iminsi</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-center">
                    <CalendarComponent
                      mode="range"
                      selected={{ from: bookingData.startDate, to: bookingData.endDate }}
                      onSelect={(range: any) => {
                        if (range?.from) {
                          const days = range.to ? differenceInDays(range.to, range.from) + 1 : 1;
                          setBookingData({ ...bookingData, startDate: range.from, endDate: range.to, days });
                        }
                      }}
                      disabled={(date) => date < new Date()}
                      className="rounded-md border"
                    />
                  </div>
                  {bookingData.startDate && (
                    <div className="bg-muted p-4 rounded-lg">
                      <div className="flex justify-between">
                        <span>Start: {format(bookingData.startDate, 'PPP')}</span>
                        {bookingData.endDate && <span>End: {format(bookingData.endDate, 'PPP')}</span>}
                      </div>
                      <div className="mt-2 font-bold">Total Days: {bookingData.days}</div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Purchase Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Product:</span>
                      <span className="font-bold">{product.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Price:</span>
                      <span className="font-bold">{costs.basePrice.toLocaleString()} RWF</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Button onClick={() => setStep(2)} className="w-full" disabled={viewMode === 'rent' && !bookingData.startDate}>
              Continue
            </Button>
          </TabsContent>

          <TabsContent value="step2" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Delivery Method</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <RadioGroup value={bookingData.deliveryMethod} onValueChange={(v) => setBookingData({ ...bookingData, deliveryMethod: v })}>
                  <div className="flex items-center space-x-2 border p-4 rounded-lg">
                    <RadioGroupItem value="pickup" id="pickup" />
                    <Label htmlFor="pickup" className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <div>
                          <div className="font-bold">Pickup</div>
                          <div className="text-sm text-muted-foreground">Free - {product.address}</div>
                        </div>
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 border p-4 rounded-lg">
                    <RadioGroupItem value="delivery" id="delivery" />
                    <Label htmlFor="delivery" className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4" />
                        <div>
                          <div className="font-bold">Delivery</div>
                          <div className="text-sm text-muted-foreground">5,000 RWF</div>
                        </div>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>

                {bookingData.deliveryMethod === 'delivery' && (
                  <div className="space-y-2">
                    <Label>Delivery Address</Label>
                    <Input
                      placeholder="Enter your address"
                      value={bookingData.deliveryAddress}
                      onChange={(e) => setBookingData({ ...bookingData, deliveryAddress: e.target.value })}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Notes (Optional)</Label>
                  <Input
                    placeholder="Any special instructions"
                    value={bookingData.notes}
                    onChange={(e) => setBookingData({ ...bookingData, notes: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">Back</Button>
              <Button onClick={handleCreateBooking} className="flex-1" disabled={loading}>
                {loading ? 'Creating...' : 'Continue'}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="step3" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment Method</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <RadioGroup value={bookingData.paymentMethod} onValueChange={(v) => setBookingData({ ...bookingData, paymentMethod: v })}>
                  <div className="flex items-center space-x-2 border p-4 rounded-lg">
                    <RadioGroupItem value="momo_mtn" id="mtn" />
                    <Label htmlFor="mtn" className="flex-1 cursor-pointer">
                      <div className="font-bold">MTN Mobile Money</div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 border p-4 rounded-lg">
                    <RadioGroupItem value="momo_airtel" id="airtel" />
                    <Label htmlFor="airtel" className="flex-1 cursor-pointer">
                      <div className="font-bold">Airtel Money</div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 border p-4 rounded-lg">
                    <RadioGroupItem value="wallet" id="wallet" />
                    <Label htmlFor="wallet" className="flex-1 cursor-pointer">
                      <div className="font-bold">Wallet Balance</div>
                      <div className="text-sm text-muted-foreground">{user?.wallet_balance?.toLocaleString()} RWF</div>
                    </Label>
                  </div>
                </RadioGroup>

                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input
                    placeholder="+250788123456"
                    value={bookingData.phoneNumber}
                    onChange={(e) => setBookingData({ ...bookingData, phoneNumber: e.target.value })}
                  />
                </div>

                <Separator />

                <div className="space-y-2 bg-muted p-4 rounded-lg">
                  <div className="flex justify-between">
                    <span>{viewMode === 'rent' ? 'Rental' : 'Purchase'} Price:</span>
                    <span>{costs.basePrice.toLocaleString()} RWF</span>
                  </div>
                  {costs.deposit > 0 && (
                    <div className="flex justify-between">
                      <span>Deposit:</span>
                      <span>{costs.deposit.toLocaleString()} RWF</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Delivery Fee:</span>
                    <span>{costs.deliveryFee.toLocaleString()} RWF</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Service Fee (5%):</span>
                    <span>{costs.serviceFee.toLocaleString()} RWF</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span className="text-primary">{costs.total.toLocaleString()} RWF</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Shield className="h-4 w-4" />
                  <span>Secured by Escrow System</span>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1">Back</Button>
              <Button onClick={handlePayment} className="flex-1" disabled={loading}>
                {loading ? 'Processing...' : 'Pay Now'}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="step4" className="space-y-4 mt-6">
            <Card>
              <CardContent className="pt-6 text-center space-y-4">
                <div className="flex justify-center">
                  <div className="h-20 w-20 rounded-full bg-green-500/10 flex items-center justify-center">
                    <CheckCircle className="h-10 w-10 text-green-500" />
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold">Payment Successful!</h3>
                  <p className="text-muted-foreground">Your booking has been confirmed</p>
                </div>
                <div className="bg-muted p-4 rounded-lg text-left space-y-2">
                  <div className="flex justify-between">
                    <span>Booking ID:</span>
                    <span className="font-bold">#{bookingId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <Badge>Confirmed</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Paid:</span>
                    <span className="font-bold">{costs.total.toLocaleString()} RWF</span>
                  </div>
                </div>
                <Button onClick={onClose} className="w-full">Done</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
