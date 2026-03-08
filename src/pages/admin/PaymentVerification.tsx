import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { formatPrice } from '@/lib/types';
import { CheckCircle2, XCircle, Clock, Eye, Image, Hash, Phone, Loader2 } from 'lucide-react';

interface PendingOrder {
  id: string;
  order_number: string;
  total_amount: number;
  payment_utr: string | null;
  payment_proof_url: string | null;
  upi_phone: string | null;
  upi_provider: string | null;
  payment_verified: boolean | null;
  created_at: string;
  shipping_address: { full_name?: string } | null;
}

export default function AdminPaymentVerification() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<PendingOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<PendingOrder | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    fetchPendingPayments();
  }, []);

  const fetchPendingPayments = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('id, order_number, total_amount, payment_utr, payment_proof_url, upi_phone, upi_provider, payment_verified, created_at, shipping_address')
        .eq('payment_method', 'upi')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders((data as unknown as PendingOrder[]) || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (orderId: string, verified: boolean) => {
    setProcessing(orderId);
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          payment_verified: verified,
          payment_verified_at: new Date().toISOString(),
          status: verified ? 'confirmed' : 'cancelled',
        })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: verified ? 'Payment Approved' : 'Payment Rejected',
        description: `Order has been ${verified ? 'confirmed' : 'cancelled'}.`,
      });

      fetchPendingPayments();
      setSelectedOrder(null);
    } catch (err) {
      toast({ title: 'Error', description: String(err), variant: 'destructive' });
    } finally {
      setProcessing(null);
    }
  };

  const pendingOrders = orders.filter(o => o.payment_verified === null || o.payment_verified === false);
  const verifiedOrders = orders.filter(o => o.payment_verified === true);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-serif font-semibold">Payment Verification</h1>
          <p className="text-muted-foreground">Review and verify UPI payments from customers</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingOrders.length}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{verifiedOrders.length}</p>
                <p className="text-sm text-muted-foreground">Verified</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Hash className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{orders.length}</p>
                <p className="text-sm text-muted-foreground">Total UPI Orders</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-20" />)}
          </div>
        ) : pendingOrders.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <h3 className="font-medium text-lg">All caught up!</h3>
              <p className="text-muted-foreground">No pending payments to verify</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {pendingOrders.map((order) => {
              const addr = order.shipping_address as { full_name?: string } | null;
              return (
                <Card key={order.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">#{order.order_number}</span>
                          <Badge variant="outline" className="bg-yellow-100 text-yellow-700 border-yellow-300">
                            Pending Verification
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                          <span className="font-medium text-foreground">{formatPrice(order.total_amount)}</span>
                          {addr?.full_name && <span>• {addr.full_name}</span>}
                          {order.upi_phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" /> {order.upi_phone}
                            </span>
                          )}
                          {order.payment_utr && (
                            <span className="flex items-center gap-1">
                              <Hash className="w-3 h-3" /> UTR: {order.payment_utr}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(order.created_at).toLocaleString('en-IN')}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setSelectedOrder(order)} className="gap-1">
                          <Eye className="w-4 h-4" /> View
                        </Button>
                        <Button
                          size="sm"
                          className="gap-1 bg-green-600 hover:bg-green-700"
                          disabled={processing === order.id}
                          onClick={() => handleVerify(order.id, true)}
                        >
                          {processing === order.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="gap-1"
                          disabled={processing === order.id}
                          onClick={() => handleVerify(order.id, false)}
                        >
                          <XCircle className="w-4 h-4" /> Reject
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Detail Modal */}
        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Payment Details — #{selectedOrder?.order_number}</DialogTitle>
            </DialogHeader>
            {selectedOrder && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Amount</p>
                    <p className="font-bold text-lg text-primary">{formatPrice(selectedOrder.total_amount)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Date</p>
                    <p className="font-medium">{new Date(selectedOrder.created_at).toLocaleString('en-IN')}</p>
                  </div>
                  {selectedOrder.upi_phone && (
                    <div>
                      <p className="text-muted-foreground">Phone</p>
                      <p className="font-medium">{selectedOrder.upi_phone}</p>
                    </div>
                  )}
                  {selectedOrder.upi_provider && (
                    <div>
                      <p className="text-muted-foreground">UPI Provider</p>
                      <p className="font-medium">{selectedOrder.upi_provider}</p>
                    </div>
                  )}
                  {selectedOrder.payment_utr && (
                    <div className="col-span-2">
                      <p className="text-muted-foreground">UTR Number</p>
                      <p className="font-mono font-bold text-lg">{selectedOrder.payment_utr}</p>
                    </div>
                  )}
                </div>

                {selectedOrder.payment_proof_url && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2 flex items-center gap-1">
                      <Image className="w-4 h-4" /> Payment Screenshot
                    </p>
                    <img
                      src={selectedOrder.payment_proof_url}
                      alt="Payment proof"
                      className="max-w-full max-h-80 object-contain rounded-lg border"
                    />
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    className="flex-1 gap-1 bg-green-600 hover:bg-green-700"
                    disabled={processing === selectedOrder.id}
                    onClick={() => handleVerify(selectedOrder.id, true)}
                  >
                    {processing === selectedOrder.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    Approve Payment
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1 gap-1"
                    disabled={processing === selectedOrder.id}
                    onClick={() => handleVerify(selectedOrder.id, false)}
                  >
                    <XCircle className="w-4 h-4" /> Reject
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
