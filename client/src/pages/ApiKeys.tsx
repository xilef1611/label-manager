import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { getApiKeys, createApiKey, deleteApiKey, getSenders, ApiKey, SenderProfile, Courier } from '../lib/api';

const SHOP_TYPES = ['generic', 'woocommerce', 'shopify', 'shopware', 'magento', 'custom'];
const COURIERS: { value: Courier; label: string }[] = [
  { value: 'post-at', label: 'Post.at' },
  { value: 'dpd',     label: 'DPD' },
  { value: 'dhl',     label: 'DHL' },
  { value: 'ups',     label: 'UPS' },
];

export default function ApiKeysPage() {
  const [keys, setKeys]         = useState<ApiKey[]>([]);
  const [senders, setSenders]   = useState<SenderProfile[]>([]);
  const [showNew, setShowNew]   = useState(false);
  const [copied, setCopied]     = useState<number | null>(null);
  const [form, setForm] = useState({
    label: '',
    shop_type: 'generic',
    default_courier: 'post-at' as Courier,
    default_sender_id: '',
  });

  const load = async () => {
    const [k, s] = await Promise.all([getApiKeys(), getSenders()]);
    setKeys(k); setSenders(s);
  };
  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!form.label) { toast.error('Label required'); return; }
    await createApiKey({ ...form, default_sender_id: form.default_sender_id ? Number(form.default_sender_id) : undefined } as any);
    toast.success('API key created');
    setShowNew(false);
    setForm({ label: '', shop_type: 'generic', default_courier: 'post-at', default_sender_id: '' });
    load();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this API key?')) return;
    await deleteApiKey(id);
    toast.success('Deleted');
    load();
  };

  const handleCopy = (key: ApiKey) => {
    navigator.clipboard.writeText(key.key);
    setCopied(key.id);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(null), 2000);
  };

  const webhookBase = `${window.location.protocol}//${window.location.hostname}:3001`;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">API & Webhooks</h1>
        <button onClick={() => setShowNew(true)} className="btn-primary">+ New API Key</button>
      </div>

      {/* Webhook docs */}
      <div className="card p-5 space-y-3">
        <h2 className="font-semibold text-gray-800">Webhook Endpoints</h2>
        <p className="text-sm text-gray-600">Send your shop orders to these endpoints. Labels are created automatically when orders are received.</p>
        <div className="space-y-2">
          {[
            { label: 'Generic (any shop)', path: '/api/webhook/order', note: 'POST with { order: { shipping_address: {...} } }' },
            { label: 'WooCommerce', path: '/api/webhook/woocommerce', note: 'Add as WooCommerce webhook — triggers on order.updated/paid' },
          ].map(ep => (
            <div key={ep.path} className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-700">{ep.label}</span>
              </div>
              <code className="text-xs font-mono text-orange-700 break-all">{webhookBase}{ep.path}</code>
              <p className="text-xs text-gray-500 mt-0.5">{ep.note}</p>
            </div>
          ))}
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
          <strong>Authentication:</strong> Send your API key as the <code>X-API-Key</code> header or <code>?api_key=</code> query parameter.
        </div>
      </div>

      {/* Keys list */}
      {keys.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-gray-500">No API keys yet.</p>
          <button onClick={() => setShowNew(true)} className="btn-primary mt-3">Create First Key</button>
        </div>
      ) : (
        <div className="space-y-3">
          {keys.map(k => (
            <div key={k.id} className="card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{k.label}</span>
                    <span className="badge bg-gray-100 text-gray-600 capitalize">{k.shop_type}</span>
                    <span className="badge bg-orange-100 text-orange-700 capitalize">{k.default_courier}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="text-xs font-mono text-gray-500 truncate max-w-xs">{k.key}</code>
                    <button
                      onClick={() => handleCopy(k)}
                      className="text-xs text-orange-600 hover:text-orange-800 flex-shrink-0"
                    >
                      {copied === k.id ? '✓ Copied' : 'Copy'}
                    </button>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    Created {new Date(k.created_at).toLocaleDateString('de-AT')}
                    {k.last_used_at && ` · Last used ${new Date(k.last_used_at).toLocaleDateString('de-AT')}`}
                  </div>
                </div>
                <button onClick={() => handleDelete(k.id)} className="text-red-500 hover:text-red-700 text-sm">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New key modal */}
      {showNew && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">New API Key</h2>
              <button onClick={() => setShowNew(false)} className="text-gray-400 text-xl">&times;</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="label">Label *</label>
                <input className="input" placeholder="My Shopify Store" value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} />
              </div>
              <div>
                <label className="label">Shop Type</label>
                <select className="input" value={form.shop_type} onChange={e => setForm(f => ({ ...f, shop_type: e.target.value }))}>
                  {SHOP_TYPES.map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Default Courier</label>
                <select className="input" value={form.default_courier} onChange={e => setForm(f => ({ ...f, default_courier: e.target.value as Courier }))}>
                  {COURIERS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Default Sender Profile</label>
                <select className="input" value={form.default_sender_id} onChange={e => setForm(f => ({ ...f, default_sender_id: e.target.value }))}>
                  <option value="">-- none --</option>
                  {senders.map(s => <option key={s.id} value={s.id}>{s.company || s.name}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <button onClick={() => setShowNew(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleCreate} className="btn-primary">Generate Key</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
