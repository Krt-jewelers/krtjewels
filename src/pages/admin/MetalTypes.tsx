import { useState } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { useAllMetalTypes, useCreateMetalType, useUpdateMetalType, useDeleteMetalType, useBulkUpdateMetalRates } from '@/hooks/useMetalTypes';
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
import { Plus, Trash2, Edit, Save, Loader2, Gem, TrendingUp } from 'lucide-react';
import { formatPrice } from '@/lib/types';

export default function AdminMetalTypes() {
  const { data: metalTypes = [], isLoading } = useAllMetalTypes();
  const createMutation = useCreateMetalType();
  const updateMutation = useUpdateMetalType();
  const deleteMutation = useDeleteMetalType();
  const bulkUpdateRates = useBulkUpdateMetalRates();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [ratePerGram, setRatePerGram] = useState('');
  const [displayOrder, setDisplayOrder] = useState('0');
  const [isActive, setIsActive] = useState(true);

  // Rate update mode
  const [rateEdits, setRateEdits] = useState<Record<string, string>>({});
  const [isUpdatingRates, setIsUpdatingRates] = useState(false);

  const openDialog = (mt?: any) => {
    if (mt) {
      setEditingId(mt.id);
      setName(mt.name);
      setSlug(mt.slug);
      setRatePerGram(mt.rate_per_gram.toString());
      setDisplayOrder(mt.display_order.toString());
      setIsActive(mt.is_active);
    } else {
      setEditingId(null);
      setName('');
      setSlug('');
      setRatePerGram('0');
      setDisplayOrder('0');
      setIsActive(true);
    }
    setIsDialogOpen(true);
  };

  const generateSlug = (n: string) => n.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/(^_|_$)/g, '');

  const handleSave = async () => {
    try {
      const data = {
        name,
        slug: slug || generateSlug(name),
        rate_per_gram: parseFloat(ratePerGram) || 0,
        display_order: parseInt(displayOrder) || 0,
        is_active: isActive,
      };
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, ...data });
        toast({ title: 'Updated', description: `${name} updated successfully` });
      } else {
        await createMutation.mutateAsync(data);
        toast({ title: 'Created', description: `${name} added successfully` });
      }
      setIsDialogOpen(false);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string, mtName: string) => {
    if (!confirm(`Delete ${mtName}? Products using this metal type may be affected.`)) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast({ title: 'Deleted', description: `${mtName} removed` });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleBulkRateUpdate = async () => {
    const updates = Object.entries(rateEdits)
      .filter(([, val]) => val !== '')
      .map(([id, val]) => ({ id, rate_per_gram: parseFloat(val) || 0 }));
    
    if (updates.length === 0) {
      toast({ title: 'No changes', description: 'Enter rates to update' });
      return;
    }

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
            <h1 className="font-serif text-3xl font-semibold mb-1">Metal Types & Rates</h1>
            <p className="text-muted-foreground">Manage metal types, add custom metals, and update rates</p>
          </div>
          <Button className="btn-premium" onClick={() => openDialog()}>
            <Plus className="w-4 h-4 mr-2" />
            Add Metal Type
          </Button>
        </div>

        {/* Quick Rate Update Card */}
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
                      type="number"
                      step="0.01"
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

        {/* Metal Types Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gem className="w-5 h-5" />
              All Metal Types
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
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
                        <Badge variant={mt.is_active ? 'default' : 'secondary'}>
                          {mt.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openDialog(mt)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(mt.id, mt.name)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Add/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Metal Type' : 'Add Metal Type'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input value={name} onChange={(e) => { setName(e.target.value); if (!editingId) setSlug(generateSlug(e.target.value)); }} placeholder="e.g. Rose Gold" />
              </div>
              <div className="space-y-2">
                <Label>Slug *</Label>
                <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="e.g. rose_gold" />
              </div>
              <div className="space-y-2">
                <Label>Rate per gram (₹)</Label>
                <Input type="number" step="0.01" value={ratePerGram} onChange={(e) => setRatePerGram(e.target.value)} placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label>Display Order</Label>
                <Input type="number" value={displayOrder} onChange={(e) => setDisplayOrder(e.target.value)} />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={isActive} onCheckedChange={setIsActive} />
                <Label>Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button className="btn-premium" onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
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
