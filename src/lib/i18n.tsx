import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type Locale = 'fr' | 'en';

type Dict = Record<string, string>;

const fr: Dict = {
  'nav.features': 'Fonctionnalités',
  'nav.pricing': 'Tarifs',
  'nav.contact': 'Contact',
  'nav.login': 'Connexion',
  'nav.signup': 'Commencer',
  'nav.dashboard': 'Tableau de bord',
  'hero.badge': 'Plateforme panafricaine de gestion scolaire',
  'hero.title': 'Toute votre école, un seul système.',
  'hero.subtitle': 'KLASO connecte administrateurs, enseignants, parents et élèves dans une plateforme unique, pensée pour l\'Afrique et prête pour le monde.',
  'hero.cta.primary': 'Démarrer l\'essai gratuit',
  'hero.cta.secondary': 'Voir les tarifs',
  'hero.stat.schools': 'Écoles',
  'hero.stat.users': 'Utilisateurs',
  'hero.stat.uptime': 'Disponibilité',
  'roles.title': 'Un dashboard dédié pour chaque acteur',
  'roles.subtitle': 'Chaque utilisateur dispose d\'une interface adaptée à son rôle.',
  'roles.admin.title': 'Administration',
  'roles.admin.desc': 'Gérez votre établissement, votre équipe et vos finances.',
  'roles.teacher.title': 'Enseignants',
  'roles.teacher.desc': 'Notes, présences et emploi du temps en un clin d\'œil.',
  'roles.parent.title': 'Parents',
  'roles.parent.desc': 'Suivez la scolarité de vos enfants et payez en ligne.',
  'roles.student.title': 'Élèves',
  'roles.student.desc': 'Vos notes, devoirs et emploi du temps, partout.',
  'features.title': 'Tout ce dont votre établissement a besoin',
  'features.subtitle': 'Des modules complets, connectés et sécurisés.',
  'pricing.title': 'Des forfaits clairs pour chaque taille d\'établissement',
  'pricing.subtitle': '7 jours d\'essai gratuit. Sans engagement. Annulez quand vous voulez.',
  'pricing.monthly': 'Mensuel',
  'pricing.annual': 'Annuel',
  'pricing.save': 'Économisez 20%',
  'pricing.permonth': '/mois',
  'pricing.peryear': '/an',
  'pricing.cta': 'Choisir',
  'pricing.cta.trial': 'Démarrer l\'essai',
  'pricing.compare': 'Comparer les forfaits',
  'pricing.feature': 'Fonctionnalité',
  'footer.rights': 'Tous droits réservés.',
  'footer.privacy': 'Politique de confidentialité',
  'footer.terms': 'Conditions d\'utilisation',
  'footer.cookies': 'Gérer mes cookies',
  'footer.contact': 'Contact',
  'cookies.text': 'Nous utilisons des cookies pour améliorer votre expérience et analyser le trafic.',
  'cookies.accept': 'Accepter tout',
  'cookies.reject': 'Refuser',
  'cookies.customize': 'Personnaliser',
  'cookies.necessary': 'Nécessaires',
  'cookies.analytics': 'Analytiques',
  'cookies.marketing': 'Marketing',
  'auth.login.title': 'Connexion à KLASO',
  'auth.login.subtitle': 'Bienvenue. Connectez-vous pour accéder à votre espace.',
  'auth.signup.title': 'Créer votre compte',
  'auth.signup.subtitle': 'Démarrez votre essai gratuit de 7 jours.',
  'auth.email': 'Adresse email',
  'auth.password': 'Mot de passe',
  'auth.firstname': 'Prénom',
  'auth.lastname': 'Nom',
  'auth.login.submit': 'Se connecter',
  'auth.signup.submit': 'Créer mon compte',
  'auth.noaccount': 'Pas encore de compte ?',
  'auth.haveaccount': 'Déjà inscrit ?',
  'auth.error.invalid': 'Email ou mot de passe invalide.',
  'auth.error.exists': 'Un compte existe déjà avec cet email.',
  'auth.error.generic': 'Une erreur est survenue. Réessayez.',
  'onboarding.title': 'Configurez votre établissement',
  'onboarding.step': 'Étape',
  'onboarding.of': 'sur',
  'onboarding.school.name': 'Nom de l\'établissement',
  'onboarding.school.legal': 'Nom légal',
  'onboarding.school.type': 'Type d\'établissement',
  'onboarding.country': 'Pays',
  'onboarding.region': 'Région / Province',
  'onboarding.city': 'Ville',
  'onboarding.currency': 'Devise',
  'onboarding.currency.locked': 'La devise est verrouillée après cette étape.',
  'onboarding.plan': 'Choisissez votre forfait',
  'onboarding.promo': 'Code commercial (optionnel)',
  'onboarding.promo.hint': 'Laissez vide si vous n\'en avez pas.',
  'onboarding.documents': 'Documents de vérification',
  'onboarding.documents.hint': 'Téléversez l\'autorisation d\'ouverture ou le registre de commerce.',
  'onboarding.submit': 'Finaliser l\'inscription',
  'onboarding.next': 'Continuer',
  'onboarding.back': 'Retour',
  'dashboard.welcome': 'Bienvenue',
  'common.loading': 'Chargement...',
  'common.save': 'Enregistrer',
  'common.cancel': 'Annuler',
  'common.delete': 'Supprimer',
  'common.edit': 'Modifier',
  'common.search': 'Rechercher',
  'common.logout': 'Déconnexion',
  'common.settings': 'Paramètres',
};

