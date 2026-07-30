import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from './supabase';

export interface Profile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  role: string;
  school_id: string | null;
  custom_role_id: string | null;
  sales_code: string | null;
  onboarding_completed: boolean;
}

export interface School {
  id: string;
  name: string;
  country: string | null;
  city: string | null;
  type: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  logo_url: string | null;
  trial_ends_at: string | null;
  subscription_status: string | null;
  plan_id: string | null;
}

interface AuthContextValue {
  user: any | null;
  profile: Profile | null;
  school: School | null;
  isSuperAdmin: boolean;
  subscriptionActive: boolean;
  planModules: string[] | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({} as AuthContextValue);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [school, setSchool] = useState<School | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [subscriptionActive, setSubscriptionActive] = useState(true);
  const [planModules, setPlanModules] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (u: any) => {
    if (!u) {
      setProfile(null); setSchool(null); setIsSuperAdmin(false);
      setSubscriptionActive(true); setPlanModules(null); return;
    }
    // Check super admin first
    const { data: sa } = await supabase.from('super_admin_emails').select('email').eq('email', u.email).maybeSingle();
    const superAdmin = !!sa;
    setIsSuperAdmin(superAdmin);
    if (superAdmin) {
      setProfile({ id: u.id, email: u.email, first_name: null, last_name: null, phone: null, role: 'super_admin', school_id: null, custom_role_id: null, sales_code: null, onboarding_completed: true });
      setSchool(null);
      setSubscriptionActive(true);
      setPlanModules(null);
      return;
    }
    const { data: prof } = await supabase.from('profiles').select('*').eq('id', u.id).maybeSingle();
    const p = prof as Profile | null;
    setProfile(p ? { ...p, email: u.email } : null);
    if (p?.school_id) {
      const { data: sch } = await supabase.from('schools').select('*').eq('id', p.school_id).maybeSingle();
      setSchool(sch as School | null);
      if (sch) {
        const { data: active } = await supabase.rpc('school_subscription_active', { school_id: sch.id });
        setSubscriptionActive(!!active);
        const { data: mods } = await supabase.rpc('school_plan_modules', { school_id: sch.id });
        setPlanModules(mods || null);
      }
    } else {
      setSchool(null);
    }
  };

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user).finally(() => { if (mounted) setLoading(false); });
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setUser(session?.user ?? null);
      // A session change (sign-in, sign-up, token refresh) must keep the app in a
      // loading state until the profile is (re)fetched — otherwise the router can
      // briefly render <Dashboard /> with profile still null, before onboarding
      // status is known, letting some accounts slip straight past onboarding.
      setLoading(true);
      if (session?.user) {
        loadProfile(session.user).finally(() => { if (mounted) setLoading(false); });
      } else {
        loadProfile(null).finally(() => { if (mounted) setLoading(false); });
      }
    });

    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null); setProfile(null); setSchool(null); setIsSuperAdmin(false);
  };

  const refresh = async () => { if (user) await loadProfile(user); };

  return (
    <AuthContext.Provider value={{ user, profile, school, isSuperAdmin, subscriptionActive, planModules, loading, signOut, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() { return useContext(AuthContext); }
