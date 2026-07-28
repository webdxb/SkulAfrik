import { Logo } from '../components/Logo';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { Footer, CookieBanner } from '../components/Footer';
import { Link } from '../lib/router';
import { useI18n } from '../lib/i18n';
import { useState } from 'react';
import { Building2, BookOpen, User, GraduationCap, GraduationCap as GradIcon, MessageSquare, Wallet, Bus, ShieldCheck, ArrowRight } from 'lucide-react';

const COUNTRIES = [
  { name: "Côte d'Ivoire", flag: '🇨🇮' }, { name: 'Sénégal', flag: '🇸🇳' }, { name: 'Cameroun', flag: '🇨🇲' },
  { name: 'Maroc', flag: '🇲🇦' }, { name: 'Nigeria', flag: '🇳🇬' }, { name: 'Ghana', flag: '🇬🇭' },
  { name: 'Kenya', flag: '🇰🇪' }, { name: 'RDC', flag: '🇨🇩' }, { name: 'Tunisie', flag: '🇹🇳' },
  { name: 'Afrique du Sud', flag: '🇿🇦' }, { name: 'Bénin', flag: '🇧🇯' }, { name: 'Mali', flag: '🇲🇱' },
];

const FEATURE_ICONS = [GradIcon, BookOpen, MessageSquare, Wallet, Bus, ShieldCheck];

export function LandingPage() {
  const { t } = useI18n();
  const [cookieBannerKey, setCookieBannerKey] = useState(0);
  const manageCookies = () => {
    localStorage.removeItem('klaso_cookie_choice');
    setCookieBannerKey((k) => k + 1);
  };
  const features = [1, 2, 3, 4, 5, 6].map((n) => ({
    icon: FEATURE_ICONS[n - 1],
    title: t(`features.f${n}.title`),
    desc: t(`features.f${n}.desc`),
  }));

  const roles = [
    { key: 'admin', icon: Building2, accent: 'bg-[#003087]' },
    { key: 'teacher', icon: BookOpen, accent: 'bg-[#0079C1]' },
    { key: 'parent', icon: User, accent: 'bg-[#009CDE]' },
    { key: 'student', icon: GraduationCap, accent: 'bg-[#00457C]' },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/90 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 flex items-center justify-between h-16">
          <Link to="/"><Logo height={40} /></Link>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-slate-600 hover:text-slate-900">{t('nav.features')}</a>
            <a href="#roles" className="text-sm font-medium text-slate-600 hover:text-slate-900">{t('roles.title')}</a>
            <a href="#pricing" className="text-sm font-medium text-slate-600 hover:text-slate-900">{t('nav.pricing')}</a>
          </nav>
          <div className="flex items-center gap-3">
            <LanguageSwitcher compact />
            <Link to="/login" className="hidden sm:block text-sm font-medium text-slate-600 hover:text-slate-900">{t('nav.login')}</Link>
            <Link to="/signup" className="rounded-lg bg-[#003087] px-4 py-2 text-sm font-semibold text-white hover:bg-[#00457C] transition-colors">{t('nav.signup')}</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-[#F7F9FC]">
        <div className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-[#009CDE]/10 blur-3xl" />
        <div className="pointer-events-none absolute top-40 -left-24 h-72 w-72 rounded-full bg-[#003087]/5 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 pt-16 pb-20 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#009CDE]/30 bg-[#009CDE]/10 px-4 py-1.5 text-xs font-semibold text-[#00457C]">
              {t('hero.badge')}
            </div>
            <h1 className="mt-6 font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 leading-[1.05] tracking-tight">
              {t('hero.title')}
            </h1>
            <p className="mt-6 text-lg text-slate-600 max-w-xl">
              {t('hero.subtitle')}
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Link to="/signup" className="inline-flex items-center gap-2 rounded-xl bg-[#003087] px-6 py-3.5 text-sm font-semibold text-white hover:bg-[#00457C] shadow-lg shadow-[#003087]/20 transition-colors">
                {t('hero.cta.primary')} <ArrowRight size={16} />
              </Link>
              <a href="#pricing" className="rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">{t('hero.cta.secondary')}</a>
            </div>
            <p className="mt-6 text-xs font-medium uppercase tracking-wide text-slate-400">{t('trust.line')}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {COUNTRIES.map((c) => (
                <span key={c.name} className="inline-flex items-center gap-1.5 rounded-full bg-white border border-slate-100 px-2.5 py-1 text-xs text-slate-600 shadow-sm">
                  <span>{c.flag}</span>{c.name}
                </span>
              ))}
            </div>
          </div>

          {/* Product preview mockup */}
          <div className="relative">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10 overflow-hidden">
              <div className="flex items-center gap-1.5 border-b border-slate-100 px-4 py-3">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-300" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
                <span className="ml-3 text-xs text-slate-400 font-mono">klaso.com/dashboard</span>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Élèves', value: '1 248' },
                    { label: 'Présence', value: '96%' },
                    { label: 'Moyenne', value: '14.2/20' },
                  ].map((s) => (
                    <div key={s.label} className="rounded-xl bg-[#F7F9FC] p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{s.label}</p>
                      <p className="mt-1 font-heading text-xl font-bold text-slate-900">{s.value}</p>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl border border-slate-100 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-slate-700">Bulletin — Trimestre 2</p>
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">Publié</span>
                  </div>
                  {['Mathématiques', 'Français', 'Sciences'].map((subj, i) => (
                    <div key={subj} className="flex items-center justify-between py-1.5 text-sm">
                      <span className="text-slate-500">{subj}</span>
                      <span className="font-mono font-semibold text-slate-800">{[16, 13.5, 15][i]}/20</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Roles */}
      <section id="roles" className="mx-auto max-w-7xl px-4 sm:px-6 py-20">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-slate-900">{t('roles.title')}</h2>
          <p className="mt-3 text-slate-500">{t('roles.subtitle')}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {roles.map((r) => (
            <div key={r.key} className="rounded-2xl border border-slate-100 p-6 hover:shadow-xl hover:shadow-slate-900/5 transition-shadow">
              <div className={`h-11 w-11 rounded-xl ${r.accent} flex items-center justify-center`}>
                <r.icon size={20} className="text-white" />
              </div>
              <h3 className="mt-4 font-heading text-base font-bold text-slate-900">{t(`roles.${r.key}.title`)}</h3>
              <p className="mt-1.5 text-sm text-slate-500">{t(`roles.${r.key}.desc`)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-[#F7F9FC] py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-slate-900">{t('features.title')}</h2>
            <p className="mt-3 text-slate-500">{t('features.subtitle')}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="rounded-2xl bg-white border border-slate-100 p-6 hover:shadow-lg transition-shadow">
                <div className="h-10 w-10 rounded-lg bg-[#009CDE]/10 flex items-center justify-center">
                  <f.icon size={18} className="text-[#00457C]" />
                </div>
                <h3 className="mt-4 font-heading text-base font-bold text-slate-900">{f.title}</h3>
                <p className="mt-2 text-sm text-slate-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section id="pricing" className="bg-[#003087] py-20">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-white">{t('cta.final.title')}</h2>
          <p className="mt-4 text-[#B8D4F0]">{t('cta.final.subtitle')}</p>
          <Link to="/signup" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[#009CDE] px-6 py-3.5 text-sm font-semibold text-white hover:bg-[#0079C1] transition-colors">
            {t('cta.final.button')} <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <Footer onManageCookies={manageCookies} />
      <CookieBanner key={cookieBannerKey} onManageCookies={manageCookies} />
    </div>
  );
}
