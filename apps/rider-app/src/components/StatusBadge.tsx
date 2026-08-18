import type { DeliveryStatus } from '../api/types';

const LABELS: Record<DeliveryStatus, string> = {
  assigned: 'New',
  picked_up: 'Picked up',
  en_route: 'On the way',
  delivered: 'Delivered',
  failed: 'Failed',
};

const STYLES: Record<DeliveryStatus, string> = {
  assigned: 'bg-primary/10 text-primary',
  picked_up: 'bg-cooking/10 text-cooking',
  en_route: 'bg-cooking/10 text-cooking',
  delivered: 'bg-success/10 text-success',
  failed: 'bg-error/10 text-error',
};

export function StatusBadge({ status }: { status: DeliveryStatus }) {
  return <span className={`rounded-pill px-2.5 py-0.5 text-xs font-semibold ${STYLES[status]}`}>{LABELS[status]}</span>;
}
