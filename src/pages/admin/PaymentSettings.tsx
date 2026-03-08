import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, QrCode, Smartphone, Save } from 'lucide-react';

export default function AdminPaymentSettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [upiId, setUpiId] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [merchantName, setMerchantName] = useState('KRT Jewels');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('upi_payment_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setSettingsId(data.id);
        setUpiId(data.upi_id || '');
        setQrCodeUrl(data.qr_code_url || '');
        setMerchantName(data.merchant_name || 'KRT Jewels');
        setIsActive(data.is_active ?? true);
      }
    } catch (err) {
      console.error('Error fetching UPI settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadQR = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const url = await uploadToCloudinary(file, 'payment');
      setQrCodeUrl(url);
      toast({ title: 'QR code uploaded successfully' });
    } catch (err) {
      toast({ title: 'Upload failed', description: String(err), variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        upi_id: upiId || null,
        qr_code_url: qrCodeUrl || null,
        merchant_name: merchantName,
        is_active: isActive,
        updated_at: new Date().toISOString(),
      };

      if (settingsId) {
        const { error } = await supabase
          .from('upi_payment_settings')
          .update(payload)
          .eq('id', settingsId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('upi_payment_settings')
          .insert([payload])
          .select()
          .single();
        if (error) throw error;
        setSettingsId(data.id);
      }

      toast({ title: 'Payment settings saved!' });
    } catch (err) {
      toast({ title: 'Failed to save', description: String(err), variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-serif font-semibold">Payment Settings</h1>
          <p className="text-muted-foreground">Configure UPI payment QR code for checkout</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <QrCode className="w-5 h-5 text-primary" />
                UPI QR Code
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Upload QR Code Image</Label>
                <div className="flex items-center gap-3">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleUploadQR}
                    disabled={uploading}
                    className="flex-1"
                  />
                  {uploading && <Loader2 className="w-5 h-5 animate-spin text-primary" />}
                </div>
              </div>

              {qrCodeUrl && (
                <div className="border rounded-lg p-4 bg-secondary/20">
                  <p className="text-sm text-muted-foreground mb-2">Preview:</p>
                  <img
                    src={qrCodeUrl}
                    alt="UPI QR Code"
                    className="w-48 h-48 object-contain mx-auto rounded-lg border bg-white"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="qr_url">Or paste QR image URL</Label>
                <Input
                  id="qr_url"
                  value={qrCodeUrl}
                  onChange={(e) => setQrCodeUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Smartphone className="w-5 h-5 text-primary" />
                UPI Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="merchant_name">Merchant Name</Label>
                <Input
                  id="merchant_name"
                  value={merchantName}
                  onChange={(e) => setMerchantName(e.target.value)}
                  placeholder="Your business name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="upi_id">UPI ID (optional)</Label>
                <Input
                  id="upi_id"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="yourname@oksbi"
                />
                <p className="text-xs text-muted-foreground">Shown to customers as a fallback if QR doesn't scan</p>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="font-medium text-sm">Enable UPI Payments</p>
                  <p className="text-xs text-muted-foreground">Show UPI option on checkout</p>
                </div>
                <Switch checked={isActive} onCheckedChange={setIsActive} />
              </div>

              <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Settings
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
