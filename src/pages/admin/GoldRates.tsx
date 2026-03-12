import { useState } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { useGoldRateHistory } from '@/hooks/useGoldRate';
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
import { Save, TrendingUp, History, Plus, Trash2, Edit, Loader2, Gem } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminGoldRates() {
  const { data: rateHistory } = useGoldRateHistory(30);
  const { data: metalTypes = [], isLoading: metalLoading } = useAllMetalTypes();
  const createMutation = useCreateMetalType();
  const updateMutation = useUpdateMetalType();
  const deleteMutation = useDeleteMetalType();
  const bulkUpdateRates = useBulkUpdateMetalRates();
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

  const getLegacyRatesFromMetalTypes = (overrides?: { byId?: Record<string, number>; bySlug?: Record<string, number> }) => {
    const metalById = new Map(metalTypes.map(mt => [mt.id, mt]));
    const rateBySlug = new Map(metalTypes.map(mt => [mt.slug, mt.rate_per_gram]));

    if (overrides?.byId) {
      Object.entries(overrides.byId).forEach(([id, rate]) => {
        const mt = metalById.get(id);
        if (mt) rateBySlug.set(mt.slug, rate);
      });
    }

    if (overrides?.bySlug) {
      Object.entries(overrides.bySlug).forEach(([slug, rate]) => {
        rateBySlug.set(slug, rate);
      });
    }

    return {
      rate22k: rateBySlug.get('gold_22k'),
      rate24k: rateBySlug.get('gold_24k'),
      rate18k: rateBySlug.get('gold_18k'),
      silver: rateBySlug.get('silver'),
    };
  };

  const syncLegacyGoldRates = async (overrides?: { byId?: Record<string, number>; bySlug?: Record<string, number> }) => {
    const legacyRates = getLegacyRatesFromMetalTypes(overrides);
    if (legacyRates.rate22k == null || legacyRates.rate24k == null) {
      toast({
        title: 'Legacy sync skipped',
        description: 'Add active metal types with slugs gold_22k and gold_24k to keep gold rate history updated.',
      });
      return;
    }

    const safeNumber = (value?: number) => (typeof value === 'number' && !Number.isNaN(value) ? value : null);

    await supabase.from('gold_rates').update({ is_current: false }).eq('is_current', true);
    const { error } = await supabase.from('gold_rates').insert([{
      rate_22k: legacyRates.rate22k,
      rate_24k: legacyRates.rate24k,
      rate_18k: safeNumber(legacyRates.rate18k),
      silver_rate: safeNumber(legacyRates.silver),
      is_current: true,
      source: 'admin_metal_types',
      effective_date: new Date().toISOString().split('T')[0],
    }]);
    if (error) throw error;
    await queryClient.invalidateQueries({ queryKey: ['goldRate'] });
    await queryClient.invalidateQueries({ queryKey: ['goldRateHistory'] });
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
    const parsedRate = Number.isNaN(parseFloat(mtRate)) ? 0 : parseFloat(mtRate);
    try {
      const data = { name: mtName, slug: mtSlug || generateSlug(mtName), rate_per_gram: parsedRate, display_order: parseInt(mtOrder) || 0, is_active: mtActive };
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, ...data });
        toast({ title: 'Updated', description: `${mtName} updated successfully` });
      } else {
        await createMutation.mutateAsync(data);
        toast({ title: 'Created', description: `${mtName} added successfully` });
      }
      if (['gold_22k', 'gold_24k', 'gold_18k', 'silver'].includes(data.slug)) {
        await syncLegacyGoldRates({ bySlug: { [data.slug]: data.rate_per_gram } });
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
      const overridesById = updates.reduce<Record<string, number>>((acc, item) => {
        acc[item.id] = item.rate_per_gram;
        return acc;
      }, {});
      const shouldSyncLegacy = updates.some((update) => {
        const mt = metalTypes.find(m => m.id === update.id);
        return mt && ['gold_22k', 'gold_24k', 'gold_18k', 'silver'].includes(mt.slug);
      });
      if (shouldSyncLegacy) {
        await syncLegacyGoldRates({ byId: overridesById });
      }
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
