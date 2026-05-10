import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Loader2, Shield, Sparkles } from 'lucide-react';
import adminLoginVideo from '@/assets/admin-login-video.mp4.asset.json';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated, isAdmin, loading } = useAuth();

  useEffect(() => {
    if (!loading && isAuthenticated && isAdmin) {
      navigate('/admin');
    }
  }, [loading, isAuthenticated, isAdmin, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', data.user.id)
        .eq('role', 'admin')
        .maybeSingle();
      if (roleError) throw roleError;

      if (!roleData) {
        await supabase.auth.signOut();
        toast({ title: 'Access Denied', description: 'You do not have admin privileges.', variant: 'destructive' });
        return;
      }

      toast({ title: 'Welcome Admin!', description: 'Redirecting to dashboard...' });
      navigate('/admin');
    } catch (error: any) {
      toast({ title: 'Login Failed', description: error.message || 'Invalid credentials', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary/30">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-background">
      {/* LEFT: cinematic video */}
      <div className="relative hidden lg:block overflow-hidden">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src={adminLoginVideo.url} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-br from-rich-black/80 via-rich-black/50 to-primary/30" />
        <div className="relative z-10 h-full flex flex-col justify-between p-12 text-ivory">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/90 flex items-center justify-center">
              <span className="font-serif text-2xl text-rich-black font-bold">K</span>
            </div>
            <span className="text-xs tracking-[0.4em] uppercase text-primary/90">KRT Jewellery</span>
          </div>

          <div className="space-y-5 max-w-md">
            <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-primary">
              <Sparkles className="w-3 h-3" /> Admin Console
            </span>
            <h1 className="font-serif text-4xl xl:text-5xl leading-tight">
              Crafting Heritage,<br />
              <span className="text-primary">One Ornament at a Time.</span>
            </h1>
            <p className="text-ivory/70 text-sm leading-relaxed">
              Manage products, orders, chit funds, and the entire luxury experience from a single place.
            </p>
          </div>

          <p className="text-xs text-ivory/50 tracking-wider">
            © {new Date().getFullYear()} KRT Jewellery — Secure Admin Access
          </p>
        </div>
      </div>

      {/* RIGHT: form */}
      <div className="flex items-center justify-center p-6 sm:p-12 bg-background">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-primary to-gold-shimmer flex items-center justify-center mb-4">
              <Shield className="w-8 h-8 text-primary-foreground" />
            </div>
            <h2 className="font-serif text-3xl">
              <span className="text-primary">KRT</span> Admin Panel
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
              Sign in to manage your jewellery store
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Admin Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@krtjewels.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input-luxury"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="input-luxury pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full btn-premium py-6" disabled={isLoading}>
              {isLoading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Signing in...</>
              ) : ('Sign In to Admin')}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-border text-center">
            <p className="text-xs text-muted-foreground">
              This is a secure admin area. Unauthorized access is prohibited.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
