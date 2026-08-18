import type { MenuItem } from '../api/types';
import { formatMoney } from '../utils/money';

export function MenuItemCard({ item, onSelect }: { item: MenuItem; onSelect: (item: MenuItem) => void }) {
  return (
    <button
      onClick={() => onSelect(item)}
      className="flex w-full items-start gap-3 rounded-lg border border-border bg-card p-3 text-left active:bg-stone-50"
    >
      {item.imageUrl ? (
        <img src={item.imageUrl} alt="" className="h-16 w-16 shrink-0 rounded-lg object-cover" />
      ) : (
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-primary-light text-2xl">🍽️</div>
      )}
      <div className="min-w-0 flex-1">
        <h3 className="font-heading font-semibold leading-snug">{item.name}</h3>
        {item.description && <p className="mt-0.5 line-clamp-2 text-sm text-muted">{item.description}</p>}
        <p className="mt-1 font-medium text-primary">{formatMoney(item.basePrice)}</p>
      </div>
    </button>
  );
}
