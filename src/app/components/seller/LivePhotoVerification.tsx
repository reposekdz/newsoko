import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Camera, CheckCircle2, XCircle, Loader2, MapPin, Clock } from 'lucide-react';
import { api } from '../../../services/api';
import { toast } from 'sonner';

interface LivePhotoVerificationProps {
  productId: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (verificationData: any) => void;
}

export function LivePhotoVerification({ productId, isOpen, onClose, onSuccess }: LivePhotoVerificationProps) {
  const [step, setStep] = useState<'camera' | 'verifying' | 'result'>('camera');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [verification, setVerification] = useState<any>(null);
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (isOpen && step === 'camera') {
      startCamera();
      getLocation();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, step]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' },
        audio: false 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      toast.error('Camera access denied');
      console.error(error);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Location error:', error);
        }
      );
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg', 0.9);
        setCapturedImage(imageData);
        stopCamera();
        verifyPhoto(imageData);
      }
    }
  };

  const verifyPhoto = async (imageData: string) => {
    setStep('verifying');
    
    try {
      // Upload image to server
      const uploadResult = await uploadImage(imageData);
      
      if (!uploadResult.success) {
        toast.error('Failed to upload image');
        setStep('camera');
        return;
      }

      // Verify live photo
      const result = await api.post('/live_photo_verification.php', {
        action: 'verify_live_photo',
        image_path: uploadResult.path,
        product_id: productId
      });

      if (result.success) {
        setVerification(result.verification);
        setStep('result');
        
        if (result.verification.is_live) {
          toast.success('Photo verified successfully!');
          setTimeout(() => {
            onSuccess(result);
            onClose();
          }, 2000);
        } else {
          toast.error('Photo verification failed');
        }
      } else {
        toast.error(result.message || 'Verification failed');
        setStep('camera');
      }
    } catch (error) {
      toast.error('Verification error');
      setStep('camera');
    }
  };

  const uploadImage = async (imageData: string): Promise<{success: boolean, path?: string}> => {
    // Convert base64 to blob
    const blob = await fetch(imageData).then(r => r.blob());
    const formData = new FormData();
    formData.append('image', blob, `product_${productId}_${Date.now()}.jpg`);
    formData.append('product_id', productId.toString());
    if (location) {
      formData.append('gps_lat', location.lat.toString());
      formData.append('gps_lng', location.lng.toString());
    }

    try {
      const response = await fetch('http://localhost/Rentalsalesmarketplace/api/controllers/upload_image.php', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: formData
      });
      return await response.json();
    } catch (error) {
      return { success: false };
    }
  };

  const retake = () => {
    setCapturedImage(null);
    setVerification(null);
    setStep('camera');
    startCamera();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            Live Photo Verification
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Camera View */}
          {step === 'camera' && (
            <div className="space-y-4">
              <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                <canvas ref={canvasRef} className="hidden" />
                
                {/* Overlay Info */}
                <div className="absolute top-4 left-4 right-4 flex justify-between">
                  <Badge variant="secondary" className="bg-black/50 text-white">
                    <Clock className="h-3 w-3 mr-1" />
                    {new Date().toLocaleTimeString()}
                  </Badge>
                  {location && (
                    <Badge variant="secondary" className="bg-black/50 text-white">
                      <MapPin className="h-3 w-3 mr-1" />
                      GPS Active
                    </Badge>
                  )}
                </div>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-lg text-sm">
                <p className="text-blue-900 dark:text-blue-100">
                  <strong>Instructions:</strong> Take a clear photo of your product. 
                  The photo must be taken now (not from gallery) and will include GPS location and timestamp.
                </p>
              </div>

              <Button onClick={capturePhoto} className="w-full" size="lg">
                <Camera className="h-5 w-5 mr-2" />
                Capture Photo
              </Button>
            </div>
          )}

          {/* Verifying */}
          {step === 'verifying' && (
            <div className="space-y-4 text-center py-12">
              <div className="flex justify-center">
                <Loader2 className="h-16 w-16 text-primary animate-spin" />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2">Verifying Photo...</h3>
                <p className="text-sm text-muted-foreground">
                  Checking EXIF data, GPS location, and timestamp
                </p>
              </div>
            </div>
          )}

          {/* Result */}
          {step === 'result' && verification && (
            <div className="space-y-4">
              {capturedImage && (
                <div className="relative rounded-lg overflow-hidden">
                  <img src={capturedImage} alt="Captured" className="w-full" />
                </div>
              )}

              <div className={`p-4 rounded-lg border-2 ${
                verification.is_live 
                  ? 'bg-green-500/10 border-green-500/20' 
                  : 'bg-red-500/10 border-red-500/20'
              }`}>
                <div className="flex items-center gap-3 mb-3">
                  {verification.is_live ? (
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                  ) : (
                    <XCircle className="h-8 w-8 text-red-600" />
                  )}
                  <div>
                    <h3 className={`font-bold text-lg ${
                      verification.is_live ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {verification.is_live ? 'Verification Successful' : 'Verification Failed'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Confidence: {verification.confidence}%
                    </p>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  {verification.flags.map((flag: string, index: number) => (
                    <div key={index} className="flex items-center gap-2">
                      {verification.is_live ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                      <span>{flag}</span>
                    </div>
                  ))}
                </div>
              </div>

              {!verification.is_live && (
                <Button onClick={retake} variant="outline" className="w-full">
                  <Camera className="h-4 w-4 mr-2" />
                  Retake Photo
                </Button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
