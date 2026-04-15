import { clsx } from 'clsx';
import type { Courier } from '../lib/api';

const COURIER_META: Record<Courier, { label: string; color: string }> = {
  'post-at': { label: 'Post.at',  color: 'bg-yellow-100 text-yellow-800' },
  'dpd':     { label: 'DPD',      color: 'bg-red-100 text-red-800' },
  'dhl':     { label: 'DHL',      color: 'bg-amber-100 text-amber-800' },
  'ups':     { label: 'UPS',      color: 'bg-orange-100 text-orange-800' },
};

export default function CourierBadge({ courier }: { courier: Courier }) {
  const meta = COURIER_META[courier] || { label: courier, color: 'bg-gray-100 text-gray-700' };
  return <span className={clsx('badge', meta.color)}>{meta.label}</span>;
}
