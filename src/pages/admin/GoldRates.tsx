import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useGoldRate, useGoldRateHistory } from '@/hooks/useGoldRate';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { formatPrice } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowLeft, Save, RefreshCw, TrendingUp, History } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminGoldRates() {
  const { data: currentRate, isLoading } = useGoldRate();
  const { data: rateHistory } = useGoldRateHistory(30);
  const [rate22k, setRate22k] = useState('');
  const [rate24k, setRate24k] = useState('');
  const [rate18k, setRate18k] = useState('');
  const [silverRate, setSilverRate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Initialize form with current rates when data loads
  useState(() => {
    if (currentRate) {
      setRate22k(currentRate.rate_22k.toString());
      setRate24k(currentRate.rate_24k.toString());
      if (currentRate.rate_18k) setRate18k(currentRate.rate_18k.toString());
      if (currentRate.silver_rate) setSilverRate(currentRate.silver_rate.toString());
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!rate22k || !rate24k) {
      toast({
        title: 'Error',
        description: 'Please enter both 22K and 24K gold rates',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // First, set all existing rates as not current
      await supabase
        .from('gold_rates')
        .update({ is_current: false })
        .eq('is_current', true);

      // Insert new rate
      const { error } = await supabase.from('gold_rates').insert({
        rate_22k: parseFloat(rate22k),
        rate_24k: parseFloat(rate24k),
        rate_18k: rate18k ? parseFloat(rate18k) : null,
        silver_rate: silverRate ? parseFloat(silverRate) : null,
        is_current: true,
        source: 'admin_manual',
        effective_date: new Date().toISOString().split('T')[0],
      });

      if (error) throw error;

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['goldRate'] });
      queryClient.invalidateQueries({ queryKey: ['goldRateHistory'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });

      toast({
        title: 'Success!',
        description: 'Gold rates updated successfully. All product prices have been recalculated.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update gold rates',
        variant: 'destructive',
      });
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

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/admin')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="font-serif text-3xl md:text-4xl font-semibold mb-2">
            Gold Rate Management
          </h1>
          <p className="text-muted-foreground">
            Update the daily gold rate. All product prices will recalculate automatically.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Update Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Update Today's Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Current Rates Display */}
                {currentRate && (
                  <div className="bg-secondary/50 rounded-lg p-4 mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium">Current Rates</p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={fillCurrentRates}
                      >
                        <RefreshCw className="w-4 h-4 mr-1" />
                        Fill
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">22K:</span>
                        <span className="ml-2 font-semibold">
                          {formatPrice(currentRate.rate_22k)}/g
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">24K:</span>
                        <span className="ml-2 font-semibold">
                          {formatPrice(currentRate.rate_24k)}/g
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="rate22k">22K Gold Rate (₹/gram) *</Label>
                    <Input
                      id="rate22k"
                      type="number"
                      step="0.01"
                      value={rate22k}
                      onChange={(e) => setRate22k(e.target.value)}
                      placeholder="e.g., 5850"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rate24k">24K Gold Rate (₹/gram) *</Label>
                    <Input
                      id="rate24k"
                      type="number"
                      step="0.01"
                      value={rate24k}
                      onChange={(e) => setRate24k(e.target.value)}
                      placeholder="e.g., 6380"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="rate18k">18K Gold Rate (₹/gram)</Label>
                    <Input
                      id="rate18k"
                      type="number"
                      step="0.01"
                      value={rate18k}
                      onChange={(e) => setRate18k(e.target.value)}
                      placeholder="e.g., 4388"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="silverRate">Silver Rate (₹/gram)</Label>
                    <Input
                      id="silverRate"
                      type="number"
                      step="0.01"
                      value={silverRate}
                      onChange={(e) => setSilverRate(e.target.value)}
                      placeholder="e.g., 85"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full btn-premium py-6"
                  disabled={isSubmitting}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isSubmitting ? 'Updating...' : 'Update Gold Rates'}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  * All product prices will be automatically recalculated based on the new rates
                </p>
              </form>
            </CardContent>
          </Card>

          {/* Rate History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5" />
                Rate History (Last 30 Days)
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
                      {rateHistory
                        .sort((a, b) => new Date(b.effective_date).getTime() - new Date(a.effective_date).getTime())
                        .map((rate) => (
                          <TableRow key={rate.id}>
                            <TableCell>
                              {format(new Date(rate.effective_date), 'dd MMM yyyy')}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatPrice(rate.rate_22k)}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatPrice(rate.rate_24k)}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No rate history available
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
