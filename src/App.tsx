import { AuthProvider, useAuth } from './lib/auth';
import { RouterProvider, useRoute, navigate } from './lib/router';
import { useEffect } from 'react';
import { LandingPage } from './pages/Landing';
import { LoginPage } from './pages/LoginPage';
import { Dashboard } from './pages/Dashboard';
import { SuperAdminApp } from './pages/SuperAdminApp';
import { AccessDenied } from './pages/AccessDenied';

function Router() {
  const { user, school, isSuperAdmin, subscriptionActive, loading } = useAuth();
  const path = useRoute();

  useEffect(() => { window.scrollTo(0, 0); }, [path]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-400 text-sm">Chargement...</div>;

  if (!user) {
    if (path === '/login' || path === '/signup') return <LoginPage />;
    if (path === '/parent/rejoindre') return <LoginPage />;
    return <LandingPage />;
  }

  // Super Admin routing — backend-verified via super_admin_emails table
  if (isSuperAdmin) {
    if (path.startsWith('/super-admin') || path === '/dashboard' || path === '/') return <SuperAdminApp />;
    return <SuperAdminApp />;
  }

  // Block non-super-admins from /super-admin URLs
  if (path.startsWith('/super-admin')) return <AccessDenied />;

  // Trial expired → paywall (super admins bypass)
  if (school && !subscriptionActive && path !== '/pricing') return <Dashboard paywall />;

  return <Dashboard />;
}

export function App() {
  return (
    <RouterProvider>
      <AuthProvider>
        <Router />
      </AuthProvider>
    </RouterProvider>
  );
}
