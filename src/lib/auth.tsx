import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from './supabase';

export type Role = 'super_admin' | 'admin' | 'teacher' | 'staff' | 'parent' | 'student';

export interface Profile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: Role;
  school_id: string | null;
  phone?: string | null;
}

export interface School {
  id: string;
  name: string;
  legal_name: string | null;
  country: string;
  region: string | null;
  city: string | null;
  currency: string;
  language: string;
  verification_status: string;
  subscription_status: string;
  trial_ends_at: string;
  plan_id: string | null;
  director_name: string | null;
  director_email: string | null;
  phone: string | null;
  address: string | null;
}

interface AuthState {
  user: any | null;
  profile: Profile | null;
  school: School | null;
  isSuperAdmin: boolean;
  subscriptionActive: boolean;
  planModules: string[] | null;
  loading: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({} as AuthState);

function normalizeRole(dbRole: string): Role {
  const map: Record<string, Role> = {
    'super_admin': 'super_admin',
    'school_admin': 'admin',
    'admin': 'admin',
    'teacher': 'teacher',
    'staff': 'staff',
    'parent': 'parent',
    'student': 'student',
  };
  return map[dbRole] || 'admin';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [school, setSchool] = useState<School | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [subscriptionActive, setSubscriptionActive] = useState(true);
  const [planModules, setPlanModules] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (u: any) => {
    if (!u) { setProfile(null); setSchool(null); setIsSuperAdmin(false); setSubscriptionActive(true); setPlanModules(null); return; }
    // Check super admin first — before any school/subscription logic
    const { data: sa } = await supabase.from('super_admin_emails').select('email').eq('email', u.email).maybeSingle();
    const superAdmin = !!sa;
    setIsSuperAdmin(superAdmin);
    // Super admins have full access, no restrictions
    if (superAdmin) {
      setProfile({ id: u.id, email: u.email, first_name: null, last_name: null, role: 'super_admin', school_id: null, phone: null });
      setSchool(null);
      setSubscriptionActive(true);
      setPlanModules(null);
      return;
    }
    const { data: prof } = await supabase.from('profiles').select('*').eq('id', u.id).maybeSingle();
    const normalizedProf = prof ? { ...prof, role: normalizeRole(prof.role), email: u.email } : null;
    setProfile(normalizedProf as Profile | null);
    let schoolData: School | null = null;
    if (normalizedProf?.school_id) {
      const { data: sch } = await supabase.from('schools').select('*').eq('id', normalizedProf.school_id).maybeSingle();
      schoolData = sch as School | null;
      setSchool(schoolData);
      if (schoolData) {
        const { data: active } = await supabase.rpc('school_subscription_active', { school_id: schoolData.id });
        setSubscriptionActive(!!active);
        const { data: mods } = await supabase.rpc('school_plan_modules', { school_id: schoolData.id });
        setPlanModules(mods || null);
      }
    } else {
      setSchool(null);
    }
  };

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) { setUser(session.user); await loadProfile(session.user); }
      setLoading(false);
    })();
    const { data: sub } = supabase.auth.onAuthStateChange(async (_e, session) => {
      if (session?.user) { setUser(session.user); await loadProfile(session.user); }
      else { setUser(null); await loadProfile(null); }
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const refresh = async () => { if (user) await loadProfile(user); };
  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null); setProfile(null); setSchool(null); setIsSuperAdmin(false);
    setSubscriptionActive(true); setPlanModules(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, school, isSuperAdmin, subscriptionActive, planModules, loading, refresh, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() { return useContext(AuthContext); }
