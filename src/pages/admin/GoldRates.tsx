import { useState } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { useGoldRate, useGoldRateHistory } from '@/hooks/useGoldRate';
import { useAllMetalTypes, useCreateMetalType, useUpdateMetalType, useDeleteMetalType, useBulkUpdateMetalRates } from '@/hooks/useMetalTypes';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { formatPrice } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Save, RefreshCw, TrendingUp, History, Plus, Trash2, Edit, Loader2, Gem } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminGoldRates() {
  const { data: currentRate, isLoading } = useGoldRate();
  const { data: rateHistory } = useGoldRateHistory(30);
  const { data: metalTypes = [], isLoading: metalLoading } = useAllMetalTypes();
  const createMutation = useCreateMetalType();
  const updateMutation = useUpdateMetalType();
  const deleteMutation = useDeleteMetalType();
  const bulkUpdateRates = useBulkUpdateMetalRates();
  const [rate22k, setRate22k] = useState('');
  const [rate24k, setRate24k] = useState('');
  const [rate18k, setRate18k] = useState('');
  const [silverRate, setSilverRate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Metal type dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [mtName, setMtName] = useState('');
  const [mtSlug, setMtSlug] = useState('');
  const [mtRate, setMtRate] = useState('');
  const [mtOrder, setMtOrder] = useState('0');
  const [mtActive, setMtActive] = useState(true);

  // Quick rate edits
  const [rateEdits, setRateEdits] = useState<Record<string, string>>({});
  const [isUpdatingRates, setIsUpdatingRates] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rate22k || !rate24k) {
      toast({ title: 'Error', description: 'Please enter both 22K and 24K gold rates', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    try {
      await supabase.from('gold_rates').update({ is_current: false }).eq('is_current', true);
      const { error } = await supabase.from('gold_rates').insert([{
        rate_22k: parseFloat(rate22k),
        rate_24k: parseFloat(rate24k),
        rate_18k: rate18k ? parseFloat(rate18k) : null,
        silver_rate: silverRate ? parseFloat(silverRate) : null,
        is_current: true,
        source: 'admin_manual',
        effective_date: new Date().toISOString().split('T')[0],
      }]);
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ['goldRate'] });
      await queryClient.invalidateQueries({ queryKey: ['goldRateHistory'] });
      await queryClient.invalidateQueries({ queryKey: ['products'] });
      await queryClient.invalidateQueries({ queryKey: ['adminProducts'] });
      toast({ title: 'Success!', description: 'Gold rates updated. All product prices recalculated automatically.' });
      setRate22k(''); setRate24k(''); setRate18k(''); setSilverRate('');
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to update gold rates', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillCurrentRates = () => {
    if (currentRate) {
      setRate22k(currentRate.rate_22k.toString());
      setRate24k(currentRate.rate_24k.toString());
      if (currentRate.rate_18k) setRate18k(currentRate.rate_18k.toString());
      if (currentRate.silver_rate) setSilverRate(currentRate.silver_rate.toString());
    }
  };

  // Metal type handlers
  const generateSlug = (n: string) => n.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/(^_|_$)/g, '');

  const openDialog = (mt?: any) => {
    if (mt) {
      setEditingId(mt.id); setMtName(mt.name); setMtSlug(mt.slug);
      setMtRate(mt.rate_per_gram.toString()); setMtOrder(mt.display_order.toString()); setMtActive(mt.is_active);
    } else {
      setEditingId(null); setMtName(''); setMtSlug(''); setMtRate('0'); setMtOrder('0'); setMtActive(true);
    }
    setIsDialogOpen(true);
  };

  const handleSaveMetal = async () => {
    try {
      const data = { name: mtName, slug: mtSlug || generateSlug(mtName), rate_per_gram: parseFloat(mtRate) || 0, display_order: parseInt(mtOrder) || 0, is_active: mtActive };
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, ...data });
        toast({ title: 'Updated', description: `${mtName} updated successfully` });
      } else {
        await createMutation.mutateAsync(data);
        toast({ title: 'Created', description: `${mtName} added successfully` });
      }
      setIsDialogOpen(false);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleDeleteMetal = async (id: string, name: string) => {
    if (!confirm(`Delete ${name}? Products using this metal type may be affected.`)) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast({ title: 'Deleted', description: `${name} removed` });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleBulkRateUpdate = async () => {
    const updates = Object.entries(rateEdits).filter(([, val]) => val !== '').map(([id, val]) => ({ id, rate_per_gram: parseFloat(val) || 0 }));
    if (updates.length === 0) { toast({ title: 'No changes', description: 'Enter rates to update' }); return; }
    setIsUpdatingRates(true);
    try {
      await bulkUpdateRates.mutateAsync(updates);
      toast({ title: 'Rates Updated!', description: `${updates.length} metal type rates updated. Product prices recalculated.` });
      setRateEdits({});
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setIsUpdatingRates(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-3xl font-semibold mb-1">Rates & Metal Types</h1>
            <p className="text-muted-foreground">Manage gold rates, custom metal types, and pricing — all in one place</p>
          </div>
          <Button className="btn-premium" onClick={() => openDialog()}>
            <Plus className="w-4 h-4 mr-2" />
            Add Metal Type
          </Button>
        </div>

        {/* Quick Rate Update for all metal types */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Quick Rate Update
            </CardTitle>
            <CardDescription>Update rates for all metal types at once. All product prices recalculate automatically.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
              {metalTypes.filter(mt => mt.is_active).map((mt) => (
                <div key={mt.id} className="space-y-1">
                  <Label className="text-xs">{mt.name}</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number" step="0.01"
                      placeholder={mt.rate_per_gram.toString()}
                      value={rateEdits[mt.id] ?? ''}
                      onChange={(e) => setRateEdits(prev => ({ ...prev, [mt.id]: e.target.value }))}
                      className="h-9"
                    />
                    <span className="text-xs text-muted-foreground whitespace-nowrap">/g</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Current: {formatPrice(mt.rate_per_gram)}/g</p>
                </div>
              ))}
            </div>
            <Button onClick={handleBulkRateUpdate} disabled={isUpdatingRates} className="btn-premium">
              {isUpdatingRates ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Update All Rates
            </Button>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Legacy Gold Rate Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Update Legacy Gold Rates
              </CardTitle>
              <CardDescription>For backward compatibility with legacy gold_rates table</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {currentRate && (
                  <div className="bg-secondary/50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-medium">Current Rates</p>
                      <Button type="button" variant="ghost" size="sm" onClick={fillCurrentRates}>
                        <RefreshCw className="w-4 h-4 mr-1" /> Fill
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div><span className="text-muted-foreground">22K:</span><span className="ml-2 font-semibold text-primary">{formatPrice(currentRate.rate_22k)}/g</span></div>
                      <div><span className="text-muted-foreground">24K:</span><span className="ml-2 font-semibold text-primary">{formatPrice(currentRate.rate_24k)}/g</span></div>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>22K Gold (₹/gram) *</Label>
                    <Input type="number" step="0.01" value={rate22k} onChange={(e) => setRate22k(e.target.value)} placeholder="e.g., 5850" required />
                  </div>
                  <div className="space-y-2">
                    <Label>24K Gold (₹/gram) *</Label>
                    <Input type="number" step="0.01" value={rate24k} onChange={(e) => setRate24k(e.target.value)} placeholder="e.g., 6380" required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>18K Gold (₹/gram)</Label>
                    <Input type="number" step="0.01" value={rate18k} onChange={(e) => setRate18k(e.target.value)} placeholder="e.g., 4388" />
                  </div>
                  <div className="space-y-2">
                    <Label>Silver (₹/gram)</Label>
                    <Input type="number" step="0.01" value={silverRate} onChange={(e) => setSilverRate(e.target.value)} placeholder="e.g., 85" />
                  </div>
                </div>
                <Button type="submit" className="w-full btn-premium py-6" disabled={isSubmitting}>
                  <Save className="w-4 h-4 mr-2" />
                  {isSubmitting ? 'Updating...' : 'Update Gold Rates'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Rate History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5" /> Rate History (30 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {rateHistory && rateHistory.length > 0 ? (
                <div className="max-h-[400px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">22K</TableHead>
                        <TableHead className="text-right">24K</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rateHistory.sort((a, b) => new Date(b.effective_date).getTime() - new Date(a.effective_date).getTime()).map((rate) => (
                        <TableRow key={rate.id}>
                          <TableCell className="text-sm">{format(new Date(rate.effective_date), 'dd MMM yyyy')}</TableCell>
                          <TableCell className="text-right text-sm">{formatPrice(rate.rate_22k)}</TableCell>
                          <TableCell className="text-right text-sm">{formatPrice(rate.rate_24k)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">No rate history available</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* All Metal Types Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gem className="w-5 h-5" /> All Metal Types
            </CardTitle>
          </CardHeader>
          <CardContent>
            {metalLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead className="text-right">Rate/gram</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {metalTypes.map((mt) => (
                    <TableRow key={mt.id}>
                      <TableCell className="font-medium">{mt.name}</TableCell>
                      <TableCell><Badge variant="outline">{mt.slug}</Badge></TableCell>
                      <TableCell className="text-right font-semibold text-primary">{formatPrice(mt.rate_per_gram)}</TableCell>
                      <TableCell>{mt.display_order}</TableCell>
                      <TableCell>
                        <Badge variant={mt.is_active ? 'default' : 'secondary'}>{mt.is_active ? 'Active' : 'Inactive'}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openDialog(mt)}><Edit className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteMetal(mt.id, mt.name)}><Trash2 className="w-4 h-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Add/Edit Metal Type Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Metal Type' : 'Add Metal Type'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input value={mtName} onChange={(e) => { setMtName(e.target.value); if (!editingId) setMtSlug(generateSlug(e.target.value)); }} placeholder="e.g. Rose Gold" />
              </div>
              <div className="space-y-2">
                <Label>Slug *</Label>
                <Input value={mtSlug} onChange={(e) => setMtSlug(e.target.value)} placeholder="e.g. rose_gold" />
              </div>
              <div className="space-y-2">
                <Label>Rate per gram (₹)</Label>
                <Input type="number" step="0.01" value={mtRate} onChange={(e) => setMtRate(e.target.value)} placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label>Display Order</Label>
                <Input type="number" value={mtOrder} onChange={(e) => setMtOrder(e.target.value)} />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={mtActive} onCheckedChange={setMtActive} />
                <Label>Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button className="btn-premium" onClick={handleSaveMetal} disabled={createMutation.isPending || updateMutation.isPending}>
                {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingId ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
