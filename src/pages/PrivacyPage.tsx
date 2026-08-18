import { Logo } from '../components/Logo';
import { Footer } from '../components/Footer';
import { Link } from '../lib/router';
import { ArrowLeft } from 'lucide-react';

const LAST_UPDATED = '30 juillet 2026';

export function PrivacyPage() {
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
        <h1 className="font-heading text-3xl font-bold text-slate-900">Politique de confidentialité</h1>
        <p className="mt-2 text-sm text-slate-400">Dernière mise à jour : {LAST_UPDATED}</p>

        <div className="mt-10 space-y-10 text-sm leading-relaxed text-slate-600">
          <section>
            <h2 className="font-heading text-lg font-bold text-slate-900 mb-3">1. Qui nous sommes</h2>
            <p>
              KLASOO est une plateforme internationale de gestion scolaire multi-établissements, développée et exploitée par <strong>LiAfrik</strong>,
              société ayant des bureaux à Yaoundé (Cameroun) et Dubaï (Émirats arabes unis). Cette politique décrit comment nous collectons,
              utilisons, protégeons et partageons les informations lorsque votre établissement scolaire, ou vous-même en tant qu'administrateur,
              enseignant, parent ou élève, utilisez KLASOO.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-bold text-slate-900 mb-3">2. Rôle de chacun : responsable de traitement vs sous-traitant</h2>
            <p>
              Pour les données des élèves et de leur famille saisies dans KLASOO par un établissement scolaire, <strong>l'établissement scolaire est responsable
              du traitement</strong> de ces données ; LiAfrik agit en tant que <strong>sous-traitant</strong>, traitant les données uniquement sur instruction
              de l'établissement et pour les seules finalités de fourniture du service. Pour les données que nous collectons directement
              (ex. : compte de facturation de l'établissement, données de navigation sur notre site), LiAfrik est responsable du traitement.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-bold text-slate-900 mb-3">3. Données que nous collectons</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Données de compte</strong> : nom, prénom, email, téléphone, rôle (administrateur, enseignant, parent, élève).</li>
              <li><strong>Données scolaires</strong> : inscriptions, notes, présences, bulletins, incidents disciplinaires, données financières liées à la scolarité.</li>
              <li><strong>Données de facturation</strong> de l'établissement (plan choisi, historique de paiement) — jamais les données bancaires des parents ou élèves, qui ne paient rien directement sur KLASOO.</li>
              <li><strong>Données techniques</strong> : adresse IP, type d'appareil, journaux de connexion, cookies (voir notre politique de cookies, gérable directement depuis le site).</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-lg font-bold text-slate-900 mb-3">4. Données concernant les mineurs</h2>
            <p>
              KLASOO traite des données concernant des élèves mineurs. Ces données sont saisies par l'établissement scolaire ou les parents/tuteurs
              légaux, dans le cadre de la relation éducative. Nous ne collectons pas sciemment de données directement auprès d'un enfant en dehors
              de ce cadre scolaire encadré. Les parents disposent d'un droit d'accès aux données de leur enfant via leur propre compte, et peuvent
              exercer les droits décrits à la section 7 en s'adressant à l'établissement scolaire ou directement à nous.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-bold text-slate-900 mb-3">5. Base légale et cadres applicables</h2>
            <p>
              Selon le pays de l'établissement scolaire, KLASOO s'efforce de respecter les cadres de protection des données applicables, notamment
              le Règlement général sur la protection des données (RGPD) pour les établissements situés dans l'Union européenne ou traitant des
              données de résidents européens, ainsi que les lois nationales de protection des données en vigueur dans les pays où nos clients
              sont établis. Le traitement repose selon les cas sur l'exécution du contrat conclu avec l'établissement, le consentement, ou l'intérêt
              légitime à fournir et améliorer le service.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-bold text-slate-900 mb-3">6. Partage des données</h2>
            <p>
              Nous ne vendons jamais vos données. Nous les partageons uniquement avec :
            </p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li>Nos sous-traitants techniques (hébergement et base de données), liés par des obligations de confidentialité contractuelles.</li>
              <li>Les autorités compétentes, si la loi nous y oblige.</li>
              <li>Un éventuel repreneur, en cas de fusion ou cession d'activité, sous les mêmes engagements de confidentialité.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-lg font-bold text-slate-900 mb-3">7. Vos droits</h2>
            <p>
              Selon votre pays de résidence, vous disposez généralement d'un droit d'accès, de rectification, d'effacement, de limitation du
              traitement, de portabilité de vos données, et d'opposition. Pour exercer ces droits, contactez d'abord votre établissement scolaire
              (responsable de traitement principal pour les données scolaires), ou écrivez-nous directement à <strong>support@liafrik.com</strong>.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-bold text-slate-900 mb-3">8. Conservation des données</h2>
            <p>
              Les données sont conservées pendant la durée de la relation contractuelle avec l'établissement, puis archivées ou supprimées
              conformément aux obligations légales de conservation des dossiers scolaires applicables dans le pays de l'établissement.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-bold text-slate-900 mb-3">9. Sécurité</h2>
            <p>
              Nous mettons en œuvre des mesures techniques et organisationnelles raisonnables pour protéger vos données : chiffrement en
              transit, cloisonnement strict des données entre établissements (architecture multi-tenant), contrôle d'accès basé sur les rôles,
              et journalisation des actions sensibles.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-bold text-slate-900 mb-3">10. Transferts internationaux</h2>
            <p>
              KLASOO étant une plateforme internationale, vos données peuvent être hébergées ou traitées dans un pays différent du vôtre. Nous
              nous efforçons d'assurer un niveau de protection équivalent à celui exigé dans votre juridiction lors de tout transfert
              international de données.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-bold text-slate-900 mb-3">11. Modifications</h2>
            <p>
              Nous pouvons mettre à jour cette politique. Toute modification substantielle sera communiquée aux administrateurs d'établissement
              par email, avec la date de dernière mise à jour visible en haut de cette page.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-bold text-slate-900 mb-3">12. Nous contacter</h2>
            <p>
              Pour toute question relative à cette politique ou à vos données : <strong>support@liafrik.com</strong> (support général) ou{' '}
              <strong>cs@liafrik.com</strong> (service client). LiAfrik — Yaoundé, Cameroun · Dubaï, Émirats arabes unis.
            </p>
          </section>
        </div>
      </main>

      <Footer onManageCookies={() => { localStorage.removeItem('klasoo_cookie_choice'); window.location.reload(); }} />
    </div>
  );
}
