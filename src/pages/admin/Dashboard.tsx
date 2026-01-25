import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/hooks/useAuth';
import { useGoldRate } from '@/hooks/useGoldRate';
import { useProducts } from '@/hooks/useProducts';
import { formatPrice } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Package, 
  ShoppingCart, 
  Users, 
  TrendingUp,
  DollarSign,
  Settings,
  Edit,
  ArrowRight,
  Sparkles
} from 'lucide-react';

export default function AdminDashboard() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { data: goldRate } = useGoldRate();
  const { data: products } = useProducts();
  const navigate = useNavigate();

  // Redirect if not authenticated (in production, also check for admin role)
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/auth?redirect=/admin');
    }
  }, [authLoading, isAuthenticated, navigate]);

  if (authLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <p>Loading...</p>
        </div>
      </Layout>
    );
  }

  const stats = [
    {
      title: 'Total Products',
      value: products?.length || 0,
      icon: Package,
      href: '/admin/products',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Active Products',
      value: products?.filter(p => p.is_active)?.length || 0,
      icon: Sparkles,
      href: '/admin/products',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: "Today's Gold Rate (22K)",
      value: goldRate ? formatPrice(goldRate.rate_22k) + '/g' : 'N/A',
      icon: TrendingUp,
      href: '/admin/gold-rates',
      color: 'text-primary',
      bgColor: 'bg-amber-100',
    },
    {
      title: '24K Gold Rate',
      value: goldRate ? formatPrice(goldRate.rate_24k) + '/g' : 'N/A',
      icon: DollarSign,
      href: '/admin/gold-rates',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
  ];

  const quickActions = [
    {
      title: 'Update Gold Rate',
      description: 'Update today\'s gold rate for automatic price recalculation',
      icon: TrendingUp,
      href: '/admin/gold-rates',
      variant: 'default' as const,
    },
    {
      title: 'Manage Products',
      description: 'Add, edit, or disable products in the catalog',
      icon: Package,
      href: '/admin/products',
      variant: 'outline' as const,
    },
    {
      title: 'Making Charges',
      description: 'Update category-wise making charge percentages',
      icon: Settings,
      href: '/admin/making-charges',
      variant: 'outline' as const,
    },
    {
      title: 'View Orders',
      description: 'Manage customer orders and track deliveries',
      icon: ShoppingCart,
      href: '/admin/orders',
      variant: 'outline' as const,
    },
  ];

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-serif text-3xl md:text-4xl font-semibold mb-2">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground">
            Welcome back! Manage your jewellery store from here.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Link key={stat.title} to={stat.href}>
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">
                          {stat.title}
                        </p>
                        <p className="text-2xl font-bold">{stat.value}</p>
                      </div>
                      <div className={`p-3 rounded-full ${stat.bgColor}`}>
                        <Icon className={`w-5 h-5 ${stat.color}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="font-serif text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link key={action.title} to={action.href}>
                  <Card className="hover:shadow-lg transition-shadow h-full">
                    <CardContent className="p-6 flex items-start gap-4">
                      <div className="p-3 rounded-full bg-secondary">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">{action.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {action.description}
                        </p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-muted-foreground" />
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Current Gold Rate Card */}
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Current Gold Rates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-muted-foreground">22K Gold</p>
                <p className="text-2xl font-bold text-primary">
                  {goldRate ? formatPrice(goldRate.rate_22k) : '—'}/g
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">24K Gold</p>
                <p className="text-2xl font-bold text-primary">
                  {goldRate ? formatPrice(goldRate.rate_24k) : '—'}/g
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">18K Gold</p>
                <p className="text-2xl font-bold text-primary">
                  {goldRate?.rate_18k ? formatPrice(goldRate.rate_18k) : '—'}/g
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Last updated: {goldRate?.effective_date || 'Never'}
              </p>
              <Link to="/admin/gold-rates">
                <Button className="btn-premium gap-2">
                  <Edit className="w-4 h-4" />
                  Update Rates
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
