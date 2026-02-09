import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Progress } from '../ui/progress';
import { Fingerprint, Shield, CreditCard, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../../services/api';

interface WalletCheckoutProps {
  bookingId: number;
  amount: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (paymentData: any) => void;
}

export function WalletCheckout({ bookingId, amount, isOpen, onClose, onSuccess }: WalletCheckoutProps) {
  const [step, setStep] = useState<'method' | 'biometric' | 'processing' | 'success'>('method');
  const [paymentMethod, setPaymentMethod] = useState<'mtn_momo' | 'airtel_money' | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [fraudCheck, setFraudCheck] = useState<any>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    checkBiometricSupport();
    performFraudCheck();
  }, []);

  const checkBiometricSupport = async () => {
    if (window.PublicKeyCredential) {
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      setBiometricSupported(available);
    }
  };

  const performFraudCheck = async () => {
    try {
      const result = await api.post('/advanced_payments.php', {
        action: 'fraud_check_transaction',
        amount,
        payment_data: {
          user_id: localStorage.getItem('user_id'),
          phone_number: phoneNumber
        }
      });
      
      if (result.success) {
        setFraudCheck(result.fraud_check);
        
        if (result.fraud_check.recommendation === 'block_transaction') {
          toast.error('Transaction blocked for security reasons');
          onClose();
        }
      }
    } catch (error) {
      console.error('Fraud check failed:', error);
    }
  };

  const authenticateBiometric = async () => {
    if (!biometricSupported) {
      proceedWithPayment('manual_auth');
      return;
    }

    try {
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      const credential = await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: { name: 'RentalSalesMarketplace' },
          user: {
            id: new Uint8Array(16),
            name: phoneNumber,
            displayName: phoneNumber
          },
          pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'required'
          },
          timeout: 60000
        }
      });

      if (credential) {
        const biometricToken = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)));
        proceedWithPayment(biometricToken);
      }
    } catch (error) {
      toast.error('Biometric authentication failed');
      console.error(error);
    }
  };

  const proceedWithPayment = async (biometricToken: string) => {
    setProcessing(true);
    setStep('processing');

    try {
      const result = await api.post('/advanced_payments.php', {
        action: 'wallet_checkout',
        booking_id: bookingId,
        payment_method: paymentMethod,
        phone_number: phoneNumber,
        biometric_token: biometricToken
      });

      if (result.success) {
        setStep('success');
        toast.success('Payment successful!', {
          description: `Reference: ${result.reference}`
        });
        
        setTimeout(() => {
          onSuccess(result);
          onClose();
        }, 2000);
      } else {
        toast.error(result.message || 'Payment failed');
        setStep('method');
      }
    } catch (error) {
      toast.error('Payment processing error');
      setStep('method');
    } finally {
      setProcessing(false);
    }
  };

  const handleMethodSelect = (method: 'mtn_momo' | 'airtel_money') => {
    setPaymentMethod(method);
    setStep('biometric');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Secure Wallet Checkout
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {fraudCheck && fraudCheck.risk_level !== 'low' && (
            <div className={`p-3 rounded-lg flex items-start gap-2 ${
              fraudCheck.risk_level === 'high' ? 'bg-red-500/10 border border-red-500/20' : 'bg-yellow-500/10 border border-yellow-500/20'
            }`}>
              <AlertCircle className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
                fraudCheck.risk_level === 'high' ? 'text-red-600' : 'text-yellow-600'
              }`} />
              <div className="text-sm">
                <p className="font-bold">Security Check: {fraudCheck.risk_level.toUpperCase()}</p>
                <p className="text-muted-foreground">Risk Score: {fraudCheck.overall_risk_score}</p>
              </div>
            </div>
          )}

          <div className="bg-primary/10 p-4 rounded-lg text-center">
            <p className="text-sm text-muted-foreground">Total Amount</p>
            <p className="text-3xl font-bold text-primary">{amount.toLocaleString()} RWF</p>
          </div>

          {step === 'method' && (
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Select Payment Method
              </Label>
              
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleMethodSelect('mtn_momo')}
                  className="p-4 border-2 rounded-lg transition-all border-border hover:border-primary/50"
                >
                  <div className="font-bold text-yellow-600 mb-1">MTN MoMo</div>
                  <div className="text-xs text-muted-foreground">Instant • 2% fee</div>
                </button>
                
                <button
                  onClick={() => handleMethodSelect('airtel_money')}
                  className="p-4 border-2 rounded-lg transition-all border-border hover:border-primary/50"
                >
                  <div className="font-bold text-red-600 mb-1">Airtel Money</div>
                  <div className="text-xs text-muted-foreground">Instant • 2.5% fee</div>
                </button>
              </div>

              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+250 788 123 456"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          )}

          {step === 'biometric' && (
            <div className="space-y-4 text-center py-6">
              <div className="flex justify-center">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <Fingerprint className="h-10 w-10 text-primary animate-pulse" />
                </div>
              </div>
              
              <div>
                <h3 className="font-bold text-lg mb-2">Authenticate Payment</h3>
                <p className="text-sm text-muted-foreground">
                  {biometricSupported 
                    ? 'Use your fingerprint or Face ID to confirm payment'
                    : 'Confirm payment to proceed'}
                </p>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep('method')} className="flex-1">
                  Back
                </Button>
                <Button onClick={authenticateBiometric} className="flex-1">
                  <Fingerprint className="h-4 w-4 mr-2" />
                  Authenticate
                </Button>
              </div>
            </div>
          )}

          {step === 'processing' && (
            <div className="space-y-4 text-center py-6">
              <div className="flex justify-center">
                <Loader2 className="h-12 w-12 text-primary animate-spin" />
              </div>
              
              <div>
                <h3 className="font-bold text-lg mb-2">Processing Payment</h3>
                <p className="text-sm text-muted-foreground">
                  Please wait while we process your payment...
                </p>
              </div>

              <Progress value={66} className="w-full" />
            </div>
          )}

          {step === 'success' && (
            <div className="space-y-4 text-center py-6">
              <div className="flex justify-center">
                <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center">
                  <CheckCircle2 className="h-10 w-10 text-green-600" />
                </div>
              </div>
              
              <div>
                <h3 className="font-bold text-lg mb-2 text-green-600">Payment Successful!</h3>
                <p className="text-sm text-muted-foreground">
                  Your payment has been processed and funds are in escrow
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
