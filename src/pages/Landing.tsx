import { Link } from '../lib/router';
import { Logo } from '../components/Logo';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { ThemeToggle } from '../components/ThemeToggle';
import { Users, BookOpen, Calendar, Wallet, BarChart3, Bus, Library, ShieldCheck, Check, ChevronRight, GraduationCap } from 'lucide-react';

export function LandingPage() {
  const features = [
    { icon: Users, title: 'Gestion des élèves', desc: 'Fiches, inscriptions, import CSV en masse', color: 'bg-indigo-50 text-indigo-600' },
    { icon: BookOpen, title: 'Notes & bulletins', desc: 'Saisie, coefficients, moyennes, classement', color: 'bg-emerald-50 text-emerald-600' },
    { icon: Calendar, title: 'Présences', desc: 'Prise de présence par classe, alertes absences', color: 'bg-amber-50 text-amber-600' },
    { icon: Wallet, title: 'Finances & paiements', desc: 'Frais scolaires, Mobile Money, reçus PDF', color: 'bg-rose-50 text-rose-600' },
    { icon: Calendar, title: 'Calendrier', desc: 'Cours, examens, réunions, vacances', color: 'bg-sky-50 text-sky-600' },
    { icon: BarChart3, title: 'Rapports', desc: 'Exports PDF/CSV, filtrables par période', color: 'bg-teal-50 text-teal-600' },
    { icon: Bus, title: 'Transport', desc: 'Trajets, véhicules, affectation élèves', color: 'bg-orange-50 text-orange-600' },
    { icon: Library, title: 'Bibliothèque', desc: 'Catalogue, emprunts/retours, retards', color: 'bg-cyan-50 text-cyan-600' },
  ];

  const roles = [
    { icon: ShieldCheck, title: 'Admin d\'établissement', desc: 'Pilotage complet de l\'école', color: 'border-l-indigo-500' },
    { icon: BookOpen, title: 'Enseignant', desc: 'Notes, présences, bulletins', color: 'border-l-emerald-500' },
    { icon: Users, title: 'Parent', desc: 'Suivi scolarité, paiements, portail', color: 'border-l-amber-500' },
    { icon: GraduationCap, title: 'Élève', desc: 'Notes, devoirs, emploi du temps', color: 'border-l-rose-500' },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur border-b border-slate-100 dark:border-slate-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/"><Logo height={36} /></Link>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
            <a href="#features" className="hover:text-slate-900 dark:hover:text-slate-100">Fonctionnalités</a>
            <a href="#roles" className="hover:text-slate-900 dark:hover:text-slate-100">Rôles</a>
            <a href="#pricing" className="hover:text-slate-900 dark:hover:text-slate-100">Tarifs</a>
          </nav>
          <div className="flex items-center gap-2">
            <LanguageSwitcher compact />
            <ThemeToggle />
            <Link to="/login" className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800">Connexion</Link>
            <Link to="/login" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">Démarrer</Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden bg-gradient-to-b from-indigo-50/50 via-white to-white dark:from-indigo-950/20 dark:via-slate-950 dark:to-slate-950">
        <div className="absolute inset-0 bg-[radial-gradient(40%_50%_at_50%_0%,rgba(79,70,229,0.08),transparent)]" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 pb-20 sm:pt-24 sm:pb-28">
          <div className="text-center max-w-3xl mx-auto">
            <span className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-4 py-1.5 text-xs font-medium text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950 dark:text-indigo-300">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
              Conçu pour les écoles africaines
            </span>
            <h1 className="mt-6 font-heading text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 dark:text-slate-100 leading-[1.1]">
              La gestion scolaire, enfin simple.
            </h1>
            <p className="mt-6 text-lg text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl mx-auto">
              Élèves, notes, présences, finances, transport, bibliothèque — tout est connecté. Francophone et anglophone, du primaire au lycée technique.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to="/login" className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors">
                Créer mon établissement <ChevronRight size={16} />
              </Link>
              <a href="#features" className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
                Voir les fonctionnalités
              </a>
            </div>
            <div className="mt-12 flex items-center justify-center gap-8 sm:gap-12">
              {[{ value: '500+', label: 'Écoles' }, { value: '2M+', label: 'Utilisateurs' }, { value: '99.9%', label: 'Disponibilité' }].map((s) => (
                <div key={s.label} className="text-center">
                  <div className="font-heading text-2xl sm:text-3xl font-bold text-slate-900">{s.value}</div>
                  <div className="text-xs text-slate-500 uppercase tracking-wider mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-slate-50/50" id="roles">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-slate-900">Un portail pour chaque rôle</h2>
            <p className="mt-3 text-slate-600">Chaque utilisateur accède à un espace adapté à son rôle.</p>
          </div>
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {roles.map((r) => (
              <div key={r.title} className={`bg-white rounded-xl border-l-4 ${r.color} border-y border-r border-slate-100 p-6 shadow-sm hover:shadow-md transition-shadow`}>
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-slate-50"><r.icon className="text-slate-700" size={22} /></div>
                <h3 className="mt-4 font-heading text-lg font-semibold text-slate-900">{r.title}</h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 dark:bg-slate-950" id="features">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-slate-900 dark:text-slate-100">Tout ce dont votre école a besoin</h2>
            <p className="mt-3 text-slate-600 dark:text-slate-400">Une plateforme complète, modulaire et connectée.</p>
          </div>
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => (
              <div key={f.title} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 p-6 hover:border-indigo-200 dark:hover:border-indigo-800 hover:shadow-sm transition-all">
                <div className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${f.color}`}><f.icon size={20} /></div>
                <h3 className="mt-4 font-heading font-semibold text-slate-900 dark:text-slate-100">{f.title}</h3>
                <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-slate-50/50 dark:bg-slate-900/50" id="pricing">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-slate-900 dark:text-slate-100">Des tarifs adaptés à l'Afrique</h2>
            <p className="mt-3 text-slate-600 dark:text-slate-400">Essai gratuit 7 jours. Sans carte bancaire.</p>
          </div>
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-4xl mx-auto">
            {[
              { name: 'Starter', price: '$19', unit: '/mois', features: ['Jusqu\'à 200 élèves', 'Notes & présences', '1 établissement'], popular: false },
              { name: 'Premium', price: '$59', unit: '/mois', features: ['Élèves illimités', 'Tous les modules', 'Support prioritaire', 'Multi-rôles'], popular: true },
              { name: 'Entreprise', price: '$169', unit: '/mois', features: ['Multi-établissements', 'API & intégrations', 'SLA dédié', 'Onboarding personnalisé'], popular: false },
            ].map((p) => (
              <div key={p.name} className={`relative bg-white rounded-xl border p-6 shadow-sm ${p.popular ? 'border-indigo-300 ring-1 ring-indigo-200' : 'border-slate-200'}`}>
                {p.popular && <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-3 py-0.5 text-xs font-semibold text-white">Populaire</span>}
                <h3 className="font-heading text-xl font-bold text-slate-900">{p.name}</h3>
                <div className="mt-3 flex items-baseline gap-1"><span className="font-heading text-3xl font-bold text-slate-900">{p.price}</span><span className="text-sm text-slate-500">{p.unit}</span></div>
                <ul className="mt-5 space-y-2.5">{p.features.map((f) => (<li key={f} className="flex items-start gap-2 text-sm text-slate-600"><Check size={16} className="text-emerald-500 mt-0.5 flex-shrink-0" /><span>{f}</span></li>))}</ul>
                <Link to="/login" className={`mt-6 block text-center text-sm font-semibold rounded-lg px-4 py-2.5 transition-colors ${p.popular ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'border border-slate-200 text-slate-700 hover:bg-slate-50'}`}>Démarrer</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-br from-indigo-600 to-indigo-800">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-white">Prêt à transformer votre école ?</h2>
          <p className="mt-3 text-indigo-100">Démarrez en quelques minutes. Aucune carte requise.</p>
          <div className="mt-8 flex justify-center">
            <Link to="/login" className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 transition-colors">
              Créer mon établissement <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-100 dark:border-slate-800 py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo height={32} />
          <p className="text-sm text-slate-500 dark:text-slate-400">© {new Date().getFullYear()} SKUL AFRIK. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
}
