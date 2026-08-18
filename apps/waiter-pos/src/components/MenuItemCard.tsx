import type { MenuItem } from '../api/types';
import { formatMoney } from '../utils/money';

export function MenuItemCard({ item, onSelect }: { item: MenuItem; onSelect: (item: MenuItem) => void }) {
  return (
    <button
      onClick={() => onSelect(item)}
      className="flex flex-col items-start gap-1 rounded-lg border border-border bg-card p-3 text-left active:bg-primary-light/30"
    >
      <h3 className="font-heading font-semibold leading-snug">{item.name}</h3>
      {item.description && <p className="line-clamp-2 text-sm text-muted">{item.description}</p>}
      <p className="font-medium text-primary">{formatMoney(item.basePrice)}</p>
    </button>
  );
}
