import { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { useGoldRate } from '@/hooks/useGoldRate';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import { formatPrice } from '@/lib/types';
import { useGstSettings } from '@/hooks/useSiteSettings';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { ShoppingBag, MapPin, CreditCard, Truck, Shield, Loader2, QrCode } from 'lucide-react';
import { UpiPaymentModal } from '@/components/checkout/UpiPaymentModal';

interface AddressForm {
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  pincode: string;
}

interface UpiSettings {
  qr_code_url: string | null;
  upi_id: string | null;
  merchant_name: string | null;
  is_active: boolean;
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, subtotal, gstTotal, total, clearCart, isLoading: cartLoading } = useCart();
  const { data: gstSettings } = useGstSettings();
  const gstRate = gstSettings?.rate ?? 3;
  const { user, loading: authLoading } = useAuth();
  const { data: goldRate } = useGoldRate();
  const { toast } = useToast();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [showUpiModal, setShowUpiModal] = useState(false);
  const [upiSettings, setUpiSettings] = useState<UpiSettings | null>(null);
  const [address, setAddress] = useState<AddressForm>({
    full_name: '',
    phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: 'Tamil Nadu',
    pincode: '',
  });
  const [notes, setNotes] = useState('');

  // Fetch UPI settings
  useEffect(() => {
    const fetchUpiSettings = async () => {
      const { data } = await supabase
        .from('upi_payment_settings')
        .select('*')
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();
      if (data) setUpiSettings(data as unknown as UpiSettings);
    };
    fetchUpiSettings();
  }, []);

  // Fetch saved addresses
  useEffect(() => {
    const fetchDefaultAddress = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_default', true)
        .maybeSingle();
      
      if (data) {
        setAddress({
          full_name: data.full_name,
          phone: data.phone,
          address_line1: data.address_line1,
          address_line2: data.address_line2 || '',
          city: data.city,
          state: data.state,
          pincode: data.pincode,
        });
      }
    };
    if (user) fetchDefaultAddress();
  }, [user]);

  if (authLoading || cartLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </Layout>
    );
  }

  if (items.length === 0) {
    return <Navigate to="/cart" replace />;
  }

  const generateOrderNumber = () => {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `KRT${year}${month}${random}`;
  };

  const createOrder = async (orderNumber: string, opts?: {
    paymentMethod?: string;
    paymentId?: string;
    paymentProofUrl?: string;
    paymentUtr?: string;
    upiPhone?: string;
    upiProvider?: string;
    status?: string;
  }) => {
    if (!goldRate) return null;
    const method = opts?.paymentMethod || paymentMethod;

    if (!user) {
      const orderItems = items.map((item) => ({
        product_id: item.product.id,
        product_name: item.product.name,
        product_image: item.product.images[0] || null,
        weight_grams: item.product.weight_grams + (item.variation_weight_adjustment || 0),
        gold_rate_applied: item.product.calculated_price.gold_rate_applied,
        making_charges: item.product.calculated_price.making_charges,
        diamond_cost: item.product.diamond_cost || 0,
        stone_cost: item.product.stone_cost || 0,
        quantity: item.quantity,
        unit_price: item.product.calculated_price.total + (item.variation_price_adjustment || 0),
        total_price: (item.product.calculated_price.total + (item.variation_price_adjustment || 0)) * item.quantity,
        selected_variations: item.selected_variations || {},
        variation_price_adjustment: item.variation_price_adjustment || 0,
        variation_weight_adjustment: item.variation_weight_adjustment || 0,
      }));

      const { data: guestData, error: guestError } = await supabase.functions.invoke('create-guest-order', {
        body: {
          order_number: orderNumber,
          subtotal,
          gst_amount: gstTotal,
          total_amount: total,
          gold_rate_at_order: goldRate.rate_22k,
          shipping_address: address as unknown as Json,
          payment_method: method,
          payment_id: opts?.paymentId || null,
          notes: notes || null,
          items: orderItems,
        },
      });
      if (guestError) throw new Error(guestError.message);
      return guestData;
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([{
        order_number: orderNumber,
        user_id: user.id,
        status: (opts?.status || 'pending') as 'pending' | 'confirmed',
        gold_rate_at_order: goldRate.rate_22k,
        subtotal,
        gst_amount: gstTotal,
        total_amount: total,
        shipping_address: address as unknown as Json,
        payment_method: method,
        payment_id: opts?.paymentId || null,
        payment_proof_url: opts?.paymentProofUrl || null,
        payment_utr: opts?.paymentUtr || null,
        upi_phone: opts?.upiPhone || null,
        upi_provider: opts?.upiProvider || null,
        notes: notes || null,
      }])
      .select()
      .single();

    if (orderError) throw orderError;

    const orderItems = items.map((item) => ({
      order_id: order.id,
      product_id: item.product.id,
      product_name: item.product.name,
      product_image: item.product.images[0] || null,
      weight_grams: item.product.weight_grams + (item.variation_weight_adjustment || 0),
      gold_rate_applied: item.product.calculated_price.gold_rate_applied,
      making_charges: item.product.calculated_price.making_charges,
      diamond_cost: item.product.diamond_cost || 0,
      stone_cost: item.product.stone_cost || 0,
      quantity: item.quantity,
      unit_price: item.product.calculated_price.total + (item.variation_price_adjustment || 0),
      total_price: (item.product.calculated_price.total + (item.variation_price_adjustment || 0)) * item.quantity,
      selected_variations: item.selected_variations || {},
      variation_price_adjustment: item.variation_price_adjustment || 0,
      variation_weight_adjustment: item.variation_weight_adjustment || 0,
    }));

    const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
    if (itemsError) throw itemsError;

    for (const item of items) {
      if (item.product.stock_quantity !== null) {
        await supabase
          .from('products')
          .update({ stock_quantity: item.product.stock_quantity - item.quantity })
          .eq('id', item.product.id);
      }
    }

    return order;
  };

  const handleUpiSubmit = async (data: { utr: string; screenshotUrl: string | null; upiPhone: string; upiProvider: string }) => {
    setIsSubmitting(true);
    try {
      const orderNumber = generateOrderNumber();
      await createOrder(orderNumber, {
        paymentMethod: 'upi',
        paymentUtr: data.utr || undefined,
        paymentProofUrl: data.screenshotUrl || undefined,
        upiPhone: data.upiPhone || undefined,
        upiProvider: data.upiProvider || undefined,
        status: 'pending',
      });

      clearCart();
      setShowUpiModal(false);
      toast({ title: 'Order Placed!', description: 'We will verify your payment and process your order.' });
      navigate(`/order-success?order=${orderNumber}&upi=1`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Something went wrong';
      toast({ title: 'Failed to place order', description: message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goldRate) return;

    if (!address.full_name || !address.phone || !address.address_line1 || !address.city || !address.pincode) {
      toast({ title: 'Missing Information', description: 'Please fill in all required address fields.', variant: 'destructive' });
      return;
    }

    if (paymentMethod === 'upi') {
      if (!upiSettings?.qr_code_url) {
        toast({ title: 'UPI not available', description: 'UPI payment is not configured yet.', variant: 'destructive' });
        return;
      }
      setShowUpiModal(true);
      return;
    }

    // COD order
    setIsSubmitting(true);
    try {
      const orderNumber = generateOrderNumber();
      await createOrder(orderNumber);
      clearCart();
      toast({ title: 'Order Placed Successfully!', description: `Your order #${orderNumber} has been confirmed.` });
      navigate(`/order-success?order=${orderNumber}`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Something went wrong';
      toast({ title: 'Failed to place order', description: message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="font-serif text-3xl md:text-4xl font-medium mb-8">Checkout</h1>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {/* Shipping Address */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-medium">
                    <MapPin className="w-5 h-5 text-primary" />
                    Shipping Address
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="full_name">Full Name *</Label>
                      <Input id="full_name" value={address.full_name} onChange={(e) => setAddress(prev => ({ ...prev, full_name: e.target.value }))} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input id="phone" type="tel" value={address.phone} onChange={(e) => setAddress(prev => ({ ...prev, phone: e.target.value }))} required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address_line1">Address Line 1 *</Label>
                    <Input id="address_line1" value={address.address_line1} onChange={(e) => setAddress(prev => ({ ...prev, address_line1: e.target.value }))} placeholder="House/Flat No., Building, Street" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address_line2">Address Line 2</Label>
                    <Input id="address_line2" value={address.address_line2} onChange={(e) => setAddress(prev => ({ ...prev, address_line2: e.target.value }))} placeholder="Landmark, Area (optional)" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City *</Label>
                      <Input id="city" value={address.city} onChange={(e) => setAddress(prev => ({ ...prev, city: e.target.value }))} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State *</Label>
                      <Input id="state" value={address.state} onChange={(e) => setAddress(prev => ({ ...prev, state: e.target.value }))} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pincode">Pincode *</Label>
                      <Input id="pincode" value={address.pincode} onChange={(e) => setAddress(prev => ({ ...prev, pincode: e.target.value }))} required />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Method */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-medium">
                    <CreditCard className="w-5 h-5 text-primary" />
                    Payment Method
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                    <div className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-all ${paymentMethod === 'cod' ? 'border-primary bg-primary/5' : 'hover:bg-secondary/30'}`}>
                      <RadioGroupItem value="cod" id="cod" />
                      <Label htmlFor="cod" className="flex-1 cursor-pointer">
                        <div className="flex items-center gap-2">
                          <Truck className="w-5 h-5 text-muted-foreground" />
                          <span className="font-medium">Cash on Delivery</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">Pay when you receive your order</p>
                      </Label>
                    </div>

                    {upiSettings?.is_active && upiSettings.qr_code_url && (
                      <div className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-all mt-3 ${paymentMethod === 'upi' ? 'border-primary bg-primary/5' : 'hover:bg-secondary/30'}`}>
                        <RadioGroupItem value="upi" id="upi" />
                        <Label htmlFor="upi" className="flex-1 cursor-pointer">
                          <div className="flex items-center gap-2">
                            <QrCode className="w-5 h-5 text-muted-foreground" />
                            <span className="font-medium">Pay via UPI</span>
                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">GPay / PhonePe / UPI</span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">Scan QR code and pay using any UPI app</p>
                        </Label>
                      </div>
                    )}
                  </RadioGroup>
                </CardContent>
              </Card>

              {/* Order Notes */}
              <Card>
                <CardHeader>
                  <CardTitle className="font-medium">Order Notes (Optional)</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any special instructions for your order..." rows={3} />
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-medium">
                    <ShoppingBag className="w-5 h-5 text-primary" />
                    Order Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {items.map((item) => (
                      <div key={item.id} className="flex gap-3">
                        <img src={item.product.images[0] || '/placeholder.svg'} alt={item.product.name} className="w-16 h-16 object-cover rounded-lg" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium line-clamp-1">{item.product.name}</p>
                          <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                          <p className="text-sm font-semibold text-primary">{formatPrice(item.product.calculated_price.total * item.quantity)}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal</span>
                      <span>{formatPrice(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>GST ({gstRate}%)</span>
                      <span>{formatPrice(gstTotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Shipping</span>
                      <span className="text-green-600">Free</span>
                    </div>
                    <div className="flex justify-between font-serif text-lg font-medium pt-2 border-t">
                      <span>Total</span>
                      <span className="text-primary">{formatPrice(total)}</span>
                    </div>
                  </div>

                  <Button type="submit" className="w-full btn-premium py-6 text-lg" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing...</>
                    ) : paymentMethod === 'upi' ? (
                      'Pay with UPI'
                    ) : (
                      'Place Order'
                    )}
                  </Button>

                  <div className="grid grid-cols-2 gap-2 text-center pt-4 border-t">
                    <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                      <Truck className="w-4 h-4" /><span>Free Shipping</span>
                    </div>
                    <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                      <Shield className="w-4 h-4" /><span>Secure Payment</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>

      {/* UPI Payment Modal */}
      {upiSettings?.qr_code_url && (
        <UpiPaymentModal
          open={showUpiModal}
          onClose={() => setShowUpiModal(false)}
          onSubmit={handleUpiSubmit}
          amount={total}
          qrCodeUrl={upiSettings.qr_code_url}
          upiId={upiSettings.upi_id || undefined}
          merchantName={upiSettings.merchant_name || undefined}
        />
      )}
    </Layout>
  );
}
