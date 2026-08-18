import type { OrderDto, RestaurantTable } from '../api/types';

function elapsedLabel(createdAt: string, now: number): string {
  const minutes = Math.max(0, Math.floor((now - new Date(createdAt).getTime()) / 60000));
  return minutes < 1 ? 'just now' : `${minutes} min`;
}

interface TileVisual {
  label: string;
  sublabel?: string;
  className: string;
}

function visualFor(table: RestaurantTable, order: OrderDto | undefined, now: number): TileVisual {
  if (order) {
    const itemCount = order.items.reduce((sum, i) => sum + i.quantity, 0);
    const itemsLabel = `${itemCount} item${itemCount === 1 ? '' : 's'} · ${elapsedLabel(order.createdAt, now)}`;
    if (order.status === 'ready') {
      return { label: 'Ready!', sublabel: itemsLabel, className: 'border-success bg-success/10 pulse-ready' };
    }
    if (order.status === 'served') {
      return { label: 'Awaiting payment', sublabel: itemsLabel, className: 'border-primary bg-primary/5' };
    }
    return { label: 'Cooking', sublabel: itemsLabel, className: 'border-cooking bg-cooking/10' };
  }
  switch (table.status) {
    case 'needs_cleaning':
      return { label: 'Needs cleaning', className: 'border-muted bg-stone-100' };
    case 'reserved':
      return { label: 'Reserved', className: 'border-reserved bg-reserved/10' };
    default:
      return { label: 'Free', className: 'border-border bg-card' };
  }
}

export function TableTile({
  table,
  order,
  now,
  onTap,
}: {
  table: RestaurantTable;
  order: OrderDto | undefined;
  now: number;
  onTap: () => void;
}) {
  const visual = visualFor(table, order, now);
  return (
    <button
      onClick={onTap}
      className={`flex flex-col items-center justify-center gap-1 rounded-lg border-2 px-3 py-6 text-center ${visual.className}`}
    >
      <span className="font-heading text-2xl font-bold">{table.number}</span>
      <span className="text-sm font-semibold">{visual.label}</span>
      {visual.sublabel && <span className="text-xs text-muted">{visual.sublabel}</span>}
    </button>
  );
}
