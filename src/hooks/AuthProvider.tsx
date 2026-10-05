import { createContext, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  authReady: boolean;
  isAdmin: boolean;
  isAuthenticated: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<unknown>;
  signIn: (email: string, password: string) => Promise<{ isAdmin: boolean } & Record<string, unknown>>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

// Admin status cache (only successful lookups are cached).
const adminCache = new Map<string, boolean>();

async function fetchAdminStatus(userId: string): Promise<boolean | null> {
  const cached = adminCache.get(userId);
  if (cached !== undefined) return cached;
  for (let attempt = 0; attempt < 3; attempt++) {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();
    if (!error) {
      const value = !!data;
      adminCache.set(userId, value);
      return value;
    }
    await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
  }
  return null; // unknown (network problem) — caller keeps previous value
}

const friendlyError = (error: unknown) => {
  const message = error instanceof Error ? error.message : 'An error occurred';
  if (/failed to fetch|network|load failed/i.test(message)) {
    return 'Connection problem. Please check your internet and try again.';
  }
  return message;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();
  const seq = useRef(0);
  const currentUserId = useRef<string | null>(null);
  const isAdminRef = useRef(false);

  useEffect(() => {
    let mounted = true;

    // Resolve session + admin status together so consumers never see a
    // signed-in user with a stale "not admin" flag (caused admin bounce/blank).
    const applySession = async (next: Session | null) => {
      const mySeq = ++seq.current;
      const nextUser = next?.user ?? null;
      let nextAdmin = false;
      if (nextUser) {
        if (nextUser.id === currentUserId.current && adminCache.has(nextUser.id)) {
          nextAdmin = adminCache.get(nextUser.id)!;
        } else {
          const status = await fetchAdminStatus(nextUser.id);
          nextAdmin = status ?? (nextUser.id === currentUserId.current ? isAdminRef.current : false);
        }
      } else {
        adminCache.clear();
      }
      if (!mounted || mySeq !== seq.current) return;
      currentUserId.current = nextUser?.id ?? null;
      isAdminRef.current = nextAdmin;
      setSession(next);
      setUser(nextUser);
      setIsAdmin(nextAdmin);
      setLoading(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, next) => {
      // Callback must stay synchronous; defer async work.
      setTimeout(() => void applySession(next), 0);
    });

    supabase.auth.getSession()
      .then(({ data }) => applySession(data.session))
      .catch(() => { if (mounted) setLoading(false); });

    // Never leave the app on an endless spinner if the network is slow.
    const failSafe = setTimeout(() => { if (mounted) setLoading(false); }, 8000);

    return () => {
      mounted = false;
      clearTimeout(failSafe);
      subscription.unsubscribe();
    };
  }, []);

  const signUp = useCallback(async (email: string, password: string, fullName: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin, data: { full_name: fullName } },
      });
      if (error) throw error;
      toast({ title: 'Account created!', description: 'Welcome to our jewellery collection.' });
      return data;
    } catch (error) {
      toast({ title: 'Account creation failed', description: friendlyError(error), variant: 'destructive' });
      throw error;
    }
  }, [toast]);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      const status = await fetchAdminStatus(data.user.id);
      const admin = !!status;
      toast({
        title: admin ? 'Welcome Admin!' : 'Welcome back!',
        description: admin ? 'Redirecting to dashboard...' : 'You have been signed in successfully.',
      });
      return { ...data, isAdmin: admin };
    } catch (error) {
      toast({ title: 'Sign in failed', description: friendlyError(error), variant: 'destructive' });
      throw error;
    }
  }, [toast]);

  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error && error.message !== 'Auth session missing!') throw error;
      adminCache.clear();
      toast({ title: 'Signed out', description: 'You have been signed out successfully.' });
      navigate('/');
    } catch (error) {
      toast({ title: 'Sign out failed', description: friendlyError(error), variant: 'destructive' });
    }
  }, [navigate, toast]);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    session,
    loading,
    authReady: !loading,
    isAdmin,
    isAuthenticated: !!user,
    signUp,
    signIn: signIn as AuthContextValue['signIn'],
    signOut,
  }), [user, session, loading, isAdmin, signUp, signIn, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
