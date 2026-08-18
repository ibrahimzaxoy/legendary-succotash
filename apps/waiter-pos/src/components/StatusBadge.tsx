import type { OrderItemStatus } from '../api/types';

const STYLES: Record<OrderItemStatus, { label: string; className: string }> = {
  queued: { label: 'Queued', className: 'bg-stone-100 text-muted' },
  cooking: { label: 'Cooking', className: 'bg-cooking/15 text-cooking' },
  ready: { label: 'Ready', className: 'bg-success/15 text-success' },
  served: { label: 'Served', className: 'bg-stone-100 text-muted' },
  cancelled: { label: 'Cancelled', className: 'bg-error/15 text-error' },
};

export function StatusBadge({ status }: { status: OrderItemStatus }) {
  const { label, className } = STYLES[status];
  return <span className={`rounded-pill px-2.5 py-1 text-xs font-semibold ${className}`}>{label}</span>;
}
