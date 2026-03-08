import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { formatPrice } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Clock, Upload, Loader2, QrCode, CheckCircle2, Smartphone } from 'lucide-react';

const UPI_PROVIDERS = [
  { value: '@oksbi', label: 'SBI (@oksbi)' },
  { value: '@okaxis', label: 'Axis Bank (@okaxis)' },
  { value: '@okicici', label: 'ICICI Bank (@okicici)' },
  { value: '@okhdfcbank', label: 'HDFC Bank (@okhdfcbank)' },
  { value: '@ybl', label: 'PhonePe (@ybl)' },
  { value: '@paytm', label: 'Paytm (@paytm)' },
  { value: '@apl', label: 'Amazon Pay (@apl)' },
  { value: '@ibl', label: 'IDBI Bank (@ibl)' },
  { value: '@upi', label: 'BHIM UPI (@upi)' },
  { value: '@axl', label: 'Google Pay (@axl)' },
  { value: '@kotak', label: 'Kotak (@kotak)' },
  { value: '@barodampay', label: 'Bank of Baroda (@barodampay)' },
  { value: '@pnb', label: 'PNB (@pnb)' },
  { value: '@cnrb', label: 'Canara Bank (@cnrb)' },
  { value: '@unionbankofindia', label: 'Union Bank (@unionbankofindia)' },
];

interface UpiPaymentModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { utr: string; screenshotUrl: string | null; upiPhone: string; upiProvider: string }) => void;
  amount: number;
  qrCodeUrl: string;
  upiId?: string;
  merchantName?: string;
}

export function UpiPaymentModal({ open, onClose, onSubmit, amount, qrCodeUrl, upiId, merchantName }: UpiPaymentModalProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<'qr' | 'verify'>('qr');
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutes
  const [upiPhone, setUpiPhone] = useState('');
  const [upiProvider, setUpiProvider] = useState('');
  const [utr, setUtr] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Timer countdown
  useEffect(() => {
    if (!open || step !== 'qr') return;

    setTimeLeft(120);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setStep('verify');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [open, step]);

  // Reset on open
  useEffect(() => {
    if (open) {
      setStep('qr');
      setUtr('');
      setScreenshotUrl(null);
      setUpiPhone('');
      setUpiProvider('');
    }
  }, [open]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handlePaidClick = () => {
    setStep('verify');
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleUploadScreenshot = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadToCloudinary(file, 'payment-proofs');
      setScreenshotUrl(url);
    } catch {
      toast({ title: 'Upload failed', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!utr && !screenshotUrl) {
      toast({ title: 'Please enter UTR number or upload screenshot', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({ utr, screenshotUrl, upiPhone, upiProvider });
    } finally {
      setSubmitting(false);
    }
  };

  const gpayDeepLink = `upi://pay?pa=${upiId || ''}&pn=${encodeURIComponent(merchantName || 'KRT Jewels')}&am=${amount}&cu=INR`;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-primary" />
            Pay via UPI
          </DialogTitle>
        </DialogHeader>

        {step === 'qr' && (
          <div className="space-y-4">
            {/* Phone & Provider */}
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-sm">Phone Number</Label>
                <Input
                  type="tel"
                  placeholder="Enter your mobile number"
                  value={upiPhone}
                  onChange={(e) => setUpiPhone(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">UPI Provider</Label>
                <Select value={upiProvider} onValueChange={setUpiProvider}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your UPI app" />
                  </SelectTrigger>
                  <SelectContent>
                    {UPI_PROVIDERS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Amount */}
            <div className="text-center p-3 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-sm text-muted-foreground">Amount to pay</p>
              <p className="text-2xl font-serif font-bold text-primary">{formatPrice(amount)}</p>
            </div>

            {/* QR Code */}
            <div className="flex justify-center">
              <img
                src={qrCodeUrl}
                alt="UPI QR Code"
                className="w-52 h-52 object-contain rounded-lg border bg-white p-2"
              />
            </div>

            {upiId && (
              <p className="text-center text-sm text-muted-foreground">
                UPI ID: <span className="font-medium text-foreground">{upiId}</span>
              </p>
            )}

            {/* Timer */}
            <div className="flex items-center justify-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-primary" />
              <span className={`font-mono font-bold ${timeLeft <= 30 ? 'text-destructive' : 'text-foreground'}`}>
                {formatTime(timeLeft)}
              </span>
              <span className="text-muted-foreground">remaining</span>
            </div>

            {/* UPI App Links */}
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" className="gap-2" asChild>
                <a href={gpayDeepLink}>
                  <Smartphone className="w-4 h-4" />
                  Open UPI App
                </a>
              </Button>
              <Button onClick={handlePaidClick} className="gap-2">
                <CheckCircle2 className="w-4 h-4" />
                I've Paid
              </Button>
            </div>
          </div>
        )}

        {step === 'verify' && (
          <div className="space-y-4">
            <div className="text-center p-3 rounded-lg bg-green-50 border border-green-200 dark:bg-green-950/20 dark:border-green-800">
              <CheckCircle2 className="w-6 h-6 text-green-600 mx-auto mb-1" />
              <p className="text-sm font-medium">Now verify your payment</p>
              <p className="text-xs text-muted-foreground">Enter your UTR number or upload payment screenshot</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="utr">UTR / Transaction Reference Number</Label>
              <Input
                id="utr"
                value={utr}
                onChange={(e) => setUtr(e.target.value)}
                placeholder="e.g. 432118765432"
              />
            </div>

            <div className="space-y-2">
              <Label>Payment Screenshot (optional)</Label>
              <div className="flex items-center gap-3">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleUploadScreenshot}
                  disabled={uploading}
                  className="flex-1"
                />
                {uploading && <Loader2 className="w-5 h-5 animate-spin" />}
              </div>
              {screenshotUrl && (
                <img src={screenshotUrl} alt="Screenshot" className="w-32 h-auto rounded-lg border mt-2" />
              )}
            </div>

            <Button
              onClick={handleSubmit}
              disabled={submitting || (!utr && !screenshotUrl)}
              className="w-full gap-2"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              Submit for Verification
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