const en: Dict = {
  'nav.features': 'Features',
  'nav.pricing': 'Pricing',
  'nav.contact': 'Contact',
  'nav.login': 'Sign in',
  'nav.signup': 'Get started',
  'nav.dashboard': 'Dashboard',
  'hero.badge': 'Pan-African school management platform',
  'hero.title': 'Your entire school, one system.',
  'hero.subtitle': 'KLASO connects administrators, teachers, parents and students in a single platform built for Africa and ready for the world.',
  'hero.cta.primary': 'Start free trial',
  'hero.cta.secondary': 'See pricing',
  'hero.stat.schools': 'Schools',
  'hero.stat.users': 'Users',
  'hero.stat.uptime': 'Uptime',
  'roles.title': 'A dedicated dashboard for every role',
  'roles.subtitle': 'Each user gets an interface tailored to their role.',
  'roles.admin.title': 'Administration',
  'roles.admin.desc': 'Manage your school, team and finances.',
  'roles.teacher.title': 'Teachers',
  'roles.teacher.desc': 'Grades, attendance and schedule in a glance.',
  'roles.parent.title': 'Parents',
  'roles.parent.desc': 'Track your children\'s schooling and pay online.',
  'roles.student.title': 'Students',
  'roles.student.desc': 'Your grades, homework and schedule, anywhere.',
  'features.title': 'Everything your school needs',
  'features.subtitle': 'Complete, connected and secure modules.',
  'pricing.title': 'Clear plans for every school size',
  'pricing.subtitle': '7-day free trial. No commitment. Cancel anytime.',
  'pricing.monthly': 'Monthly',
  'pricing.annual': 'Annual',
  'pricing.save': 'Save 20%',
  'pricing.permonth': '/mo',
  'pricing.peryear': '/yr',
  'pricing.cta': 'Choose',
  'pricing.cta.trial': 'Start trial',
  'pricing.compare': 'Compare plans',
  'pricing.feature': 'Feature',
  'footer.rights': 'All rights reserved.',
  'footer.privacy': 'Privacy Policy',
  'footer.terms': 'Terms of Service',
  'footer.cookies': 'Manage cookies',
  'footer.contact': 'Contact',
  'cookies.text': 'We use cookies to improve your experience and analyze traffic.',
  'cookies.accept': 'Accept all',
  'cookies.reject': 'Reject',
  'cookies.customize': 'Customize',
  'cookies.necessary': 'Necessary',
  'cookies.analytics': 'Analytics',
  'cookies.marketing': 'Marketing',
  'auth.login.title': 'Sign in to KLASO',
  'auth.login.subtitle': 'Welcome back. Sign in to access your space.',
  'auth.signup.title': 'Create your account',
  'auth.signup.subtitle': 'Start your 7-day free trial.',
  'auth.email': 'Email address',
  'auth.password': 'Password',
  'auth.firstname': 'First name',
  'auth.lastname': 'Last name',
  'auth.login.submit': 'Sign in',
  'auth.signup.submit': 'Create account',
  'auth.noaccount': 'No account yet?',
  'auth.haveaccount': 'Already registered?',
  'auth.error.invalid': 'Invalid email or password.',
  'auth.error.exists': 'An account already exists with this email.',
  'auth.error.generic': 'An error occurred. Try again.',
  'onboarding.title': 'Set up your school',
  'onboarding.step': 'Step',
  'onboarding.of': 'of',
  'onboarding.school.name': 'School name',
  'onboarding.school.legal': 'Legal name',
  'onboarding.school.type': 'School type',
  'onboarding.country': 'Country',
  'onboarding.region': 'Region / Province',
  'onboarding.city': 'City',
  'onboarding.currency': 'Currency',
  'onboarding.currency.locked': 'Currency is locked after this step.',
  'onboarding.plan': 'Choose your plan',
  'onboarding.promo': 'Promo code (optional)',
  'onboarding.promo.hint': 'Leave empty if you don\'t have one.',
  'onboarding.documents': 'Verification documents',
  'onboarding.documents.hint': 'Upload your opening authorization or trade register.',
  'onboarding.submit': 'Finish signup',
  'onboarding.next': 'Continue',
  'onboarding.back': 'Back',
  'dashboard.welcome': 'Welcome',
  'common.loading': 'Loading...',
  'common.save': 'Save',
  'common.cancel': 'Cancel',
  'common.delete': 'Delete',
  'common.edit': 'Edit',
  'common.search': 'Search',
  'common.logout': 'Sign out',
  'common.settings': 'Settings',
};

const dictionaries: Record<Locale, Dict> = { fr, en };

interface I18nContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('skul_locale') : null;
    return (stored as Locale) || 'fr';
  });

  useEffect(() => {
    localStorage.setItem('skul_locale', locale);
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = (l: Locale) => setLocaleState(l);
  const t = (key: string) => dictionaries[locale][key] ?? key;

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
