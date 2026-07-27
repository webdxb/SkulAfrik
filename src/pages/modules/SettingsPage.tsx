import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { PageHeader, Modal, inputCls, Card } from '../../components/ui';
import { Settings, Plus, Trash2, Shield, Check, X, CreditCard } from 'lucide-react';

interface CustomRole {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
}

interface RolePermission {
  id: string;
  role_id: string;
  module: string;
  can_read: boolean;
  can_write: boolean;
  can_delete: boolean;
}

const MODULES = [
  'students', 'parents', 'teachers', 'staff', 'classes', 'subjects',
  'attendance', 'grades', 'exams', 'bulletins', 'calendar', 'transport',
  'library', 'alumni', 'finances', 'accounting', 'payroll', 'reports',
  'messages', 'support', 'settings',
];

const MODULE_LABELS: Record<string, string> = {
  students: 'Élèves', parents: 'Parents', teachers: 'Enseignants', staff: 'Personnel',
  classes: 'Classes', subjects: 'Matières', attendance: 'Présences', grades: 'Notes',
  exams: 'Examens', bulletins: 'Bulletins', calendar: 'Calendrier', transport: 'Transport',
  library: 'Bibliothèque', alumni: 'Anciens élèves', finances: 'Finances', accounting: 'Comptabilité',
  payroll: 'Paie', reports: 'Rapports', messages: 'Messagerie', support: 'Support', settings: 'Paramètres',
};

