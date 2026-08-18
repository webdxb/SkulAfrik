import { Logo } from '../components/Logo';
import { Footer } from '../components/Footer';
import { Link } from '../lib/router';
import { ArrowLeft } from 'lucide-react';

const LAST_UPDATED = '30 juillet 2026';

export function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-slate-100">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/"><Logo height={36} /></Link>
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900">
            <ArrowLeft size={15} /> Retour
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 sm:px-6 py-14">
        <h1 className="font-heading text-3xl font-bold text-slate-900">Conditions d'utilisation</h1>
        <p className="mt-2 text-sm text-slate-400">Dernière mise à jour : {LAST_UPDATED}</p>

        <div className="mt-10 space-y-10 text-sm leading-relaxed text-slate-600">
          <section>
            <h2 className="font-heading text-lg font-bold text-slate-900 mb-3">1. Acceptation des conditions</h2>
            <p>
              En créant un compte ou en utilisant KLASOO, vous acceptez les présentes Conditions d'utilisation. KLASOO est édité et exploité par
              <strong> LiAfrik</strong>, société ayant des bureaux à Yaoundé (Cameroun) et Dubaï (Émirats arabes unis). Si vous utilisez KLASOO au
              nom d'un établissement scolaire, vous garantissez disposer de l'autorité nécessaire pour engager cet établissement.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-bold text-slate-900 mb-3">2. Description du service</h2>
            <p>
              KLASOO est une plateforme SaaS multi-tenant de gestion scolaire : gestion des élèves, du personnel, des notes, des présences, de la
              facturation scolaire, de la communication entre l'établissement, les enseignants, les parents et les élèves, et des modules
              additionnels selon le plan souscrit.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-bold text-slate-900 mb-3">3. Comptes et rôles</h2>
            <p>
              Chaque compte est personnel et rattaché à un rôle (administrateur, enseignant, parent, élève) déterminant les fonctionnalités
              accessibles. <strong>Seul l'établissement scolaire, via son compte administrateur, est responsable de la souscription et du paiement
              du plan d'abonnement.</strong> Les comptes parent et élève sont gratuits et ne peuvent en aucun cas être sollicités pour un paiement lié
              à l'abonnement de la plateforme.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-bold text-slate-900 mb-3">4. Abonnement, essai et facturation</h2>
            <p>
              Un nouvel établissement bénéficie d'un essai gratuit de 14 jours donnant accès à l'ensemble des modules, sans carte bancaire requise.
              À l'issue de l'essai, l'accès aux modules est déterminé par le plan souscrit par l'établissement. Les tarifs affichés sont indicatifs
              et peuvent varier selon la devise et le mode de facturation (mensuel ou annuel) choisis.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-bold text-slate-900 mb-3">5. Propriété des données</h2>
            <p>
              Les données saisies par un établissement scolaire (élèves, notes, présences, finances, etc.) restent la propriété de cet
              établissement. LiAfrik n'a accès à ces données que dans la mesure nécessaire à la fourniture, la maintenance et le support du
              service, conformément à notre <Link to="/privacy" className="text-indigo-600 hover:underline">Politique de confidentialité</Link>.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-bold text-slate-900 mb-3">6. Utilisation acceptable</h2>
            <p>Vous vous engagez à ne pas :</p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li>Utiliser KLASOO à des fins illégales ou pour porter atteinte aux droits d'autrui ;</li>
              <li>Tenter d'accéder à des données d'un autre établissement scolaire que le vôtre ;</li>
              <li>Perturber le fonctionnement technique de la plateforme (intrusion, surcharge délibérée, ingénierie inverse) ;</li>
              <li>Revendre ou sous-licencier l'accès à KLASOO sans accord écrit préalable de LiAfrik.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-lg font-bold text-slate-900 mb-3">7. Disponibilité du service</h2>
            <p>
              Nous nous efforçons d'assurer une disponibilité continue du service, sans garantie absolue d'absence d'interruption. Des
              opérations de maintenance planifiées peuvent occasionner de courtes interruptions, généralement annoncées à l'avance lorsque
              possible.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-bold text-slate-900 mb-3">8. Résiliation</h2>
            <p>
              Un établissement peut résilier son abonnement à tout moment depuis son espace d'administration. LiAfrik se réserve le droit de
              suspendre ou résilier un compte en cas de violation manifeste des présentes conditions, après notification préalable dans la
              mesure du possible.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-bold text-slate-900 mb-3">9. Limitation de responsabilité</h2>
            <p>
              KLASOO est fourni « en l'état ». Dans la limite permise par la loi applicable, LiAfrik ne saurait être tenu responsable des
              dommages indirects résultant de l'utilisation ou de l'impossibilité d'utiliser le service, y compris la perte de données non
              imputable à une faute de LiAfrik.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-bold text-slate-900 mb-3">10. Droit applicable</h2>
            <p>
              Les présentes conditions sont soumises, à défaut de disposition impérative contraire applicable dans le pays de l'établissement
              scolaire, au droit applicable au lieu du siège de LiAfrik. Tout litige sera prioritairement soumis à une tentative de résolution
              amiable avant toute action judiciaire.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-bold text-slate-900 mb-3">11. Modifications des conditions</h2>
            <p>
              Nous pouvons modifier ces conditions. Les administrateurs d'établissement seront informés par email de tout changement
              substantiel, avec la date de mise à jour visible en haut de cette page.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-bold text-slate-900 mb-3">12. Contact</h2>
            <p>
              <strong>support@liafrik.com</strong> (support général) · <strong>cs@liafrik.com</strong> (service client) — LiAfrik, Yaoundé
              (Cameroun) et Dubaï (Émirats arabes unis).
            </p>
          </section>
        </div>
      </main>

      <Footer onManageCookies={() => { localStorage.removeItem('klasoo_cookie_choice'); window.location.reload(); }} />
    </div>
  );
}
