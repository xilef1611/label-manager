import { Label } from '../lib/api';
import CourierBadge from './CourierBadge';
import StatusBadge from './StatusBadge';

interface Props {
  label: Label;
  selected: boolean;
  onSelect: (id: string, checked: boolean) => void;
  onDelete: (id: string) => void;
}

export default function LabelCard({ label, selected, onSelect, onDelete }: Props) {
  const addr = `${label.recipient_street} ${label.recipient_street_number}, ${label.recipient_postal_code} ${label.recipient_city}, ${label.recipient_country}`;

  return (
    <div className={`card p-4 flex gap-3 transition-all ${selected ? 'ring-2 ring-orange-400' : ''}`}>
      <input
        type="checkbox"
        checked={selected}
        onChange={e => onSelect(label.id, e.target.checked)}
        className="mt-1 h-4 w-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-gray-900 text-sm">
                {label.recipient_company ? `${label.recipient_company} – ` : ''}{label.recipient_name}
              </span>
              {label.order_ref && (
                <span className="text-xs text-gray-400">#{label.order_ref}</span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-0.5 truncate">{addr}</p>
            {label.recipient_phone && (
              <p className="text-xs text-gray-400">{label.recipient_phone}</p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <CourierBadge courier={label.courier} />
            <StatusBadge status={label.status} />
          </div>
        </div>

        {label.error_message && (
          <p className="mt-1 text-xs text-red-600 bg-red-50 rounded px-2 py-1">{label.error_message}</p>
        )}

        <div className="flex items-center justify-between mt-2">
          <div className="flex gap-3 text-xs text-gray-400">
            {label.weight_kg && <span>{label.weight_kg} kg</span>}
            <span className="capitalize">{label.source}</span>
            <span>{new Date(label.created_at).toLocaleDateString('de-AT')}</span>
          </div>
          <button
            onClick={() => onDelete(label.id)}
            className="text-xs text-red-500 hover:text-red-700 transition-colors"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}
