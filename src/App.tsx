import { AuthProvider, useAuth } from './lib/auth';
import { RouterProvider, useRoute } from './lib/router';
import { ToastProvider } from './lib/toast';
import { I18nProvider } from './lib/i18n';
import { ThemeProvider } from './lib/theme';
import { OfflineBanner } from './lib/useOffline';
import { useEffect } from 'react';
import { LandingPage } from './pages/Landing';
import { LoginPage } from './pages/LoginPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { Dashboard } from './pages/Dashboard';
import { SuperAdminApp } from './pages/SuperAdminApp';
import { AccessDenied } from './pages/AccessDenied';
import { ParentJoinPage } from './pages/ParentJoinPage';

function Router() {
  const { user, profile, isSuperAdmin, subscriptionActive, loading } = useAuth();
  const path = useRoute();

  useEffect(() => { window.scrollTo(0, 0); }, [path]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-400 text-sm">Chargement...</div>;

  if (!user) {
    if (path === '/login' || path === '/signup') return <LoginPage />;
    if (path === '/parent/rejoindre') return <LoginPage />;
    return <LandingPage />;
  }

  // Super Admin — full access, no restrictions
  if (isSuperAdmin) return <SuperAdminApp />;

  // Onboarding not completed → force onboarding
  if (profile && !profile.onboarding_completed && path !== '/onboarding') {
    window.history.replaceState({}, '', '/onboarding');
    window.dispatchEvent(new PopStateEvent('popstate'));
    return <OnboardingPage />;
  }
  if (path === '/onboarding') return <OnboardingPage />;

  // Logged-in user linking an additional child to their parent account
  if (path === '/parent/rejoindre') return <ParentJoinPage />;

  // Block non-super-admins from /super-admin URLs
  if (path.startsWith('/super-admin')) return <AccessDenied />;

  // Trial expired → paywall (super admins bypass)
  if (profile?.school_id && !subscriptionActive && path !== '/pricing') {
    return <Dashboard paywall />;
  }

  return <Dashboard />;
}

export function App() {
  return (
    <RouterProvider>
      <I18nProvider>
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>
              <OfflineBanner />
              <Router />
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </I18nProvider>
    </RouterProvider>
  );
}
