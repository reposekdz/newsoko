import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Upload, MapPin, Camera, CheckCircle2, Loader2, AlertCircle, Shield } from 'lucide-react';
import { api } from '../../../services/api';
import { toast } from 'sonner';

export function AdvancedSellerVerification() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<any>(null);
  const [formData, setFormData] = useState({
    document_type: 'national_id',
    document_number: '',
    document_image: '',
    selfie_image: '',
    business_name: '',
    business_address: '',
    gps_latitude: null as number | null,
    gps_longitude: null as number | null
  });

  useEffect(() => {
    fetchVerificationStatus();
    getLocation();
  }, []);

  const fetchVerificationStatus = async () => {
    try {
      const result = await api.getUserVerificationStatus();
      if (result.success && result.data) {
        setVerificationStatus(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch status:', error);
    }
  };

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            gps_latitude: position.coords.latitude,
            gps_longitude: position.coords.longitude
          }));
        },
        (error) => console.error('Location error:', error)
      );
    }
  };

  const handleFileUpload = async (file: File, field: 'document_image' | 'selfie_image') => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, [field]: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!formData.document_number || !formData.document_image || !formData.selfie_image) {
      toast.error('Please complete all required fields');
      return;
    }

    setLoading(true);
    try {
      const result = await api.submitSellerVerification(formData);
      
      if (result.success) {
        toast.success('Verification submitted successfully!');
        fetchVerificationStatus();
        setStep(4);
      } else {
        toast.error(result.message || 'Submission failed');
      }
    } catch (error) {
      toast.error('Error submitting verification');
    } finally {
      setLoading(false);
    }
  };

  const payDeposit = async () => {
    setLoading(true);
    try {
      const result = await api.paySellerDeposit('mtn_momo', formData.document_number);
      
      if (result.success) {
        toast.success('Deposit paid successfully!');
        fetchVerificationStatus();
      } else {
        toast.error(result.message || 'Payment failed');
      }
    } catch (error) {
      toast.error('Error processing payment');
    } finally {
      setLoading(false);
    }
  };

  if (verificationStatus?.verification_status === 'approved') {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <CheckCircle2 className="h-16 w-16 text-green-600 mb-4" />
          <h3 className="text-xl font-bold mb-2">Verification Approved!</h3>
          <p className="text-muted-foreground text-center">
            Your seller account is verified. You can now list products.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (verificationStatus?.verification_status === 'pending') {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-16 w-16 text-primary animate-spin mb-4" />
          <h3 className="text-xl font-bold mb-2">Verification Pending</h3>
          <p className="text-muted-foreground text-center">
            Your verification is under review. We'll notify you once approved.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Seller Verification
        </CardTitle>
        <Progress value={(step / 4) * 100} className="mt-4" />
      </CardHeader>
      <CardContent className="space-y-6">
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <Label>Document Type</Label>
              <Select value={formData.document_type} onValueChange={(value) => setFormData({...formData, document_type: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="national_id">National ID</SelectItem>
                  <SelectItem value="passport">Passport</SelectItem>
                  <SelectItem value="business_license">Business License</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Document Number</Label>
              <Input
                placeholder="1234567890123456"
                value={formData.document_number}
                onChange={(e) => setFormData({...formData, document_number: e.target.value})}
              />
            </div>

            <div>
              <Label>Upload Document</Label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'document_image')}
                  className="hidden"
                  id="doc-upload"
                />
                <Label htmlFor="doc-upload" className="cursor-pointer text-primary">
                  Click to upload document
                </Label>
                {formData.document_image && <CheckCircle2 className="h-5 w-5 text-green-600 mx-auto mt-2" />}
              </div>
            </div>

            <Button onClick={() => setStep(2)} disabled={!formData.document_number || !formData.document_image} className="w-full">
              Next
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <Label>Selfie Photo</Label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <Camera className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <Input
                  type="file"
                  accept="image/*"
                  capture="user"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'selfie_image')}
                  className="hidden"
                  id="selfie-upload"
                />
                <Label htmlFor="selfie-upload" className="cursor-pointer text-primary">
                  Take selfie photo
                </Label>
                {formData.selfie_image && <CheckCircle2 className="h-5 w-5 text-green-600 mx-auto mt-2" />}
              </div>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-lg text-sm">
              <AlertCircle className="h-4 w-4 inline mr-2 text-blue-600" />
              Take a clear selfie holding your ID document
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">Back</Button>
              <Button onClick={() => setStep(3)} disabled={!formData.selfie_image} className="flex-1">Next</Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div>
              <Label>Business Name (Optional)</Label>
              <Input
                placeholder="My Business Ltd"
                value={formData.business_name}
                onChange={(e) => setFormData({...formData, business_name: e.target.value})}
              />
            </div>

            <div>
              <Label>Business Address</Label>
              <Input
                placeholder="KG 123 Ave, Kigali"
                value={formData.business_address}
                onChange={(e) => setFormData({...formData, business_address: e.target.value})}
              />
            </div>

            <div className="bg-secondary/30 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="font-medium">GPS Location</span>
              </div>
              {formData.gps_latitude && formData.gps_longitude ? (
                <p className="text-sm text-muted-foreground">
                  Lat: {formData.gps_latitude.toFixed(6)}, Lng: {formData.gps_longitude.toFixed(6)}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">Getting location...</p>
              )}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1">Back</Button>
              <Button onClick={handleSubmit} disabled={loading} className="flex-1">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit Verification'}
              </Button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4 text-center py-6">
            <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto" />
            <h3 className="text-xl font-bold">Verification Submitted!</h3>
            <p className="text-muted-foreground">
              Your verification is under review. You'll be notified once approved.
            </p>
            <Button onClick={payDeposit} disabled={loading} className="w-full">
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Pay Seller Deposit (50,000 RWF)
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
