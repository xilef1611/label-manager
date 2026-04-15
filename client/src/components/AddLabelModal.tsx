import { useState } from 'react';
import toast from 'react-hot-toast';
import { createLabel, SenderProfile, Courier } from '../lib/api';

interface Props {
  senders: SenderProfile[];
  defaultSenderId?: number;
  onClose: () => void;
  onCreated: () => void;
}

const COURIERS: { value: Courier; label: string }[] = [
  { value: 'post-at', label: 'Post.at (Austrian Post)' },
  { value: 'dpd',     label: 'DPD (myDPD.at)' },
  { value: 'dhl',     label: 'DHL' },
  { value: 'ups',     label: 'UPS' },
];

const EU_COUNTRIES = [
  { code: 'AT', name: 'Austria' }, { code: 'DE', name: 'Germany' },
  { code: 'CH', name: 'Switzerland' }, { code: 'IT', name: 'Italy' },
  { code: 'FR', name: 'France' }, { code: 'NL', name: 'Netherlands' },
  { code: 'BE', name: 'Belgium' }, { code: 'PL', name: 'Poland' },
  { code: 'CZ', name: 'Czech Republic' }, { code: 'SK', name: 'Slovakia' },
  { code: 'HU', name: 'Hungary' }, { code: 'SI', name: 'Slovenia' },
  { code: 'HR', name: 'Croatia' }, { code: 'US', name: 'United States' },
];

export default function AddLabelModal({ senders, defaultSenderId, onClose, onCreated }: Props) {
  const [form, setForm] = useState({
    courier: 'post-at' as Courier,
    sender_profile_id: defaultSenderId || (senders[0]?.id ?? ''),
    order_ref: '',
    recipient_company: '',
    recipient_name: '',
    recipient_phone: '',
    recipient_street: '',
    recipient_street_number: '',
    recipient_address_supplement: '',
    recipient_postal_code: '',
    recipient_city: '',
    recipient_country: 'AT',
    weight_kg: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  const set = (k: string, v: string | number) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createLabel({
        ...form,
        sender_profile_id: Number(form.sender_profile_id) || undefined,
        weight_kg: form.weight_kg ? Number(form.weight_kg) : undefined,
      });
      toast.success('Label added to queue');
      onCreated();
      onClose();
    } catch {
      toast.error('Failed to create label');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Add Label to Queue</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Courier + Sender row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Courier *</label>
              <select className="input" value={form.courier} onChange={e => set('courier', e.target.value)}>
                {COURIERS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Sender Profile *</label>
              <select className="input" value={form.sender_profile_id} onChange={e => set('sender_profile_id', e.target.value)}>
                {senders.map(s => <option key={s.id} value={s.id}>{s.company || s.name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="label">Order Reference</label>
            <input className="input" placeholder="e.g. #1234" value={form.order_ref} onChange={e => set('order_ref', e.target.value)} />
          </div>

          {/* Recipient */}
          <div className="border-t border-gray-100 pt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Recipient (Empfänger)</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Company</label>
                <input className="input" placeholder="Company GmbH" value={form.recipient_company} onChange={e => set('recipient_company', e.target.value)} />
              </div>
              <div>
                <label className="label">Contact Name *</label>
                <input className="input" required placeholder="Max Mustermann" value={form.recipient_name} onChange={e => set('recipient_name', e.target.value)} />
              </div>
              <div>
                <label className="label">Street *</label>
                <input className="input" required placeholder="Musterstraße" value={form.recipient_street} onChange={e => set('recipient_street', e.target.value)} />
              </div>
              <div>
                <label className="label">Number *</label>
                <input className="input" required placeholder="12a" value={form.recipient_street_number} onChange={e => set('recipient_street_number', e.target.value)} />
              </div>
              <div className="col-span-2">
                <label className="label">Address Supplement</label>
                <input className="input" placeholder="Apt, Floor, Building..." value={form.recipient_address_supplement} onChange={e => set('recipient_address_supplement', e.target.value)} />
              </div>
              <div>
                <label className="label">Postal Code *</label>
                <input className="input" required placeholder="1010" value={form.recipient_postal_code} onChange={e => set('recipient_postal_code', e.target.value)} />
              </div>
              <div>
                <label className="label">City *</label>
                <input className="input" required placeholder="Wien" value={form.recipient_city} onChange={e => set('recipient_city', e.target.value)} />
              </div>
              <div>
                <label className="label">Country</label>
                <select className="input" value={form.recipient_country} onChange={e => set('recipient_country', e.target.value)}>
                  {EU_COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Phone</label>
                <input className="input" placeholder="+43 123 456789" value={form.recipient_phone} onChange={e => set('recipient_phone', e.target.value)} />
              </div>
            </div>
          </div>

          {/* Package */}
          <div className="border-t border-gray-100 pt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Package</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Weight (kg)</label>
                <input className="input" type="number" step="0.1" min="0.1" placeholder="1.5" value={form.weight_kg} onChange={e => set('weight_kg', e.target.value)} />
              </div>
              <div>
                <label className="label">Notes</label>
                <input className="input" placeholder="Fragile, etc." value={form.notes} onChange={e => set('notes', e.target.value)} />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Adding...' : 'Add to Queue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
