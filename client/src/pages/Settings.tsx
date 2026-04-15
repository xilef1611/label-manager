import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { getSenders, createSender, updateSender, deleteSender, SenderProfile } from '../lib/api';
import axios from 'axios';

const EMPTY: Partial<SenderProfile> = {
  name: '', company: '', street: '', street_number: '', address_supplement: '',
  postal_code: '', city: '', country: 'AT', phone: '', email: '', is_default: 0,
};

export default function SettingsPage() {
  const [profiles, setProfiles] = useState<SenderProfile[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [editing, setEditing]   = useState<Partial<SenderProfile> | null>(null);
  const [isNew, setIsNew]       = useState(false);
  const [saving, setSaving]     = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  const load = async () => {
    setProfiles(await getSenders());
    try {
      const res = await axios.get('/api/settings');
      setSettings(res.data || {});
    } catch (e) {
      console.error('Failed to load settings', e);
    }
  };
  
  useEffect(() => { load(); }, []);

  const handleEdit = (p: SenderProfile) => { setEditing({ ...p }); setIsNew(false); };
  const handleNew  = () => { setEditing({ ...EMPTY }); setIsNew(true); };

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      if (isNew) await createSender(editing);
      else await updateSender(editing.id!, editing);
      toast.success('Saved');
      setEditing(null);
      load();
    } catch { toast.error('Save failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this sender profile?')) return;
    await deleteSender(id);
    toast.success('Deleted');
    load();
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      await axios.post('/api/settings', settings);
      toast.success('Settings saved');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const set = (k: keyof SenderProfile, v: any) => setEditing(prev => prev ? { ...prev, [k]: v } : prev);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Settings</h1>
      </div>

      <div className="card p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Automation Credentials</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="font-medium text-gray-800">Post.at Login</h3>
            <p className="text-sm text-gray-500">Enable automatic login for Post.at label creation.</p>
            <div>
              <label className="label">Post.at Username / Email</label>
              <input className="input" value={settings.postat_username || ''} onChange={e => setSettings(s => ({ ...s, postat_username: e.target.value }))} placeholder="email@example.com" />
            </div>
            <div>
              <label className="label">Post.at Password</label>
              <input type="password" className="input" value={settings.postat_password || ''} onChange={e => setSettings(s => ({ ...s, postat_password: e.target.value }))} placeholder="••••••••" />
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="font-medium text-gray-800">DPD Login (Optional)</h3>
            <p className="text-sm text-gray-500">DPD labels are currently created as guest. You can add credentials if needed later.</p>
            {/* Can add DPD settings here in the future */}
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <button onClick={handleSaveSettings} disabled={savingSettings} className="btn-primary">
            {savingSettings ? 'Saving...' : 'Save Global Settings'}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between mt-8 border-t pt-8">
        <h2 className="text-xl font-semibold text-gray-900">Sender Profiles</h2>
        <button onClick={handleNew} className="btn-primary">+ New Profile</button>
      </div>

      {profiles.length === 0 && !editing && (
        <div className="card p-12 text-center">
          <div className="text-4xl mb-3">🏢</div>
          <p className="text-gray-500">No sender profiles yet.</p>
          <button onClick={handleNew} className="btn-primary mt-4">Create First Profile</button>
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {profiles.map(p => (
          <div key={p.id} className={`card p-4 ${p.is_default ? 'border-orange-300 bg-orange-50' : ''}`}>
            {p.is_default && <span className="badge bg-orange-100 text-orange-700 mb-2">Default</span>}
            <div className="font-semibold text-gray-900">{p.company || p.name}</div>
            {p.company && <div className="text-sm text-gray-500">{p.name}</div>}
            <div className="text-sm text-gray-600 mt-1">
              {p.street} {p.street_number}<br />
              {p.postal_code} {p.city}, {p.country}
            </div>
            {p.phone && <div className="text-xs text-gray-400 mt-1">{p.phone}</div>}
            <div className="flex gap-2 mt-3">
              <button onClick={() => handleEdit(p)} className="btn-secondary text-xs px-3 py-1.5">Edit</button>
              <button onClick={() => handleDelete(p.id)} className="btn-ghost text-xs px-3 py-1.5 text-red-500 hover:text-red-700">Delete</button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit / Create form */}
      {editing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">{isNew ? 'New Sender Profile' : 'Edit Sender Profile'}</h2>
              <button onClick={() => setEditing(null)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Contact Name *</label>
                  <input className="input" required value={editing.name || ''} onChange={e => set('name', e.target.value)} placeholder="Max Mustermann" />
                </div>
                <div>
                  <label className="label">Company</label>
                  <input className="input" value={editing.company || ''} onChange={e => set('company', e.target.value)} placeholder="Company GmbH" />
                </div>
                <div>
                  <label className="label">Street *</label>
                  <input className="input" required value={editing.street || ''} onChange={e => set('street', e.target.value)} placeholder="Musterstraße" />
                </div>
                <div>
                  <label className="label">Number *</label>
                  <input className="input" required value={editing.street_number || ''} onChange={e => set('street_number', e.target.value)} placeholder="5" />
                </div>
                <div className="col-span-2">
                  <label className="label">Address Supplement</label>
                  <input className="input" value={editing.address_supplement || ''} onChange={e => set('address_supplement', e.target.value)} placeholder="Top 3, Stiege B..." />
                </div>
                <div>
                  <label className="label">Postal Code *</label>
                  <input className="input" required value={editing.postal_code || ''} onChange={e => set('postal_code', e.target.value)} placeholder="1010" />
                </div>
                <div>
                  <label className="label">City *</label>
                  <input className="input" required value={editing.city || ''} onChange={e => set('city', e.target.value)} placeholder="Wien" />
                </div>
                <div>
                  <label className="label">Country</label>
                  <select className="input" value={editing.country || 'AT'} onChange={e => set('country', e.target.value)}>
                    <option value="AT">Austria</option>
                    <option value="DE">Germany</option>
                    <option value="CH">Switzerland</option>
                  </select>
                </div>
                <div>
                  <label className="label">Phone</label>
                  <input className="input" value={editing.phone || ''} onChange={e => set('phone', e.target.value)} placeholder="+43 1 234 567" />
                </div>
                <div className="col-span-2">
                  <label className="label">Email</label>
                  <input className="input" type="email" value={editing.email || ''} onChange={e => set('email', e.target.value)} placeholder="you@example.com" />
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-orange-500"
                  checked={!!editing.is_default} onChange={e => set('is_default', e.target.checked ? 1 : 0)} />
                <span className="text-sm text-gray-700">Set as default sender</span>
              </label>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setEditing(null)} className="btn-secondary">Cancel</button>
                <button onClick={handleSave} disabled={saving} className="btn-primary">
                  {saving ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
