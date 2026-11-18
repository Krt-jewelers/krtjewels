import { useState, useEffect } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Layout } from '@/components/layout/Layout';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { formatPrice } from '@/lib/types';
import { INDIAN_STATES } from '@/lib/pricing';
import {
  callOrderFunction,
  isValidPincode,
  normalizeIndianPhone,
  type OrderFunctionError,
  type OrderPayload,
  type OrderQuote,
  type PlacedOrder,
} from '@/lib/orders';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

// Saved addresses may spell the state differently ("tamilnadu", "TN").
const STATE_ALIASES: Record<string, string> = { tn: 'Tamil Nadu', ka: 'Karnataka', kl: 'Kerala', ap: 'Andhra Pradesh', ts: 'Telangana', py: 'Puducherry' };
function matchState(value: string | null | undefined): string {
  const key = (value || '').toLowerCase().replace(/[^a-z]/g, '');
  if (!key) return '';
  return STATE_ALIASES[key] || INDIAN_STATES.find((s) => s.toLowerCase().replace(/[^a-z]/g, '') === key) || '';
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, subtotal, gstTotal, total, isLoading: cartLoading, isPricing, hasPricingIssue } = useCart();
  const { data: gstSettings } = useGstSettings();
  const gstRate = gstSettings?.rate ?? 3;
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Set once an order is placed: the cart then empties while the success page
  // loads, and the empty-cart redirect below must not win that race.
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [showUpiModal, setShowUpiModal] = useState(false);
  const [upiAmount, setUpiAmount] = useState(0);
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
          state: matchState(data.state),
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

  if (items.length === 0 && !orderPlaced) {
    return <Navigate to="/cart" replace />;
  }

  const orderItems = (): OrderPayload['items'] =>
    items.map((item) => ({
      product_id: item.product_id,
      quantity: item.quantity,
      selected_variations: item.selected_variations || {},
    }));

  const shippingAddress = () => ({
    ...address,
    phone: normalizeIndianPhone(address.phone) || address.phone,
    pincode: address.pincode.replace(/\s/g, ''),
  });

  // Prices are re-checked on the server; if they moved, show the new total.
  const handleOrderError = (error: OrderFunctionError) => {
    if (error.code === 'PRICE_CHANGED' || error.code === 'RATE_UNAVAILABLE') {
      queryClient.invalidateQueries({ queryKey: ['goldRate'] });
      queryClient.invalidateQueries({ queryKey: ['metalTypes'] });
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    }
    if (error.code === 'ITEM_OPTIONS_CHANGED' || error.code === 'PRODUCT_UNAVAILABLE' || error.code === 'OUT_OF_STOCK') {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    }
    toast({
      title: error.code === 'PRICE_CHANGED' ? 'Prices updated' : 'Could not place order',
      description: error.message,
      variant: 'destructive',
    });
  };

  const validateForm = (): boolean => {
    const problems: string[] = [];
    if (address.full_name.trim().length < 2) problems.push('full name');
    if (!normalizeIndianPhone(address.phone)) problems.push('a 10-digit mobile number');
    if (address.address_line1.trim().length < 3) problems.push('address line 1');
    if (address.city.trim().length < 2) problems.push('city');
    if (!INDIAN_STATES.includes(address.state)) problems.push('state');
    if (!isValidPincode(address.pincode)) problems.push('a 6-digit pincode');
    if (problems.length > 0) {
      toast({ title: 'Please check your address', description: `Enter ${problems.join(', ')}.`, variant: 'destructive' });
      return false;
    }
    return true;
  };

  const placeOrder = async (method: 'cod' | 'upi', payment?: OrderPayload['payment']) => {
    const { data, error } = await callOrderFunction<PlacedOrder>({
      mode: 'place',
      items: orderItems(),
      shipping_address: shippingAddress(),
      payment_method: method,
      payment,
      notes: notes || null,
      expected_total: method === 'upi' ? upiAmount : total,
    });
    if (error || !data) {
      handleOrderError(error || { code: 'ERROR', message: 'Something went wrong' });
      return null;
    }
    // The success page empties the cart; doing it here raced the page change
    // and sent customers to the empty cart instead.
    setOrderPlaced(true);
    return data;
  };

  const handleUpiSubmit = async (data: { utr: string; screenshotUrl: string | null; upiPhone: string; upiProvider: string }) => {
    setIsSubmitting(true);
    try {
      const order = await placeOrder('upi', { utr: data.utr, upi_phone: data.upiPhone, upi_provider: data.upiProvider });
      if (!order) return;
      setShowUpiModal(false);
      toast({ title: 'Order placed', description: 'We will verify your payment and confirm your order.' });
      navigate(`/order-success?order=${order.order_number}&upi=1`, { state: { order } });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isPricing) {
      toast({ title: "Loading today's gold rate", description: 'Please wait a moment and try again.' });
      return;
    }
    if (hasPricingIssue) {
      toast({ title: 'Please review your cart', description: 'Some items need to be added again.', variant: 'destructive' });
      return;
    }
    if (!validateForm()) return;

    if (paymentMethod === 'upi') {
      if (!upiSettings?.qr_code_url) {
        toast({ title: 'UPI not available', description: 'UPI payment is not configured yet.', variant: 'destructive' });
        return;
      }
      // Confirm the amount with the server before showing the QR code.
      setIsSubmitting(true);
      try {
        const { data, error } = await callOrderFunction<{ quote: OrderQuote }>({
          mode: 'quote',
          items: orderItems(),
          expected_total: total,
        });
        if (error || !data) {
          handleOrderError(error || { code: 'ERROR', message: 'Something went wrong' });
          return;
        }
        setUpiAmount(data.quote.total_amount);
        setShowUpiModal(true);
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    setIsSubmitting(true);
    try {
      const order = await placeOrder('cod');
      if (!order) return;
      toast({ title: 'Order placed', description: `Your order #${order.order_number} has been received.` });
      navigate(`/order-success?order=${order.order_number}`, { state: { order } });
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = !isSubmitting && !isPricing && !hasPricingIssue;

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
                      <Input id="full_name" autoComplete="name" maxLength={100} value={address.full_name} onChange={(e) => setAddress(prev => ({ ...prev, full_name: e.target.value }))} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input id="phone" type="tel" inputMode="tel" autoComplete="tel" maxLength={16} placeholder="10-digit mobile number" value={address.phone} onChange={(e) => setAddress(prev => ({ ...prev, phone: e.target.value }))} required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address_line1">Address Line 1 *</Label>
                    <Input id="address_line1" autoComplete="address-line1" maxLength={200} value={address.address_line1} onChange={(e) => setAddress(prev => ({ ...prev, address_line1: e.target.value }))} placeholder="House/Flat No., Building, Street" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address_line2">Address Line 2</Label>
                    <Input id="address_line2" autoComplete="address-line2" maxLength={200} value={address.address_line2} onChange={(e) => setAddress(prev => ({ ...prev, address_line2: e.target.value }))} placeholder="Landmark, Area (optional)" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City *</Label>
                      <Input id="city" autoComplete="address-level2" maxLength={80} value={address.city} onChange={(e) => setAddress(prev => ({ ...prev, city: e.target.value }))} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State *</Label>
                      <Select value={address.state} onValueChange={(value) => setAddress(prev => ({ ...prev, state: value }))}>
                        <SelectTrigger id="state" aria-label="State">
                          <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                        <SelectContent>
                          {INDIAN_STATES.map((state) => (
                            <SelectItem key={state} value={state}>{state}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pincode">Pincode *</Label>
                      <Input id="pincode" inputMode="numeric" autoComplete="postal-code" maxLength={6} pattern="[1-9][0-9]{5}" value={address.pincode} onChange={(e) => setAddress(prev => ({ ...prev, pincode: e.target.value }))} required />
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
                  <Textarea aria-label="Order notes" maxLength={500} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any special instructions for your order..." rows={3} />
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
                          <p className="text-sm font-semibold text-primary">{formatPrice(item.line.lineTotal)}</p>
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

                  {isPricing && (
                    <p className="text-sm text-muted-foreground" role="status">
                      Loading today's gold rate before we can confirm your total…
                    </p>
                  )}
                  {hasPricingIssue && (
                    <p className="text-sm text-destructive" role="alert">
                      Some items in your cart need to be added again. <Link to="/cart" className="underline">Review cart</Link>
                    </p>
                  )}
                  <Button type="submit" className="w-full btn-premium py-6 text-lg" disabled={!canSubmit}>
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
          amount={upiAmount || total}
          qrCodeUrl={upiSettings.qr_code_url}
          upiId={upiSettings.upi_id || undefined}
          merchantName={upiSettings.merchant_name || undefined}
        />
      )}
    </Layout>
  );
}
