import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Clock, Search, Users, ShoppingBag, Layers, Package, RefreshCw, TrendingUp, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, subHours, startOfDay } from 'date-fns';

type DateRange = '24h' | '7d' | '30d' | '90d';

function getDateFrom(range: DateRange): string {
  const now = new Date();
  switch (range) {
    case '24h': return subHours(now, 24).toISOString();
    case '7d': return subDays(now, 7).toISOString();
    case '30d': return subDays(now, 30).toISOString();
    case '90d': return subDays(now, 90).toISOString();
  }
}

export default function AdminAnalytics() {
  const [pageQuery, setPageQuery] = useState('');
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const dateFrom = getDateFrom(dateRange);

  // Page views
  const { data: pageViews, refetch: refetchPageViews } = useQuery({
    queryKey: ['analytics-page-views', dateRange],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('page_views')
        .select('*')
        .gte('created_at', dateFrom)
        .order('created_at', { ascending: false })
        .limit(1000) as any;
      if (error) throw error;
      return (data || []) as { page_path: string; session_id: string; created_at: string; page_title: string }[];
    },
  });

  // Search logs
  const { data: searchLogs, refetch: refetchSearches } = useQuery({
    queryKey: ['analytics-searches', dateRange],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('search_logs')
        .select('*')
        .gte('created_at', dateFrom)
        .order('created_at', { ascending: false })
        .limit(1000) as any;
      if (error) throw error;
      return (data || []) as { query: string; results_count: number; created_at: string }[];
    },
  });

  // Orders count
  const { data: ordersData, refetch: refetchOrders } = useQuery({
    queryKey: ['analytics-orders', dateRange],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('id, total_amount, created_at, status')
        .gte('created_at', dateFrom);
      if (error) throw error;
      return data || [];
    },
  });

  // Top products by order items
  const { data: topProducts, refetch: refetchProducts } = useQuery({
    queryKey: ['analytics-top-products', dateRange],
    queryFn: async () => {
      const { data: orders } = await supabase
        .from('orders')
        .select('id')
        .gte('created_at', dateFrom);
      if (!orders?.length) return [];
      const orderIds = orders.map(o => o.id);
      const { data: items } = await supabase
        .from('order_items')
        .select('product_name, quantity, product_image')
        .in('order_id', orderIds);
      if (!items) return [];
      const map = new Map<string, { name: string; qty: number; image: string | null }>();
      items.forEach(i => {
        const existing = map.get(i.product_name) || { name: i.product_name, qty: 0, image: i.product_image };
        existing.qty += i.quantity;
        map.set(i.product_name, existing);
      });
      return Array.from(map.values()).sort((a, b) => b.qty - a.qty).slice(0, 10);
    },
  });

  // Top categories
  const { data: topCategories, refetch: refetchCategories } = useQuery({
    queryKey: ['analytics-top-categories', dateRange],
    queryFn: async () => {
      const views = pageViews || [];
      const catMap = new Map<string, number>();
      views.forEach(v => {
        const match = v.page_path.match(/^\/collections\/([^/?]+)/);
        if (match) {
          const cat = match[1].replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
          catMap.set(cat, (catMap.get(cat) || 0) + 1);
        }
      });
      return Array.from(catMap.entries())
        .map(([label, value]) => ({ label, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);
    },
    enabled: !!pageViews,
  });

  // Computed stats
  const totalPageViews = pageViews?.length || 0;
  const uniqueVisitors = new Set(pageViews?.map(v => v.session_id)).size;
  const totalSearches = searchLogs?.length || 0;
  const totalOrders = ordersData?.length || 0;

  // Top pages
  const topPages = useMemo(() => {
    if (!pageViews) return [];
    const map = new Map<string, { count: number; title: string }>();
    pageViews.forEach(v => {
      const existing = map.get(v.page_path) || { count: 0, title: v.page_title || v.page_path };
      existing.count++;
      map.set(v.page_path, existing);
    });
    return Array.from(map.entries())
      .map(([path, { count, title }]) => ({ label: path, value: count, secondary: title }))
      .sort((a, b) => b.value - a.value);
  }, [pageViews]);

  const filteredPages = useMemo(() => {
    if (!pageQuery.trim()) return topPages.slice(0, 15);
    const q = pageQuery.trim().toLowerCase();
    return topPages.filter(r => r.label.toLowerCase().includes(q) || r.secondary?.toLowerCase().includes(q)).slice(0, 15);
  }, [pageQuery, topPages]);

  // Top searches
  const topSearches = useMemo(() => {
    if (!searchLogs) return [];
    const map = new Map<string, number>();
    searchLogs.forEach(s => map.set(s.query, (map.get(s.query) || 0) + 1));
    return Array.from(map.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 15);
  }, [searchLogs]);

  const handleRefresh = () => {
    refetchPageViews();
    refetchSearches();
    refetchOrders();
    refetchProducts();
    refetchCategories();
  };

  // Revenue
  const totalRevenue = ordersData?.reduce((sum, o) => sum + Number(o.total_amount || 0), 0) || 0;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-serif font-semibold">Analytics</h1>
            <p className="text-muted-foreground">
              Real-time tracking of page visits, searches, orders, and top-performing content.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
              <SelectTrigger className="w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">Last 24 hours</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="gap-2" onClick={handleRefresh}>
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          </div>
        </div>

        <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
          {[
            { title: 'Page Views', icon: Eye, value: totalPageViews.toLocaleString(), color: 'text-blue-500' },
            { title: 'Unique Visitors', icon: Users, value: uniqueVisitors.toLocaleString(), color: 'text-green-500' },
            { title: 'Search Volume', icon: Search, value: totalSearches.toLocaleString(), color: 'text-amber-500' },
            { title: 'Orders', icon: ShoppingBag, value: totalOrders.toLocaleString(), color: 'text-purple-500' },
            { title: 'Revenue', icon: TrendingUp, value: `₹${(totalRevenue / 1000).toFixed(1)}K`, color: 'text-primary' },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Icon className={`w-5 h-5 ${stat.color}`} />
                    </div>
                    <div>
                      <p className="text-lg font-semibold">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.title}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Top Pages
              </CardTitle>
              <CardDescription>Most visited pages ranked by views.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={pageQuery}
                  onChange={(e) => setPageQuery(e.target.value)}
                  placeholder="Search pages..."
                  className="pl-9"
                />
              </div>
              {filteredPages.length === 0 ? (
                <p className="text-sm text-muted-foreground">No page views recorded yet.</p>
              ) : (
                <div className="space-y-2">
                  {filteredPages.map((row, i) => {
                    const maxVal = filteredPages[0]?.value || 1;
                    return (
                      <div key={row.label} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="truncate max-w-[70%] font-mono text-xs">{row.label}</span>
                          <Badge variant="secondary" className="text-xs">{row.value}</Badge>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-1.5">
                          <div
                            className="bg-primary h-1.5 rounded-full transition-all"
                            style={{ width: `${(row.value / maxVal) * 100}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5 text-primary" />
                Top Searches
              </CardTitle>
              <CardDescription>Customer search terms ranked by volume.</CardDescription>
            </CardHeader>
            <CardContent>
              {topSearches.length === 0 ? (
                <p className="text-sm text-muted-foreground">No searches recorded yet.</p>
              ) : (
                <div className="space-y-2">
                  {topSearches.map((row) => {
                    const maxVal = topSearches[0]?.value || 1;
                    return (
                      <div key={row.label} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="capitalize">{row.label}</span>
                          <Badge variant="secondary" className="text-xs">{row.value}</Badge>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-1.5">
                          <div
                            className="bg-amber-500 h-1.5 rounded-full transition-all"
                            style={{ width: `${(row.value / maxVal) * 100}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-primary" />
                Top Categories
              </CardTitle>
              <CardDescription>Most browsed categories by page visits.</CardDescription>
            </CardHeader>
            <CardContent>
              {!topCategories?.length ? (
                <p className="text-sm text-muted-foreground">No category visits recorded yet.</p>
              ) : (
                <div className="space-y-2">
                  {topCategories.map((row) => {
                    const maxVal = topCategories[0]?.value || 1;
                    return (
                      <div key={row.label} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span>{row.label}</span>
                          <Badge variant="secondary" className="text-xs">{row.value}</Badge>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-1.5">
                          <div
                            className="bg-green-500 h-1.5 rounded-full transition-all"
                            style={{ width: `${(row.value / maxVal) * 100}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
                Top Selling Products
              </CardTitle>
              <CardDescription>Products ranked by purchase quantity.</CardDescription>
            </CardHeader>
            <CardContent>
              {!topProducts?.length ? (
                <p className="text-sm text-muted-foreground">No purchase data yet.</p>
              ) : (
                <div className="space-y-3">
                  {topProducts.map((p, i) => (
                    <div key={p.name} className="flex items-center gap-3">
                      <span className="text-xs font-bold text-muted-foreground w-5">#{i + 1}</span>
                      {p.image && (
                        <img src={p.image} alt="" className="w-8 h-8 rounded object-cover" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{p.name}</p>
                      </div>
                      <Badge variant="secondary">{p.qty} sold</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
