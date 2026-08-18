import { useMemo, useState } from 'react';
import type { MenuItem, MenuItemVariant, ModifierGroup, ModifierOption } from '../api/types';
import { computeItemUnitPrice, formatMoney } from '../utils/money';
import type { CartLine } from '../utils/cart';

export function ItemDetailSheet({
  item,
  onClose,
  onAdd,
}: {
  item: MenuItem;
  onClose: () => void;
  onAdd: (line: Omit<CartLine, 'lineId'>) => void;
}) {
  const defaultVariant = item.variants.find((v) => v.isDefault) ?? item.variants[0] ?? null;
  const [variant, setVariant] = useState<MenuItemVariant | null>(defaultVariant);
  const [selectedByGroup, setSelectedByGroup] = useState<Record<string, ModifierOption[]>>({});
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');

  const toggleOption = (group: ModifierGroup, option: ModifierOption) => {
    setSelectedByGroup((prev) => {
      const current = prev[group.id] ?? [];
      const isSelected = current.some((o) => o.id === option.id);
      const singleSelect = group.maxSelect <= 1;
      let next: ModifierOption[];
      if (isSelected) next = current.filter((o) => o.id !== option.id);
      else if (singleSelect) next = [option];
      else if (current.length >= group.maxSelect) next = current;
      else next = [...current, option];
      return { ...prev, [group.id]: next };
    });
  };

  const unmetRequiredGroups = item.modifierGroups.filter(
    (g) => g.isRequired && (selectedByGroup[g.id]?.length ?? 0) < g.minSelect,
  );

  const allModifiers = useMemo(() => Object.values(selectedByGroup).flat(), [selectedByGroup]);
  const unitPrice = computeItemUnitPrice(
    item.basePrice,
    variant?.priceDelta,
    allModifiers.map((m) => m.priceDelta),
  );

  const handleAdd = () => {
    if (unmetRequiredGroups.length > 0) return;
    onAdd({ menuItem: item, variant, modifiers: allModifiers, quantity, notes: notes.trim(), unitPrice });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-30 flex items-end bg-black/40" onClick={onClose}>
      <div
        className="max-h-[85vh] w-full overflow-y-auto rounded-t-lg bg-card p-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-pill bg-border" />
        <h2 className="font-heading text-xl font-semibold">{item.name}</h2>
        {item.description && <p className="mt-1 text-sm text-muted">{item.description}</p>}

        {item.variants.length > 0 && (
          <fieldset className="mt-5">
            <legend className="text-sm font-semibold">Size</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {item.variants.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setVariant(v)}
                  className={`rounded-pill border px-3.5 py-1.5 text-sm font-medium ${
                    variant?.id === v.id ? 'border-primary bg-primary-light text-primary-dark' : 'border-border text-ink'
                  }`}
                >
                  {v.name}
                  {Number(v.priceDelta) > 0 && ` (+${formatMoney(v.priceDelta)})`}
                </button>
              ))}
            </div>
          </fieldset>
        )}

        {item.modifierGroups.map((group) => (
          <fieldset key={group.id} className="mt-5">
            <legend className="text-sm font-semibold">
              {group.name}
              {group.isRequired && <span className="ml-1 text-error">*</span>}
              {group.maxSelect > 1 && <span className="ml-1 font-normal text-muted">(up to {group.maxSelect})</span>}
            </legend>
            <div className="mt-2 flex flex-col gap-2">
              {group.options.map((option) => {
                const checked = (selectedByGroup[group.id] ?? []).some((o) => o.id === option.id);
                return (
                  <label
                    key={option.id}
                    className={`flex items-center justify-between rounded-lg border px-3 py-2.5 text-sm ${
                      checked ? 'border-primary bg-primary-light/40' : 'border-border'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <input
                        type={group.maxSelect <= 1 ? 'radio' : 'checkbox'}
                        checked={checked}
                        onChange={() => toggleOption(group, option)}
                        className="accent-primary"
                      />
                      {option.name}
                    </span>
                    {Number(option.priceDelta) > 0 && <span className="text-muted">+{formatMoney(option.priceDelta)}</span>}
                  </label>
                );
              })}
            </div>
          </fieldset>
        ))}

        <fieldset className="mt-5">
          <legend className="text-sm font-semibold">Notes for the kitchen</legend>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. no onions"
            rows={2}
            className="mt-2 w-full rounded-lg border border-border p-2.5 text-sm outline-primary"
          />
        </fieldset>

        <div className="mt-6 flex items-center gap-3">
          <div className="flex items-center rounded-pill border border-border">
            <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="px-3.5 py-2 text-lg font-medium">
              −
            </button>
            <span className="min-w-6 text-center font-medium">{quantity}</span>
            <button onClick={() => setQuantity((q) => q + 1)} className="px-3.5 py-2 text-lg font-medium">
              +
            </button>
          </div>
          <button
            onClick={handleAdd}
            disabled={unmetRequiredGroups.length > 0}
            className="flex-1 rounded-pill bg-primary py-3 font-semibold text-white disabled:opacity-40"
          >
            Add · {formatMoney(unitPrice * quantity)}
          </button>
        </div>
        {unmetRequiredGroups.length > 0 && (
          <p className="mt-2 text-center text-xs text-error">Choose {unmetRequiredGroups.map((g) => g.name).join(', ')}</p>
        )}
      </div>
    </div>
  );
}
