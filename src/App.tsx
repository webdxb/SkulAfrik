import { AuthProvider, useAuth } from './lib/auth';
import { RouterProvider, useRoute, navigate } from './lib/router';
import { useEffect } from 'react';
import { LandingPage } from './pages/Landing';
import { LoginPage } from './pages/LoginPage';
import { Dashboard } from './pages/Dashboard';

function Router() {
  const { user, school, isSuperAdmin, subscriptionActive, loading } = useAuth();
  const path = useRoute();

  useEffect(() => { window.scrollTo(0, 0); }, [path]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-400 text-sm">Chargement...</div>;

  if (!user) {
    if (path === '/login' || path === '/signup') return <LoginPage />;
    return <LandingPage />;
  }

  // Trial expired → paywall
  if (school && !subscriptionActive && !isSuperAdmin && path !== '/pricing') return <Dashboard paywall />;

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
