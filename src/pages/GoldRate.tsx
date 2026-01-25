import { Layout } from '@/components/layout/Layout';
import { useGoldRate, useGoldRateHistory } from '@/hooks/useGoldRate';
import { formatPrice } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Calendar, Info } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function GoldRatePage() {
  const { data: currentRate, isLoading } = useGoldRate();
  const { data: history } = useGoldRateHistory(30);

  const chartData = history?.map((rate) => ({
    date: new Date(rate.effective_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    '22K': rate.rate_22k,
    '24K': rate.rate_24k,
  }));

  return (
    <Layout>
      {/* Hero */}
      <section className="relative py-16 bg-gradient-to-r from-rich-black via-charcoal to-rich-black overflow-hidden">
        <div className="absolute inset-0 bg-pattern-dots opacity-10" />
        <div className="container mx-auto px-4 relative">
          <div className="text-center">
            <span className="text-gold-light text-sm uppercase tracking-[0.3em]">Live Update</span>
            <h1 className="font-serif text-4xl md:text-5xl text-ivory font-semibold mt-2 mb-4">
              Today's Gold Rate
            </h1>
            <p className="text-ivory/60 max-w-2xl mx-auto">
              Check the latest gold prices updated daily. Our jewellery prices are dynamically 
              calculated based on these rates.
            </p>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4">
          {/* Current Rates */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <Card className="card-luxury border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-muted-foreground text-sm font-normal">
                  <div className="w-3 h-3 rounded-full bg-primary" />
                  22K Gold (Per Gram)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-serif text-4xl text-gold-gradient font-bold">
                  {isLoading ? '...' : formatPrice(currentRate?.rate_22k || 0)}
                </p>
                <p className="text-muted-foreground text-sm mt-1">
                  Most popular for jewellery
                </p>
              </CardContent>
            </Card>

            <Card className="card-luxury border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-muted-foreground text-sm font-normal">
                  <div className="w-3 h-3 rounded-full bg-gold-shimmer" />
                  24K Gold (Per Gram)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-serif text-4xl text-gold-gradient font-bold">
                  {isLoading ? '...' : formatPrice(currentRate?.rate_24k || 0)}
                </p>
                <p className="text-muted-foreground text-sm mt-1">
                  Pure gold, coins & bars
                </p>
              </CardContent>
            </Card>

            <Card className="card-luxury border-accent/20">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-muted-foreground text-sm font-normal">
                  <Calendar className="w-4 h-4" />
                  Last Updated
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-serif text-2xl font-bold">
                  {currentRate ? new Date(currentRate.effective_date).toLocaleDateString('en-IN', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : '...'}
                </p>
                <p className="text-muted-foreground text-sm mt-1">
                  Source: {currentRate?.source || 'Market rate'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Chart */}
          <Card className="mb-12">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-serif">
                <TrendingUp className="w-5 h-5 text-primary" />
                30-Day Gold Rate Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              {chartData && chartData.length > 0 ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="date" 
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                      />
                      <YAxis 
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        tickFormatter={(value) => `₹${value.toLocaleString()}`}
                      />
                      <Tooltip 
                        formatter={(value: number) => formatPrice(value)}
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="22K" 
                        stroke="hsl(43, 74%, 49%)" 
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="24K" 
                        stroke="hsl(48, 90%, 55%)" 
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-80 flex items-center justify-center text-muted-foreground">
                  <p>Rate history will appear here as data accumulates</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="font-serif flex items-center gap-2">
                  <Info className="w-5 h-5 text-primary" />
                  How We Calculate Prices
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>
                  All our jewellery prices are calculated using a transparent formula:
                </p>
                <div className="bg-secondary/50 p-4 rounded-lg font-mono text-sm">
                  <p><strong>Final Price =</strong></p>
                  <p className="ml-4">(Gold Rate × Weight)</p>
                  <p className="ml-4">+ Making Charges</p>
                  <p className="ml-4">+ Stone/Diamond Cost</p>
                  <p className="ml-4">+ 3% GST</p>
                </div>
                <p>
                  When the gold rate changes, all product prices update automatically. 
                  This ensures you always pay the fair market price.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-serif flex items-center gap-2">
                  <Info className="w-5 h-5 text-primary" />
                  Gold Purity Guide
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-secondary/50 rounded-lg">
                    <span className="font-medium text-foreground">24K Gold</span>
                    <span>99.9% Pure</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-secondary/50 rounded-lg">
                    <span className="font-medium text-foreground">22K Gold</span>
                    <span>91.6% Pure</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-secondary/50 rounded-lg">
                    <span className="font-medium text-foreground">18K Gold</span>
                    <span>75% Pure</span>
                  </div>
                </div>
                <p className="text-sm">
                  22K gold is the most popular choice for jewellery as it offers 
                  the perfect balance between purity and durability.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </Layout>
  );
}
