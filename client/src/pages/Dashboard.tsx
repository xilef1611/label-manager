import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  getLabels, getSenders, deleteLabel, deleteLabels, startAutomation, stopAutomation, getAutomationStatus,
  Label, SenderProfile, Courier
} from '../lib/api';
import LabelCard from '../components/LabelCard';
import AddLabelModal from '../components/AddLabelModal';

const COURIERS: { value: Courier | ''; label: string }[] = [
  { value: '', label: 'All Couriers' },
  { value: 'post-at', label: 'Post.at' },
  { value: 'dpd',     label: 'DPD' },
  { value: 'dhl',     label: 'DHL' },
  { value: 'ups',     label: 'UPS' },
];

export default function Dashboard() {
  const [labels, setLabels]     = useState<Label[]>([]);
  const [senders, setSenders]   = useState<SenderProfile[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showAdd, setShowAdd]   = useState(false);
  const [filterCourier, setFilterCourier] = useState<Courier | ''>('');
  const [filterStatus, setFilterStatus]   = useState('pending');
  const [automation, setAutomation]       = useState<{ active: boolean; session?: any }>({ active: false });
  const [selectedSender, setSelectedSender] = useState<number | ''>('');
  const [loading, setLoading]   = useState(true);

  const loadData = useCallback(async () => {
    const [lbls, snds] = await Promise.all([
      getLabels({ status: filterStatus || undefined, courier: filterCourier || undefined }),
      getSenders(),
    ]);
    setLabels(lbls);
    setSenders(snds);
    const def = snds.find(s => s.is_default);
    if (def && !selectedSender) setSelectedSender(def.id);
    setLoading(false);
  }, [filterStatus, filterCourier]);

  const checkAutomation = useCallback(async () => {
    const status = await getAutomationStatus();
    setAutomation(status);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Poll automation status when active
  useEffect(() => {
    checkAutomation();
    if (!automation.active) return;
    const interval = setInterval(() => { checkAutomation(); loadData(); }, 3000);
    return () => clearInterval(interval);
  }, [automation.active, checkAutomation, loadData]);

  const toggleSelect = (id: string, checked: boolean) => {
    setSelected(prev => {
      const next = new Set(prev);
      checked ? next.add(id) : next.delete(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === labels.length) setSelected(new Set());
    else setSelected(new Set(labels.map(l => l.id)));
  };

  const handleDelete = async (id: string) => {
    await deleteLabel(id);
    toast.success('Label removed');
    setSelected(prev => { const n = new Set(prev); n.delete(id); return n; });
    loadData();
  };

  const handleDeleteSelected = async () => {
    if (!selected.size) return;
    await deleteLabels(Array.from(selected));
    toast.success(`${selected.size} label(s) removed`);
    setSelected(new Set());
    loadData();
  };

  const handleStart = async () => {
    if (!selected.size) { toast.error('Select at least one label'); return; }
    if (!selectedSender) { toast.error('Select a sender profile'); return; }
    try {
      await startAutomation(Array.from(selected), Number(selectedSender));
      toast.success('Automation started — browser will open');
      setSelected(new Set());
      await checkAutomation();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to start automation');
    }
  };

  const handleStop = async () => {
    await stopAutomation();
    toast('Automation stopped');
    checkAutomation();
  };

  const pendingCount = labels.filter(l => l.status === 'pending').length;
  const doneCount    = labels.filter(l => l.status === 'done').length;

  return (
    <div className="space-y-5">
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Pending', value: labels.filter(l => l.status === 'pending').length, color: 'text-gray-700' },
          { label: 'Processing', value: labels.filter(l => l.status === 'processing').length, color: 'text-blue-600' },
          { label: 'Done', value: labels.filter(l => l.status === 'done').length, color: 'text-green-600' },
          { label: 'Errors', value: labels.filter(l => l.status === 'error').length, color: 'text-red-600' },
        ].map(s => (
          <div key={s.label} className="card p-4 text-center">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Automation panel */}
      {automation.active ? (
        <div className="card p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                <span className="font-medium text-blue-900 text-sm">Automation running...</span>
              </div>
              <p className="text-xs text-blue-600 mt-0.5">Browser is filling out courier forms. Review the cart when done, then pay manually.</p>
            </div>
            <button onClick={handleStop} className="btn-danger text-sm">Stop</button>
          </div>
        </div>
      ) : (
        <div className="card p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[200px]">
              <label className="label">Sender Profile for Automation</label>
              <select className="input" value={selectedSender} onChange={e => setSelectedSender(Number(e.target.value))}>
                <option value="">-- select sender --</option>
                {senders.map(s => <option key={s.id} value={s.id}>{s.company ? `${s.company} (${s.name})` : s.name}</option>)}
              </select>
            </div>
            <div className="flex gap-2 pt-4">
              <button
                onClick={handleStart}
                disabled={!selected.size || !selectedSender}
                className="btn-primary"
              >
                ▶ Run Automation ({selected.size} selected)
              </button>
            </div>
          </div>
          {selected.size > 0 && (
            <p className="text-xs text-gray-500 mt-2">
              Will open courier website(s) and fill forms for {selected.size} label(s). Browser stays open for your review.
            </p>
          )}
        </div>
      )}

      {/* Filters + actions */}
      <div className="flex flex-wrap items-center gap-3">
        <select className="input w-auto" value={filterCourier} onChange={e => setFilterCourier(e.target.value as Courier | '')}>
          {COURIERS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <select className="input w-auto" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="done">Done</option>
          <option value="error">Error</option>
        </select>
        <div className="ml-auto flex gap-2">
          {selected.size > 0 && (
            <button onClick={handleDeleteSelected} className="btn-danger">
              Delete ({selected.size})
            </button>
          )}
          <button onClick={selectAll} className="btn-secondary">
            {selected.size === labels.length && labels.length > 0 ? 'Deselect All' : 'Select All'}
          </button>
          <button onClick={() => setShowAdd(true)} className="btn-primary">
            + Add Label
          </button>
        </div>
      </div>

      {/* Label list */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : labels.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-4xl mb-3">📭</div>
          <p className="text-gray-500 font-medium">No labels in queue</p>
          <p className="text-sm text-gray-400 mt-1">Add labels manually or connect your shop via API</p>
          <button onClick={() => setShowAdd(true)} className="btn-primary mt-4">+ Add First Label</button>
        </div>
      ) : (
        <div className="space-y-2">
          {labels.map(label => (
            <LabelCard
              key={label.id}
              label={label}
              selected={selected.has(label.id)}
              onSelect={toggleSelect}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {showAdd && (
        <AddLabelModal
          senders={senders}
          defaultSenderId={senders.find(s => s.is_default)?.id}
          onClose={() => setShowAdd(false)}
          onCreated={loadData}
        />
      )}
    </div>
  );
}
