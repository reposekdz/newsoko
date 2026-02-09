import { Calendar, Package, Clock, CheckCircle, XCircle, AlertCircle, Eye } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { api, completeApi } from '@/services';
import { useAuth } from '../../../context/AuthContext';

export function BookingsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (user) loadBookings();
  }, [user]);

  const loadBookings = async () => {
    const response = await api.getUserBookings(user.id);
    if (response.success) setBookings(response.data);
  };

  const handleViewDetails = async (bookingId: number) => {
    const response = await api.getBookingDetails(bookingId);
    if (response.success) {
      setSelectedBooking(response.data);
      setShowDetails(true);
    }
  };

  const handleCompleteBooking = async (bookingId: number) => {
    const response = await api.completeBooking(bookingId);
    if (response.success) {
      loadBookings();
      setShowDetails(false);
    }
  };

  const handleCancelBooking = async (bookingId: number) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    const response = await api.cancelBooking(bookingId);
    if (response.success) {
      loadBookings();
      setShowDetails(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'confirmed': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'pending': return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'completed': return <CheckCircle className="h-5 w-5 text-blue-500" />;
      case 'cancelled': return <XCircle className="h-5 w-5 text-red-500" />;
      default: return <AlertCircle className="h-5 w-5" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: any = {
      confirmed: 'default',
      pending: 'secondary',
      completed: 'outline',
      cancelled: 'destructive'
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  const filterBookings = (status: string) => {
    if (status === 'all') return bookings;
    return bookings.filter(b => b.status === status);
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-muted-foreground">Please login to view bookings</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Calendar className="h-8 w-8" />
          My Bookings
        </h1>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All ({bookings.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({filterBookings('pending').length})</TabsTrigger>
          <TabsTrigger value="confirmed">Confirmed ({filterBookings('confirmed').length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({filterBookings('completed').length})</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled ({filterBookings('cancelled').length})</TabsTrigger>
        </TabsList>

        {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map(status => (
          <TabsContent key={status} value={status} className="space-y-4 mt-6">
            {filterBookings(status).length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No {status !== 'all' ? status : ''} bookings found</p>
                </CardContent>
              </Card>
            ) : (
              filterBookings(status).map((booking) => (
                <Card key={booking.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex gap-4 flex-1">
                        <img 
                          src={booking.product_image} 
                          alt={booking.product_title}
                          className="w-24 h-24 object-cover rounded-lg"
                        />
                        <div className="flex-1 space-y-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-bold text-lg">{booking.product_title}</h3>
                              <p className="text-sm text-muted-foreground">Booking ID: #{booking.id}</p>
                            </div>
                            {getStatusBadge(booking.status)}
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span>{new Date(booking.start_date).toLocaleDateString()}</span>
                              {booking.end_date && (
                                <span>- {new Date(booking.end_date).toLocaleDateString()}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4 text-muted-foreground" />
                              <span>{booking.booking_type === 'rent' ? 'Rental' : 'Purchase'}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between pt-2">
                            <div>
                              <p className="text-2xl font-bold text-primary">
                                {booking.total_amount?.toLocaleString()} RWF
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {booking.payment_status === 'paid' ? 'Paid' : 'Pending Payment'}
                              </p>
                            </div>
                            
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleViewDetails(booking.id)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Details
                              </Button>
                              
                              {booking.status === 'confirmed' && (
                                <Button 
                                  size="sm"
                                  onClick={() => handleCompleteBooking(booking.id)}
                                >
                                  Complete
                                </Button>
                              )}
                              
                              {['pending', 'confirmed'].includes(booking.status) && (
                                <Button 
                                  variant="destructive" 
                                  size="sm"
                                  onClick={() => handleCancelBooking(booking.id)}
                                >
                                  Cancel
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        ))}
      </Tabs>

      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {getStatusIcon(selectedBooking.status)}
                <span className="font-bold">Status: {selectedBooking.status}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Product</p>
                  <p className="font-bold">{selectedBooking.product_title}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <p className="font-bold">{selectedBooking.booking_type}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Start Date</p>
                  <p className="font-bold">{new Date(selectedBooking.start_date).toLocaleDateString()}</p>
                </div>
                {selectedBooking.end_date && (
                  <div>
                    <p className="text-sm text-muted-foreground">End Date</p>
                    <p className="font-bold">{new Date(selectedBooking.end_date).toLocaleDateString()}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Delivery Method</p>
                  <p className="font-bold">{selectedBooking.delivery_method}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Payment Method</p>
                  <p className="font-bold">{selectedBooking.payment_method}</p>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <p className="text-sm text-muted-foreground mb-2">Cost Breakdown</p>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Base Amount</span>
                    <span>{selectedBooking.base_amount?.toLocaleString()} RWF</span>
                  </div>
                  {selectedBooking.delivery_fee > 0 && (
                    <div className="flex justify-between">
                      <span>Delivery Fee</span>
                      <span>{selectedBooking.delivery_fee?.toLocaleString()} RWF</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Service Fee (5%)</span>
                    <span>{selectedBooking.service_fee?.toLocaleString()} RWF</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total</span>
                    <span className="text-primary">{selectedBooking.total_amount?.toLocaleString()} RWF</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
