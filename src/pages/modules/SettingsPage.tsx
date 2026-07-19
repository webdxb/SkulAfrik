import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { PageHeader, Modal, inputCls, FieldError as FieldErrorView, inputErrorCls } from '../../components/ui';
import { validateRequired, validatePhone, validateEmail, FieldErrors, hasErrors } from '../../lib/validation';
import { Building2, Lock, FileText, AlertCircle, Check, ShieldCheck } from 'lucide-react';

const CURRENCIES = [
  { code: 'XAF', label: 'FCFA (XAF)' }, { code: 'XOF', label: 'FCFA (XOF)' },
  { code: 'NGN', label: 'Naira' }, { code: 'USD', label: 'USD' }, { code: 'EUR', label: 'Euro' },
];

export function SettingsPage() {
  const { school, profile, user, refresh } = useAuth();
  const [editing, setEditing] = useState(false);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [changeRequests, setChangeRequests] = useState<any[]>([]);
  const [form, setForm] = useState({ name: '', legal_name: '', country: '', region: '', city: '', address: '', phone: '', director_name: '', director_email: '', language: 'fr' });
  const [errors, setErrors] = useState<FieldErrors<typeof form>>({});
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);

  useEffect(() => {
    if (school) setForm({
      name: school.name || '', legal_name: school.legal_name || '', country: school.country || '',
      region: (school as any).region || '', city: school.city || '', address: (school as any).address || '',
      phone: (school as any).phone || '', director_name: (school as any).director_name || '',
      director_email: (school as any).director_email || '', language: school.language || 'fr',
    });
  }, [school]);

  useEffect(() => {
    (async () => {
      if (!school) return;
      const { data } = await supabase.from('currency_change_requests').select('*').eq('school_id', school.id).order('created_at', { ascending: false });
      setChangeRequests(data || []);
    })();
  }, [school]);

  const validate = () => {
    const e: typeof errors = {};
    const n = validateRequired(form.name, 'Le nom'); if (n) e.name = n;
    const ln = validateRequired(form.legal_name, 'La raison sociale'); if (ln) e.legal_name = ln;
    const c = validateRequired(form.country, 'Le pays'); if (c) e.country = c;
    const r = validateRequired(form.region, 'La région'); if (r) e.region = r;
    const ci = validateRequired(form.city, 'La ville'); if (ci) e.city = ci;
    if (form.phone) { const p = validatePhone(form.phone); if (p) e.phone = p; }
    if (form.director_email) { const em = validateEmail(form.director_email); if (em) e.director_email = em; }
    const dn = validateRequired(form.director_name, 'Le nom du directeur'); if (dn) e.director_name = dn;
    setErrors(e);
    return !hasErrors(e);
  };

  const save = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setSaving(true);
    const { error } = await supabase.from('schools').update({
      name: form.name, legal_name: form.legal_name, country: form.country, region: form.region,
      city: form.city, address: form.address, phone: form.phone, director_name: form.director_name,
      director_email: form.director_email, language: form.language,
    }).eq('id', school!.id);
    setSaving(false);
    if (error) { alert(error.message); return; }
    await refresh();
    setEditing(false);
    setSavedMsg(true); setTimeout(() => setSavedMsg(false), 3000);
  };

  return (
    <div className="space-y-5 max-w-3xl">
      <PageHeader title="Paramètres" subtitle="Configuration de l'établissement" action={
        !editing ? <button onClick={() => setEditing(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">Modifier</button> : undefined
      } />

      {savedMsg && <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-100 px-4 py-2.5 text-sm text-emerald-700"><Check size={16} /> Modifications enregistrées.</div>}

      <form onSubmit={save} className="bg-white rounded-xl border border-slate-100 shadow-sm divide-y divide-slate-100">
        <div className="p-6">
          <h3 className="font-sans font-bold text-lg text-slate-900 mb-4 flex items-center gap-2"><Building2 size={18} className="text-slate-400" /> Informations générales</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div><label className="block font-medium text-slate-700 mb-1.5">Nom commercial</label><input disabled={!editing} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputErrorCls(!!errors.name)} />{editing && <FieldErrorView error={errors.name} />}</div>
            <div><label className="block font-medium text-slate-700 mb-1.5">Raison sociale</label><input disabled={!editing} value={form.legal_name} onChange={(e) => setForm({ ...form, legal_name: e.target.value })} className={inputErrorCls(!!errors.legal_name)} />{editing && <FieldErrorView error={errors.legal_name} />}</div>
            <div><label className="block font-medium text-slate-700 mb-1.5">Pays</label>
              <select disabled={!editing} value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className={inputCls}>
                <option value="CM">Cameroun</option><option value="SN">Sénégal</option><option value="CI">Côte d'Ivoire</option>
                <option value="ML">Mali</option><option value="BF">Burkina Faso</option><option value="GA">Gabon</option>
                <option value="CG">Congo</option><option value="CD">RD Congo</option><option value="NG">Nigeria</option><option value="KE">Kenya</option>
              </select>
            </div>
            <div><label className="block font-medium text-slate-700 mb-1.5">Région</label><input disabled={!editing} value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} className={inputErrorCls(!!errors.region)} />{editing && <FieldErrorView error={errors.region} />}</div>
            <div><label className="block font-medium text-slate-700 mb-1.5">Ville</label><input disabled={!editing} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className={inputErrorCls(!!errors.city)} />{editing && <FieldErrorView error={errors.city} />}</div>
            <div><label className="block font-medium text-slate-700 mb-1.5">Adresse</label><input disabled={!editing} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={inputCls} /></div>
            <div><label className="block font-medium text-slate-700 mb-1.5">Téléphone</label><input disabled={!editing} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputErrorCls(!!errors.phone)} placeholder="+237XXXXXXXXX" />{editing && <FieldErrorView error={errors.phone} />}</div>
            <div><label className="block font-medium text-slate-700 mb-1.5">Langue par défaut</label><select disabled={!editing} value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })} className={inputCls}><option value="fr">Français</option><option value="en">English</option></select></div>
          </div>
        </div>
        <div className="p-6">
          <h3 className="font-sans font-bold text-lg text-slate-900 mb-4">Responsable légal</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div><label className="block font-medium text-slate-700 mb-1.5">Nom du directeur</label><input disabled={!editing} value={form.director_name} onChange={(e) => setForm({ ...form, director_name: e.target.value })} className={inputErrorCls(!!errors.director_name)} />{editing && <FieldErrorView error={errors.director_name} />}</div>
            <div><label className="block font-medium text-slate-700 mb-1.5">Email du directeur</label><input disabled={!editing} value={form.director_email} onChange={(e) => setForm({ ...form, director_email: e.target.value })} className={inputErrorCls(!!errors.director_email)} />{editing && <FieldErrorView error={errors.director_email} />}</div>
          </div>
        </div>
        {editing && (
          <div className="p-6 flex justify-end gap-2">
            <button type="button" onClick={() => { setEditing(false); setErrors({}); }} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg">Annuler</button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-60">{saving ? '...' : 'Enregistrer'}</button>
          </div>
        )}
      </form>

      {/* Currency (locked) */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-sans font-bold text-lg text-slate-900 mb-1 flex items-center gap-2"><Lock size={18} className="text-slate-400" /> Devise</h3>
            <p className="text-sm text-slate-500">Verrouillée pour garantir la cohérence des rapports et factures.</p>
            <p className="mt-2 font-semibold text-slate-900">{CURRENCIES.find((c) => c.code === school?.currency)?.label || school?.currency}</p>
          </div>
          <button onClick={() => setShowCurrencyModal(true)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50">Demander un changement</button>
        </div>
        {changeRequests.length > 0 && (
          <div className="mt-4 space-y-2">
            {changeRequests.map((cr) => (
              <div key={cr.id} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-sm">
                <span className="text-slate-600">Demande vers <strong>{cr.requested_currency}</strong> — {cr.reason || 'sans motif'}</span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${cr.status === 'pending' ? 'bg-amber-50 text-amber-700' : cr.status === 'approved' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{cr.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Status */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
        <h3 className="font-sans font-bold text-lg text-slate-900 mb-3 flex items-center gap-2"><ShieldCheck size={18} className="text-slate-400" /> Statut</h3>
        <div className="flex flex-wrap gap-3">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${school?.verification_status === 'verified' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
            <ShieldCheck size={14} /> {school?.verification_status === 'verified' ? 'Vérifié' : 'En attente de vérification'}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700">{school?.subscription_status}</span>
        </div>
      </div>

      {showCurrencyModal && <CurrencyChangeModal schoolId={school!.id} userId={user!.id} current={school!.currency} onClose={() => setShowCurrencyModal(false)} onSaved={() => { setShowCurrencyModal(false); window.location.reload(); }} />}
    </div>
  );
}

function CurrencyChangeModal({ schoolId, userId, current, onClose, onSaved }: { schoolId: string; userId: string; current: string; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ requested_currency: '', reason: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.requested_currency) { setError('Veuillez sélectionner une devise.'); return; }
    if (form.requested_currency === current) { setError('La devise demandée est identique à la devise actuelle.'); return; }
    if (!form.reason.trim()) { setError('Un motif est obligatoire.'); return; }
    setSaving(true);
    const { error } = await supabase.from('currency_change_requests').insert({ school_id: schoolId, requested_by: userId, requested_currency: form.requested_currency, reason: form.reason });
    setSaving(false);
    if (error) { setError(error.message); return; }
    await supabase.from('audit_logs').insert({ actor_id: userId, action: 'currency.change_requested', target_type: 'school', target_id: schoolId, school_id: schoolId, metadata: { from: current, to: form.requested_currency } });
    onSaved();
  };

  return (
    <Modal title="Demande de changement de devise" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div className="rounded-lg bg-amber-50 border border-amber-100 px-3 py-2 text-sm text-amber-700 flex items-start gap-2"><AlertCircle size={16} className="flex-shrink-0 mt-0.5" /> Cette demande sera traitée manuellement par le Super Admin et tracée dans le journal d'audit.</div>
        <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Nouvelle devise</label><select value={form.requested_currency} onChange={(e) => setForm({ ...form, requested_currency: e.target.value })} className={inputCls}><option value="">Sélectionner...</option>{CURRENCIES.filter((c) => c.code !== current).map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}</select></div>
        <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Motif</label><textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} className={inputCls} rows={3} placeholder="Erreur initiale, changement de marché..." /></div>
        {error && <div className="rounded-lg bg-rose-50 border border-rose-100 px-3 py-2 text-sm text-rose-700">{error}</div>}
        <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg">Annuler</button><button type="submit" disabled={saving} className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-60">{saving ? '...' : 'Envoyer la demande'}</button></div>
      </form>
    </Modal>
  );
}
