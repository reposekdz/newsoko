import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Package, MapPin, Truck, CheckCircle2, Clock, Loader2 } from 'lucide-react';
import { api } from '../../../services/api';
import { useToast } from '../ui/use-toast';

interface ShippingTrackerProps {
  bookingId: number;
}

export function ShippingTracker({ bookingId }: ShippingTrackerProps) {
  const [tracking, setTracking] = useState<any>(null);
  const [updates, setUpdates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchTracking();
    const interval = setInterval(fetchTracking, 60000);
    return () => clearInterval(interval);
  }, [bookingId]);

  const fetchTracking = async () => {
    try {
      const result = await api.getShippingTracking(bookingId);
      if (result.success) {
        setTracking(result.tracking);
        setUpdates(result.updates);
      }
    } catch (error) {
      toast({ title: 'Failed to load tracking', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-5 w-5 text-gray-500" />;
      case 'picked_up': return <Package className="h-5 w-5 text-blue-500" />;
      case 'in_transit': return <Truck className="h-5 w-5 text-yellow-500" />;
      case 'out_for_delivery': return <MapPin className="h-5 w-5 text-orange-500" />;
      case 'delivered': return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      default: return <Package className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-gray-500';
      case 'picked_up': return 'bg-blue-500';
      case 'in_transit': return 'bg-yellow-500';
      case 'out_for_delivery': return 'bg-orange-500';
      case 'delivered': return 'bg-green-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-gray-500';
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

  if (!tracking) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">No tracking information available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Shipment Tracking
          </CardTitle>
          <Badge className={getStatusColor(tracking.status)}>
            {tracking.status.replace('_', ' ').toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Tracking Info */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-secondary/30 rounded-lg">
          <div>
            <p className="text-sm text-muted-foreground">Carrier</p>
            <p className="font-semibold">{tracking.carrier || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Tracking Number</p>
            <p className="font-semibold">{tracking.tracking_number || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Current Location</p>
            <p className="font-semibold">{tracking.current_location || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Estimated Delivery</p>
            <p className="font-semibold">
              {tracking.estimated_delivery ? new Date(tracking.estimated_delivery).toLocaleDateString() : 'N/A'}
            </p>
          </div>
        </div>

        {/* Progress Timeline */}
        <div className="space-y-4">
          <h4 className="font-semibold">Shipment Progress</h4>
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />
            
            {/* Timeline Items */}
            <div className="space-y-6">
              {updates.map((update, index) => (
                <div key={update.id} className="relative flex items-start gap-4">
                  <div className="relative z-10 flex items-center justify-center w-12 h-12 rounded-full bg-background border-2 border-primary">
                    {getStatusIcon(update.status)}
                  </div>
                  <div className="flex-1 pt-2">
                    <div className="flex items-center justify-between mb-1">
                      <h5 className="font-semibold">{update.status}</h5>
                      <p className="text-xs text-muted-foreground">
                        {new Date(update.timestamp).toLocaleString()}
                      </p>
                    </div>
                    {update.location && (
                      <p className="text-sm text-muted-foreground mb-1">
                        <MapPin className="h-3 w-3 inline mr-1" />
                        {update.location}
                      </p>
                    )}
                    {update.description && (
                      <p className="text-sm">{update.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Delivery Status */}
        {tracking.status === 'delivered' && tracking.actual_delivery && (
          <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <h4 className="font-semibold text-green-600">Delivered Successfully</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              Delivered on {new Date(tracking.actual_delivery).toLocaleString()}
            </p>
          </div>
        )}

        {tracking.notes && (
          <div className="p-4 bg-secondary/30 rounded-lg">
            <p className="text-sm font-semibold mb-1">Notes:</p>
            <p className="text-sm text-muted-foreground">{tracking.notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
