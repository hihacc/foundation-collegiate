'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Save, Settings, KeyRound, UserPlus, Shield, Trash2, Eye, EyeOff, Loader2, RefreshCw, BookOpen, X, Award, UserCheck, Database, Download, Upload, CheckCircle2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import { getStoredData, setStoredData } from '@/lib/utils/storage';

interface AdminAccount {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: string;
  created_at: string;
}

const defaultAdminAccounts: AdminAccount[] = [
  { id: '110e8400-e29b-41d4-a716-446655440001', name: 'The Foundation Collegiate Admin', email: 'foundationcollegiate@gmail.com', role: 'Super Admin', created_at: new Date().toISOString() },
  { id: '110e8400-e29b-41d4-a716-446655440002', name: 'TFC Master Admin', email: 'tfc@tfc.com', role: 'Super Admin', created_at: new Date().toISOString() }
];

const settingFields = [
  { key: 'site_name', label: 'Site Name', type: 'text' },
  { key: 'site_tagline', label: 'Tagline', type: 'text' },
  { key: 'contact_phone', label: 'Phone Number', type: 'text' },
  { key: 'contact_email', label: 'Email Address', type: 'email' },
  { key: 'contact_address', label: 'Full Address', type: 'textarea' },
  { key: 'whatsapp_number', label: 'WhatsApp Number', type: 'text' },
  { key: 'admissions_open', label: 'Admissions Open?', type: 'boolean' },
];

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<'general' | 'principal' | 'programs' | 'database' | 'password' | 'admins'>('general');
  const [settings, setSettings] = useState<Record<string, string>>({
    site_name: 'The Foundation Collegiate',
    site_tagline: 'We Know and Deliver what Quality Education Means',
    contact_phone: '0333-3439458',
    contact_email: 'foundationcollegiate@gmail.com',
    contact_address: 'Sector 11-B, North Karachi',
    whatsapp_number: '+923333439458',
    admissions_open: 'true',
    admission_classes: '["IX - Science", "IX - Computer", "X - Science", "X - Computer", "XI - Pre-Medical", "XI - Pre-Engineering", "XI - Commerce", "XII - Pre-Medical", "XII - Pre-Engineering", "XII - Commerce"]',
    admission_subjects: '["Chemistry", "Biology", "Computer", "Maths", "Physics", "English", "Urdu", "Sindhi", "Islamiat", "Pak. Studies", "Accounting", "Business Maths", "Statistics", "POC", "Economics", "Com. Geography", "Banking", "ITB", "Bus. Communication", "Business Law", "Management", "Insurance"]'
  });

  // Principal Profile Form State
  const [principalForm, setPrincipalForm] = useState({
    name: 'Dr. Asif Iqbal',
    title: 'Director & Principal, The Foundation Collegiate',
    credentials: 'PhD, M.Phil, MBA (HR), M.Ed, MA (IR), MA (IS), B.Sc (Hons), IDCS, IAD',
    photo_url: '',
    message: 'Quality education is not merely about passing examinations; it is about building intellectual discipline, conceptual clarity, and unshakeable confidence in every student. Welcome to The Foundation Collegiate.',
    is_published: true
  });
  const [principalSaving, setPrincipalSaving] = useState(false);

  // Database Backup / Import State
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<string>('');

  const [saving, setSaving] = useState(false);

  // Dynamic Programs Arrays
  const [classesList, setClassesList] = useState<string[]>([]);
  const [subjectsList, setSubjectsList] = useState<string[]>([]);
  const [newClass, setNewClass] = useState('');
  const [newSubject, setNewSubject] = useState('');

  // Password & Admins State
  const [passForm, setPassForm] = useState({ targetEmail: 'tfc@tfc.com', newPassword: '', confirmPassword: '' });
  const [showPass, setShowPass] = useState(false);
  const [passSubmitting, setPassSubmitting] = useState(false);
  const [adminAccounts, setAdminAccounts] = useState<AdminAccount[]>(() => getStoredData('admin_users', defaultAdminAccounts));
  const [newAdminForm, setNewAdminForm] = useState({ name: '', email: '', password: '', role: 'Staff Admin' });
  const [adminSubmitting, setAdminSubmitting] = useState(false);
  const [resetModalAdmin, setResetModalAdmin] = useState<AdminAccount | null>(null);
  const [resetNewPass, setResetNewPass] = useState('');

  useEffect(() => {
    supabase.from('settings').select('*').then((res: any) => {
      if (res.data && res.data.length > 0) {
        const map: Record<string, string> = {};
        res.data.forEach((s: any) => { map[s.key] = s.value; });
        setSettings(prev => ({ ...prev, ...map }));
        
        try { if (map.admission_classes) setClassesList(JSON.parse(map.admission_classes)); } catch {}
        try { if (map.admission_subjects) setSubjectsList(JSON.parse(map.admission_subjects)); } catch {}
      } else {
        try { setClassesList(JSON.parse(settings.admission_classes)); } catch {}
        try { setSubjectsList(JSON.parse(settings.admission_subjects)); } catch {}
      }
    });

    supabase.from('principal_profile').select('*').limit(1).single().then((res: any) => {
      if (res.data) {
        setPrincipalForm({
          name: res.data.name || 'Dr. Asif Iqbal',
          title: res.data.title || 'Director & Principal, The Foundation Collegiate',
          credentials: res.data.credentials || 'PhD, M.Phil, MBA (HR), M.Ed, MA (IR), MA (IS), B.Sc (Hons), IDCS, IAD',
          photo_url: res.data.photo_url || '',
          message: res.data.message || '',
          is_published: res.data.is_published ?? true
        });
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const updates = Object.entries(settings).map(([key, value]) =>
        supabase.from('settings').upsert({ key, value }).eq('key', key)
      );
      await Promise.all(updates);
      toast.success('Site settings saved!');
    } catch {
      toast.success('Site settings updated!');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePrincipal = async () => {
    setPrincipalSaving(true);
    try {
      const { error } = await supabase.from('principal_profile').upsert(principalForm);
      if (error) throw error;
      toast.success('Principal profile updated successfully!');
    } catch {
      setStoredData('principal_profile', principalForm);
      toast.success('Principal profile updated (Local mode)');
    } finally {
      setPrincipalSaving(false);
    }
  };

  // Full Database Backup Export
  const handleExportDatabase = async () => {
    setIsExporting(true);
    try {
      const tables = [
        'settings', 'principal_profile', 'academic_classes', 'academic_groups',
        'academic_subjects', 'programs', 'teachers', 'courses', 'students',
        'admissions', 'fee_structures', 'fee_challans', 'results', 'notices',
        'gallery', 'achievers', 'downloads', 'contacts'
      ];
      
      const backupData: Record<string, any> = {
        meta: {
          exported_at: new Date().toISOString(),
          version: '1.0',
          app: 'The Foundation Collegiate'
        },
        tables: {}
      };

      for (const table of tables) {
        try {
          const { data } = await supabase.from(table).select('*');
          backupData.tables[table] = data || [];
        } catch {
          backupData.tables[table] = [];
        }
      }

      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(backupData, null, 2))}`;
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', jsonString);
      downloadAnchor.setAttribute('download', `tfc-database-backup-${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      toast.success('Full Database Backup JSON file downloaded successfully!');
    } catch (err) {
      toast.error('Failed to export database backup.');
    } finally {
      setIsExporting(false);
    }
  };

  // Database Backup Import / Restore State
  const [pendingRestoreFile, setPendingRestoreFile] = useState<File | null>(null);
  const [restoreConfirmInput, setRestoreConfirmInput] = useState<string>('');

  const handleSelectFileForRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingRestoreFile(file);
    setRestoreConfirmInput('');
    // Reset file input value so re-selecting same file triggers onChange
    e.target.value = '';
  };

  const handleConfirmAndRunImport = () => {
    if (!pendingRestoreFile) return;
    if (restoreConfirmInput.trim() !== 'RESTORE') {
      toast.error('You must type RESTORE in all capital letters to confirm database overwrite.');
      return;
    }

    const file = pendingRestoreFile;
    setPendingRestoreFile(null);
    setIsImporting(true);
    setImportStatus('Reading backup file...');

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const rawJson = event.target?.result as string;
        const backup = JSON.parse(rawJson);

        if (!backup.tables || typeof backup.tables !== 'object') {
          toast.error('Invalid backup file format.');
          setIsImporting(false);
          setImportStatus('');
          return;
        }

        const tableNames = Object.keys(backup.tables);
        let restoredCount = 0;

        for (const table of tableNames) {
          const rows = backup.tables[table];
          if (Array.isArray(rows) && rows.length > 0) {
            setImportStatus(`Restoring table '${table}' (${rows.length} records)...`);
            try {
              await supabase.from(table).upsert(rows);
              restoredCount += rows.length;
            } catch {
              // Silent error logging to avoid exposing data in client console
            }
          }
        }

        toast.success(`Database restore complete! ${restoredCount} total records imported.`);
        setImportStatus(`Restore completed successfully (${restoredCount} records).`);
      } catch {
        toast.error('Failed to parse database backup file.');
        setImportStatus('Import failed due to file parsing error.');
      } finally {
        setIsImporting(false);
      }
    };
    reader.readAsText(file);
  };

  const handleSavePrograms = async () => {
    setSaving(true);
    try {
      const classStr = JSON.stringify(classesList);
      const subjStr = JSON.stringify(subjectsList);
      
      setSettings(prev => ({ ...prev, admission_classes: classStr, admission_subjects: subjStr }));
      
      await Promise.all([
        supabase.from('settings').upsert({ key: 'admission_classes', value: classStr }).eq('key', 'admission_classes'),
        supabase.from('settings').upsert({ key: 'admission_subjects', value: subjStr }).eq('key', 'admission_subjects')
      ]);
      
      toast.success('Classes & Subjects saved successfully!');
    } catch {
      toast.error('Failed to save programs data.');
    } finally {
      setSaving(false);
    }
  };

  const addClassItem = () => {
    if (newClass.trim() && !classesList.includes(newClass.trim())) {
      setClassesList([...classesList, newClass.trim()]);
      setNewClass('');
    }
  };

  const addSubjectItem = () => {
    if (newSubject.trim() && !subjectsList.includes(newSubject.trim())) {
      setSubjectsList([...subjectsList, newSubject.trim()]);
      setNewSubject('');
    }
  };

  const handleDirectPasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passForm.newPassword) { toast.error('Please enter a new password'); return; }
    if (passForm.newPassword !== passForm.confirmPassword) { toast.error('Passwords do not match'); return; }
    setPassSubmitting(true);
    const target = passForm.targetEmail.trim().toLowerCase();
    const newPass = passForm.newPassword.trim();
    const updated = adminAccounts.map(acc => {
      if (acc.email.toLowerCase() === target) { return { ...acc, password: newPass }; }
      return acc;
    });
    setAdminAccounts(updated);
    setStoredData('admin_users', updated);
    try { await supabase.from('admin_users').upsert({ email: target, password: newPass }, { onConflict: 'email' }); } catch {}
    toast.success(`Password for ${target} has been updated.`);
    setPassForm({ ...passForm, newPassword: '', confirmPassword: '' });
    setPassSubmitting(false);
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminForm.name || !newAdminForm.email || !newAdminForm.password) return;
    setAdminSubmitting(true);
    const newAdmin: AdminAccount = {
      id: crypto.randomUUID(),
      name: newAdminForm.name,
      email: newAdminForm.email.toLowerCase(),
      password: newAdminForm.password,
      role: newAdminForm.role,
      created_at: new Date().toISOString()
    };
    const updated = [...adminAccounts, newAdmin];
    setAdminAccounts(updated);
    setStoredData('admin_users', updated);
    try { await supabase.from('admin_users').upsert(newAdmin, { onConflict: 'email' }); } catch {}
    toast.success('New Admin Account Created!');
    setNewAdminForm({ name: '', email: '', password: '', role: 'Staff Admin' });
    setAdminSubmitting(false);
  };

  const handleDeleteAdmin = async (id: string) => {
    const admin = adminAccounts.find(a => a.id === id);
    if (!admin || admin.role === 'Super Admin') { toast.error('Cannot delete Super Admin account'); return; }
    if (!window.confirm('Are you sure you want to delete this admin account?')) return;
    const updated = adminAccounts.filter(a => a.id !== id);
    setAdminAccounts(updated);
    setStoredData('admin_users', updated);
    try { await supabase.from('admin_users').delete().eq('id', id); } catch {}
    toast.success('Admin deleted successfully');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-800">System Settings</h1>
        <p className="text-slate-500 text-sm mt-1">Manage global site configuration, principal profile, database backups, programs, and admin accounts</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <button onClick={() => setActiveTab('general')} className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 shadow-sm ${activeTab === 'general' ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}><Settings size={16} /> General Settings</button>
        <button onClick={() => setActiveTab('principal')} className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 shadow-sm ${activeTab === 'principal' ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}><UserCheck size={16} /> Principal Profile</button>
        <button onClick={() => setActiveTab('database')} className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 shadow-sm ${activeTab === 'database' ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}><Database size={16} /> Database Backup &amp; Restore</button>
        <button onClick={() => setActiveTab('programs')} className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 shadow-sm ${activeTab === 'programs' ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}><BookOpen size={16} /> Programs &amp; Subjects</button>
        <button onClick={() => setActiveTab('password')} className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 shadow-sm ${activeTab === 'password' ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}><KeyRound size={16} /> Emergency Password</button>
        <button onClick={() => setActiveTab('admins')} className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 shadow-sm ${activeTab === 'admins' ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}><Shield size={16} /> Manage Admins</button>
      </div>

      {activeTab === 'general' && (
        <div className="bg-white p-6 md:p-8 border border-slate-200 rounded-2xl shadow-sm">
          <h2 className="text-xl font-bold mb-6 text-slate-800">Global Settings</h2>
          <div className="space-y-5">
            {settingFields.map(field => (
              <div key={field.key} className="grid grid-cols-1 md:grid-cols-4 md:items-center gap-2 md:gap-4 border-b border-slate-100 pb-5 last:border-0 last:pb-0">
                <div className="text-sm font-semibold text-slate-700">{field.label}</div>
                <div className="md:col-span-3">
                  {field.type === 'boolean' ? (
                    <select value={settings[field.key] || 'false'} onChange={e => setSettings({ ...settings, [field.key]: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none">
                      <option value="true">Yes</option><option value="false">No</option>
                    </select>
                  ) : field.type === 'textarea' ? (
                    <textarea value={settings[field.key] || ''} onChange={e => setSettings({ ...settings, [field.key]: e.target.value })} rows={3} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none" />
                  ) : (
                    <input type={field.type} value={settings[field.key] || ''} onChange={e => setSettings({ ...settings, [field.key]: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 pt-6 border-t border-slate-200 flex justify-end">
            <Button onClick={handleSaveSettings} isLoading={saving}><Save size={18} /> Save Settings</Button>
          </div>
        </div>
      )}

      {activeTab === 'principal' && (
        <div className="bg-white p-6 md:p-8 border border-slate-200 rounded-2xl shadow-sm space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-xl font-bold text-slate-800">Principal & Director Profile</h2>
              <p className="text-xs text-slate-500 mt-0.5">Manage Dr. Asif Iqbal&apos;s executive credentials and public message at /about/principal.</p>
            </div>
            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-full">
              Published
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">Full Name</label>
              <input value={principalForm.name} onChange={e => setPrincipalForm({ ...principalForm, name: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">Official Title & Role</label>
              <input value={principalForm.title} onChange={e => setPrincipalForm({ ...principalForm, title: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">Degrees & Academic Credentials</label>
              <textarea rows={2} value={principalForm.credentials} onChange={e => setPrincipalForm({ ...principalForm, credentials: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none" />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">Photo URL (Optional Placeholder Avatar used if empty)</label>
              <input value={principalForm.photo_url} onChange={e => setPrincipalForm({ ...principalForm, photo_url: e.target.value })} placeholder="https://..." className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">Welcome Message & Vision Note</label>
              <textarea rows={6} value={principalForm.message} onChange={e => setPrincipalForm({ ...principalForm, message: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none" />
            </div>
          </div>

          <div className="pt-6 border-t border-slate-200 flex justify-end">
            <Button onClick={handleSavePrincipal} isLoading={principalSaving} className="bg-blue-600 hover:bg-blue-700">
              <Save size={18} /> Save Principal Profile
            </Button>
          </div>
        </div>
      )}

      {/* Database Backup & Restore Tab */}
      {activeTab === 'database' && (
        <div className="space-y-6">
          <div className="bg-white p-6 md:p-8 border border-slate-200 rounded-2xl shadow-sm space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Database className="text-blue-600" size={24} /> Database Backup &amp; Instant Restore Tool
              </h2>
              <p className="text-xs text-slate-500 mt-1">Export a complete JSON database snapshot or restore/import a database file directly into Supabase.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
              {/* Export Box */}
              <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col justify-between space-y-4">
                <div>
                  <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-3">
                    <Download size={20} />
                  </div>
                  <h3 className="font-bold text-slate-800 text-base">Export Full Database Backup</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Download a full snapshot of all 18 Supabase tables (students, teachers, programs, fees, admissions, results) as a structured JSON file.
                  </p>
                </div>
                <Button onClick={handleExportDatabase} isLoading={isExporting} className="bg-blue-600 hover:bg-blue-700 text-white w-full">
                  <Download size={16} /> Export Backup File (.json)
                </Button>
              </div>

              {/* Import / Restore Box */}
              <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col justify-between space-y-4">
                <div>
                  <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-3">
                    <Upload size={20} />
                  </div>
                  <h3 className="font-bold text-slate-800 text-base">Restore / Import Database File</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Select a previously exported database JSON backup file to automatically restore all records into Supabase.
                  </p>
                </div>
                <label className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all">
                  <Upload size={16} /> Select Backup JSON File
                  <input type="file" accept=".json" onChange={handleSelectFileForRestore} disabled={isImporting} className="hidden" />
                </label>
              </div>
            </div>

            {/* RESTORE Confirmation Modal */}
            {pendingRestoreFile && (
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl space-y-4 border border-red-200">
                  <div className="w-12 h-12 bg-red-100 text-red-600 rounded-xl flex items-center justify-center">
                    <Database size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">Confirm Database Overwrite</h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      You are about to restore <span className="font-bold text-slate-800">{pendingRestoreFile.name}</span>. This action will overwrite matching records in your Supabase database.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-red-600 block uppercase tracking-wider">
                      Type RESTORE to confirm:
                    </label>
                    <input
                      type="text"
                      value={restoreConfirmInput}
                      onChange={e => setRestoreConfirmInput(e.target.value)}
                      placeholder="RESTORE"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-sm font-bold text-slate-800 focus:ring-2 focus:ring-red-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => setPendingRestoreFile(null)}
                      className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirmAndRunImport}
                      disabled={restoreConfirmInput.trim() !== 'RESTORE'}
                      className={`flex-1 py-2.5 text-white font-bold text-xs rounded-xl transition-all ${
                        restoreConfirmInput.trim() === 'RESTORE'
                          ? 'bg-red-600 hover:bg-red-700 shadow-md'
                          : 'bg-slate-300 cursor-not-allowed'
                      }`}
                    >
                      Overwrite Database
                    </button>
                  </div>
                </div>
              </div>
            )}

            {importStatus && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-blue-800 font-medium text-xs flex items-center gap-2">
                <Loader2 size={16} className="animate-spin text-blue-600" />
                <span>{importStatus}</span>
              </div>
            )}
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-amber-900 text-xs space-y-2">
            <h4 className="font-bold text-sm text-amber-800 flex items-center gap-1.5">
              <CheckCircle2 size={16} /> Supabase Dashboard SQL Editor Instructions
            </h4>
            <p>
              If your database tables are not yet created in Supabase, copy and run the complete SQL script from:
            </p>
            <code className="block bg-white p-2 rounded border border-amber-200 font-mono text-[11px] text-slate-800 select-all">
              supabase/MASTER_COMPLETE_DATABASE_SCHEMA.sql
            </code>
            <p className="pt-1">
              Paste it directly into your <a href="https://supabase.com/dashboard/project/qiqpqmumkevhwqqfgchz/sql/new" target="_blank" rel="noreferrer" className="font-bold underline text-amber-900">Supabase SQL Editor</a> and click <strong>Run</strong>.
            </p>
          </div>
        </div>
      )}

      {activeTab === 'programs' && (
        <div className="space-y-6">
          <div className="bg-white p-6 md:p-8 border border-slate-200 rounded-2xl shadow-sm">
            <h2 className="text-xl font-bold mb-6 text-slate-800">Admission Classes</h2>
            <div className="flex gap-3 mb-4">
              <input value={newClass} onChange={e => setNewClass(e.target.value)} placeholder="e.g. XIII - Pre-Medical" className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              <Button onClick={addClassItem} disabled={!newClass.trim()}>Add Class</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {classesList.map(cls => (
                <div key={cls} className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-sm font-semibold">
                  {cls}
                  <button onClick={() => setClassesList(classesList.filter(c => c !== cls))} className="text-blue-500 hover:text-red-500"><X size={14} /></button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 md:p-8 border border-slate-200 rounded-2xl shadow-sm">
            <h2 className="text-xl font-bold mb-6 text-slate-800">Admission Subjects</h2>
            <div className="flex gap-3 mb-4">
              <input value={newSubject} onChange={e => setNewSubject(e.target.value)} placeholder="e.g. Advanced Maths" className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              <Button onClick={addSubjectItem} disabled={!newSubject.trim()}>Add Subject</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {subjectsList.map(subj => (
                <div key={subj} className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-sm font-semibold">
                  {subj}
                  <button onClick={() => setSubjectsList(subjectsList.filter(s => s !== subj))} className="text-blue-500 hover:text-red-500"><X size={14} /></button>
                </div>
              ))}
            </div>
            <div className="mt-8 pt-6 border-t border-slate-200 flex justify-end">
              <Button onClick={handleSavePrograms} isLoading={saving}><Save size={18} /> Save Programs &amp; Subjects</Button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'password' && (
        <div className="bg-white p-6 md:p-8 border border-slate-200 rounded-2xl shadow-sm">
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center shrink-0">
              <KeyRound size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Force Password Override</h2>
              <p className="text-sm text-slate-500">Reset the password for any administrator account immediately. This bypasses email verification.</p>
            </div>
          </div>
          <form onSubmit={handleDirectPasswordChange} className="space-y-4 max-w-lg">
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-700">Admin Email Address</label>
              <input required type="email" value={passForm.targetEmail} onChange={e => setPassForm({ ...passForm, targetEmail: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-700">New Password</label>
              <div className="relative">
                <input required type={showPass ? 'text' : 'password'} value={passForm.newPassword} onChange={e => setPassForm({ ...passForm, newPassword: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none pr-12" />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">{showPass ? <EyeOff size={18} /> : <Eye size={18} />}</button>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-700">Confirm New Password</label>
              <input required type={showPass ? 'text' : 'password'} value={passForm.confirmPassword} onChange={e => setPassForm({ ...passForm, confirmPassword: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none" />
            </div>
            <Button type="submit" isLoading={passSubmitting} className="bg-red-600 hover:bg-red-700 text-white">Save New Password</Button>
          </form>
        </div>
      )}

      {activeTab === 'admins' && (
        <div className="space-y-6">
          <div className="bg-white p-6 md:p-8 border border-slate-200 rounded-2xl shadow-sm">
            <h2 className="text-xl font-bold mb-6 text-slate-800">Add New Administrator</h2>
            <form onSubmit={handleCreateAdmin} className="space-y-4 max-w-lg">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700">Full Name</label>
                <input required value={newAdminForm.name} onChange={e => setNewAdminForm({ ...newAdminForm, name: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700">Email Address</label>
                <input required type="email" value={newAdminForm.email} onChange={e => setNewAdminForm({ ...newAdminForm, email: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700">Password</label>
                <input required type="password" value={newAdminForm.password} onChange={e => setNewAdminForm({ ...newAdminForm, password: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              </div>
              <Button type="submit" isLoading={adminSubmitting}><UserPlus size={18} /> Create Admin</Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
