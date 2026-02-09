import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { CheckCircle2, Circle, Clock, Package, Shield, DollarSign, Loader2 } from 'lucide-react';
import { api } from '../../../services/api';
import { toast } from 'sonner';

interface EscrowProgressTrackerProps {
  bookingId: number;
  onComplete?: () => void;
}

export function EscrowProgressTracker({ bookingId, onComplete }: EscrowProgressTrackerProps) {
  const [progress, setProgress] = useState<any>(null);
  const [escrow, setEscrow] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    fetchProgress();
    const interval = setInterval(fetchProgress, 10000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, [bookingId]);

  const fetchProgress = async () => {
    try {
      const result = await api.get(`/advanced_payments.php?escrow_progress&booking_id=${bookingId}`);
      
      if (result.success) {
        setProgress(result.progress);
        setEscrow(result.escrow);
      }
    } catch (error) {
      console.error('Failed to fetch progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const confirmReceipt = async () => {
    setConfirming(true);
    try {
      const result = await api.post('/escrow_management.php', {
        action: 'confirm_item_received',
        booking_id: bookingId
      });

      if (result.success) {
        toast.success('Item receipt confirmed!');
        fetchProgress();
        onComplete?.();
      } else {
        toast.error(result.message || 'Failed to confirm receipt');
      }
    } catch (error) {
      toast.error('Error confirming receipt');
    } finally {
      setConfirming(false);
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

  const steps = [
    {
      id: 'payment_received',
      label: 'Payment Received',
      icon: DollarSign,
      completed: progress?.payment_received
    },
    {
      id: 'in_escrow',
      label: 'Funds in Escrow',
      icon: Shield,
      completed: progress?.in_escrow
    },
    {
      id: 'order_shipped',
      label: 'Order Shipped',
      icon: Package,
      completed: progress?.order_shipped
    },
    {
      id: 'item_received',
      label: 'Item Received',
      icon: CheckCircle2,
      completed: progress?.item_received
    },
    {
      id: 'funds_released',
      label: 'Funds Released',
      icon: DollarSign,
      completed: progress?.funds_released
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Escrow Progress
          </span>
          <Badge variant={progress?.funds_released ? 'default' : 'secondary'}>
            {progress?.progress_percentage}% Complete
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div>
          <Progress value={progress?.progress_percentage || 0} className="h-2" />
          <p className="text-xs text-muted-foreground mt-2 text-center">
            {progress?.funds_released ? 'Transaction Complete' : 'In Progress'}
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isCompleted = step.completed;
            const isCurrent = !isCompleted && (index === 0 || steps[index - 1].completed);

            return (
              <div key={step.id} className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  isCompleted 
                    ? 'bg-green-500 text-white' 
                    : isCurrent 
                    ? 'bg-primary text-primary-foreground animate-pulse' 
                    : 'bg-secondary text-muted-foreground'
                }`}>
                  {isCompleted ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : isCurrent ? (
                    <Clock className="h-5 w-5" />
                  ) : (
                    <Circle className="h-5 w-5" />
                  )}
                </div>
                
                <div className="flex-1 pt-1">
                  <p className={`font-medium ${isCompleted ? 'text-green-600' : isCurrent ? 'text-primary' : 'text-muted-foreground'}`}>
                    {step.label}
                  </p>
                  {isCompleted && (
                    <p className="text-xs text-muted-foreground">Completed</p>
                  )}
                  {isCurrent && (
                    <p className="text-xs text-primary">In Progress...</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Escrow Details */}
        {escrow && (
          <div className="bg-secondary/30 p-4 rounded-lg space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Escrow Amount:</span>
              <span className="font-bold">{parseFloat(escrow.amount).toLocaleString()} RWF</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Platform Fee:</span>
              <span>{parseFloat(escrow.platform_commission).toLocaleString()} RWF</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Seller Amount:</span>
              <span className="font-bold text-primary">{parseFloat(escrow.net_amount).toLocaleString()} RWF</span>
            </div>
            {escrow.auto_release_date && !progress?.funds_released && (
              <div className="flex justify-between text-xs pt-2 border-t">
                <span className="text-muted-foreground">Auto-release:</span>
                <span>{new Date(escrow.auto_release_date).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        )}

        {/* Action Button */}
        {progress?.order_shipped && !progress?.item_received && (
          <Button 
            onClick={confirmReceipt} 
            disabled={confirming}
            className="w-full"
          >
            {confirming ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Confirming...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Confirm Item Received
              </>
            )}
          </Button>
        )}

        {/* Info Box */}
        <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-lg text-sm">
          <p className="text-blue-900 dark:text-blue-100">
            <strong>Escrow Protection:</strong> Your funds are held securely until you confirm receipt. 
            {!progress?.funds_released && ' Funds will auto-release in 3 days if no issues are reported.'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