export function SettingsPage() {
  const { school, profile, refresh } = useAuth();
  const [schoolForm, setSchoolForm] = useState({ name: '', country: '', city: '', phone: '', email: '', address: '' });
  const [savingSchool, setSavingSchool] = useState(false);
  const [schoolSaved, setSchoolSaved] = useState(false);

  const [roles, setRoles] = useState<CustomRole[]>([]);
  const [permissions, setPermissions] = useState<RolePermission[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [newRole, setNewRole] = useState({ name: '', description: '' });
  const [savingRole, setSavingRole] = useState(false);

  useEffect(() => {
    if (school) {
      setSchoolForm({
        name: school.name || '',
        country: school.country || '',
        city: school.city || '',
        phone: school.phone || '',
        email: school.email || '',
        address: school.address || '',
      });
    }
  }, [school]);

  useEffect(() => {
    if (school) loadRoles();
  }, [school]);

  async function loadRoles() {
    if (!school) return;
    setLoadingRoles(true);
    const { data: rolesData } = await supabase.from('custom_roles').select('id, name, description, is_active').eq('school_id', school.id).order('created_at');
    setRoles((rolesData || []) as CustomRole[]);

    if ((rolesData || []).length > 0) {
      const { data: perms } = await supabase.from('custom_role_permissions').select('id, role_id, module, can_read, can_write, can_delete').in('role_id', (rolesData || []).map((r: any) => r.id));
      setPermissions((perms || []) as RolePermission[]);
    }
    setLoadingRoles(false);
  }

  async function handleSaveSchool() {
    if (!school) return;
    setSavingSchool(true);
    await supabase.from('schools').update({
      name: schoolForm.name,
      country: schoolForm.country || null,
      city: schoolForm.city || null,
      phone: schoolForm.phone || null,
      email: schoolForm.email || null,
      address: schoolForm.address || null,
    }).eq('id', school.id);
    setSavingSchool(false);
    setSchoolSaved(true);
    setTimeout(() => setSchoolSaved(false), 3000);
    refresh();
  }

  async function handleCreateRole() {
    if (!newRole.name || !school) return;
    setSavingRole(true);
    const { data } = await supabase.from('custom_roles').insert({
      school_id: school.id,
      name: newRole.name,
      description: newRole.description || null,
      is_system: false,
      is_active: true,
    }).select('id').single();
    if (data?.id) {
      setSelectedRoleId(data.id);
      setNewRole({ name: '', description: '' });
      setRoleModalOpen(false);
      loadRoles();
    }
    setSavingRole(false);
  }

  async function handleDeleteRole(id: string) {
    if (!confirm('Supprimer ce rôle ?')) return;
    await supabase.from('custom_role_permissions').delete().eq('role_id', id);
    await supabase.from('custom_roles').delete().eq('id', id);
    if (selectedRoleId === id) setSelectedRoleId(null);
    loadRoles();
  }

  async function togglePermission(roleId: string, module: string, field: 'can_read' | 'can_write' | 'can_delete') {
    const existing = permissions.find((p) => p.role_id === roleId && p.module === module);
    if (existing) {
      const newValue = !existing[field];
      await supabase.from('custom_role_permissions').update({ [field]: newValue }).eq('id', existing.id);
      setPermissions(permissions.map((p) => p.id === existing.id ? { ...p, [field]: newValue } : p));
    } else {
      const { data } = await supabase.from('custom_role_permissions').insert({
        role_id: roleId,
        module,
        can_read: field === 'can_read',
        can_write: field === 'can_write',
        can_delete: field === 'can_delete',
      }).select('id').single();
      if (data) {
        setPermissions([...permissions, { id: data.id, role_id: roleId, module, can_read: field === 'can_read', can_write: field === 'can_write', can_delete: field === 'can_delete' }]);
      }
    }
  }

  const selectedRole = roles.find((r) => r.id === selectedRoleId);
  const selectedPerms = permissions.filter((p) => p.role_id === selectedRoleId);

  return (
    <div>
      <PageHeader title="Paramètres" subtitle="Configuration de l'établissement" />

      {/* School Info */}
      <Card className="mb-6 p-6">
        <div className="mb-4 flex items-center gap-2">
          <Settings size={20} className="text-slate-400" />
          <h2 className="font-heading text-lg font-bold text-slate-900 dark:text-slate-100">Informations de l'établissement</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Nom</label>
            <input className={inputCls} value={schoolForm.name} onChange={(e) => setSchoolForm({ ...schoolForm, name: e.target.value })} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Pays</label>
            <input className={inputCls} value={schoolForm.country} onChange={(e) => setSchoolForm({ ...schoolForm, country: e.target.value })} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Ville</label>
            <input className={inputCls} value={schoolForm.city} onChange={(e) => setSchoolForm({ ...schoolForm, city: e.target.value })} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Téléphone</label>
            <input className={inputCls} value={schoolForm.phone} onChange={(e) => setSchoolForm({ ...schoolForm, phone: e.target.value })} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
            <input type="email" className={inputCls} value={schoolForm.email} onChange={(e) => setSchoolForm({ ...schoolForm, email: e.target.value })} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Adresse</label>
            <input className={inputCls} value={schoolForm.address} onChange={(e) => setSchoolForm({ ...schoolForm, address: e.target.value })} />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-4">
          <button onClick={handleSaveSchool} disabled={savingSchool} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
            {savingSchool ? 'Enregistrement...' : 'Enregistrer'}
          </button>
          {schoolSaved && <span className="text-sm text-emerald-600 dark:text-emerald-400">✓ Modifications enregistrées</span>}
        </div>
      </Card>

      {/* Plan Info */}
      <Card className="mb-6 p-6">
        <div className="mb-4 flex items-center gap-2">
          <CreditCard size={20} className="text-slate-400" />
          <h2 className="font-heading text-lg font-bold text-slate-900 dark:text-slate-100">Abonnement</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-xs uppercase text-slate-500 dark:text-slate-400">Plan actuel</p>
            <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">{school?.trial_ends_at ? 'Essai' : '—'}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-slate-500 dark:text-slate-400">Statut</p>
            <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">{school?.trial_ends_at ? 'Actif' : '—'}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-slate-500 dark:text-slate-400">Fin d'essai</p>
            <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">{school?.trial_ends_at ? new Date(school.trial_ends_at).toLocaleDateString('fr-FR') : '—'}</p>
          </div>
        </div>
      </Card>

      {/* Custom Roles */}
      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield size={20} className="text-slate-400" />
            <h2 className="font-heading text-lg font-bold text-slate-900 dark:text-slate-100">Rôles personnalisés</h2>
          </div>
          <button onClick={() => setRoleModalOpen(true)} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
            <Plus size={16} /> Créer un rôle
          </button>
        </div>

        {loadingRoles ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">Chargement...</p>
        ) : roles.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">Aucun rôle personnalisé. Créez un rôle pour gérer les permissions par module.</p>
        ) : (
          <>
            {/* Role list */}
            <div className="mb-4 flex flex-wrap gap-2">
              {roles.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setSelectedRoleId(r.id)}
                  className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium ${selectedRoleId === r.id ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-700' : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                >
                  {r.name}
                  {!r.is_active && <span className="text-xs text-slate-400">(inactif)</span>}
                </button>
              ))}
            </div>

            {/* Permission matrix for selected role */}
            {selectedRole && (
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-medium text-slate-900 dark:text-slate-100">Permissions — {selectedRole.name}</h3>
                  <button onClick={() => handleDeleteRole(selectedRole.id)} className="inline-flex items-center gap-1 text-sm text-rose-600 hover:text-rose-700 dark:text-rose-400">
                    <Trash2 size={14} /> Supprimer le rôle
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-left text-xs uppercase text-slate-500 dark:text-slate-400">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Module</th>
                        <th className="px-4 py-3 font-semibold text-center">Lecture</th>
                        <th className="px-4 py-3 font-semibold text-center">Écriture</th>
                        <th className="px-4 py-3 font-semibold text-center">Suppression</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {MODULES.map((mod) => {
                        const perm = selectedPerms.find((p) => p.module === mod);
                        return (
                          <tr key={mod} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{MODULE_LABELS[mod] || mod}</td>
                            <td className="px-4 py-3 text-center">
                              <button onClick={() => togglePermission(selectedRole.id, mod, 'can_read')} className={`inline-flex h-7 w-7 items-center justify-center rounded-md ${perm?.can_read ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'}`}>
                                {perm?.can_read ? <Check size={16} /> : <X size={16} />}
                              </button>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button onClick={() => togglePermission(selectedRole.id, mod, 'can_write')} className={`inline-flex h-7 w-7 items-center justify-center rounded-md ${perm?.can_write ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'}`}>
                                {perm?.can_write ? <Check size={16} /> : <X size={16} />}
                              </button>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button onClick={() => togglePermission(selectedRole.id, mod, 'can_delete')} className={`inline-flex h-7 w-7 items-center justify-center rounded-md ${perm?.can_delete ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'}`}>
                                {perm?.can_delete ? <Check size={16} /> : <X size={16} />}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Create Role Modal */}
      {roleModalOpen && (
        <Modal title="Créer un rôle personnalisé" onClose={() => setRoleModalOpen(false)}>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Nom du rôle</label>
              <input className={inputCls} value={newRole.name} onChange={(e) => setNewRole({ ...newRole, name: e.target.value })} placeholder="Ex: Surveillant, Censeur..." />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
              <textarea className={inputCls} rows={2} value={newRole.description} onChange={(e) => setNewRole({ ...newRole, description: e.target.value })} />
            </div>
            <button onClick={handleCreateRole} disabled={savingRole || !newRole.name} className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
              {savingRole ? 'Création...' : 'Créer le rôle'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
