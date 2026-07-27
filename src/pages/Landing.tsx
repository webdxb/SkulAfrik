import { Logo } from '../components/Logo';
import { Link } from '../lib/router';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 flex items-center justify-between h-16">
          <Link to="/"><Logo height={44} /></Link>
          <nav className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900">Connexion</Link>
            <Link to="/signup" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">Commencer</Link>
          </nav>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-50 via-white to-white" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 pt-20 pb-24 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-xs font-medium text-emerald-700">
            La plateforme scolaire panafricaine
          </div>
          <h1 className="mt-6 font-heading text-4xl sm:text-6xl font-bold text-slate-900 leading-tight">
            Gérez votre école<br />avec <span className="text-emerald-600">simplicité</span>
          </h1>
          <p className="mt-6 text-lg text-slate-600 max-w-2xl mx-auto">
            Klaso centralise élèves, notes, présences, finances et communications dans une plateforme unique, sécurisée et adaptée aux établissements africains.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link to="/signup" className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700 shadow-lg shadow-indigo-600/20">Démarrer l'essai gratuit</Link>
            <Link to="/login" className="rounded-xl border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">Se connecter</Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: '🎓', title: 'Gestion des élèves', desc: 'Inscriptions, dossiers, bulletins, présences — tout au même endroit.' },
            { icon: '📊', title: 'Notes & bulletins', desc: 'Saisie des notes, calcul automatiques des moyennes et génération de bulletins.' },
            { icon: '💬', title: 'Communication', desc: 'Messagerie entre enseignants, parents et administration en temps réel.' },
            { icon: '💰', title: 'Finances & paie', desc: 'Suivi des frais de scolarité, paie du personnel et comptabilité.' },
            { icon: '🚌', title: 'Transport & bibliothèque', desc: 'Gestion des itinéraires de transport et du catalogue de la bibliothèque.' },
            { icon: '🔒', title: 'Isolation par établissement', desc: 'Chaque école est cloisonnée. Vos données ne sont visibles que par vous.' },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl border border-slate-100 p-6 hover:shadow-lg transition-shadow">
              <div className="text-3xl">{f.icon}</div>
              <h3 className="mt-4 font-heading text-lg font-bold text-slate-900">{f.title}</h3>
              <p className="mt-2 text-sm text-slate-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-slate-900 py-20">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="font-heading text-3xl font-bold text-white">Prêt à digitaliser votre établissement ?</h2>
          <p className="mt-4 text-slate-400">Essai gratuit de 7 jours. Aucune carte requise.</p>
          <Link to="/signup" className="mt-8 inline-block rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-700">Créer mon compte</Link>
        </div>
      </section>

      <footer className="border-t border-slate-100 py-8">
        <div className="mx-auto max-w-7xl px-4 flex items-center justify-between">
          <Logo height={36} />
          <p className="text-sm text-slate-400">© 2026 Klaso. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
}
