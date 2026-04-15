import { clsx } from 'clsx';

const STATUS_META: Record<string, { label: string; color: string }> = {
  pending:    { label: 'Pending',    color: 'bg-gray-100 text-gray-600' },
  processing: { label: 'Processing', color: 'bg-blue-100 text-blue-700' },
  done:       { label: 'Done',       color: 'bg-green-100 text-green-700' },
  error:      { label: 'Error',      color: 'bg-red-100 text-red-700' },
};

export default function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status] || { label: status, color: 'bg-gray-100 text-gray-600' };
  return <span className={clsx('badge', meta.color)}>{meta.label}</span>;
}
