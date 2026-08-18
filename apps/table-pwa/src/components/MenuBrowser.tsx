import { useMemo, useState } from 'react';
import type { MenuCategory, MenuItem } from '../api/types';
import { CategoryTabs } from './CategoryTabs';
import { MenuItemCard } from './MenuItemCard';
import { ItemDetailSheet } from './ItemDetailSheet';
import { useCart } from '../state/CartContext';
import { formatMoney } from '../utils/money';

export function MenuBrowser({
  categories,
  items,
  onOpenCart,
}: {
  categories: MenuCategory[];
  items: MenuItem[];
  onOpenCart: () => void;
}) {
  const [activeCategoryId, setActiveCategoryId] = useState(categories[0]?.id ?? '');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const { itemCount, subtotal } = useCart();

  const itemsByCategory = useMemo(() => items.filter((i) => i.categoryId === activeCategoryId), [items, activeCategoryId]);

  if (categories.length === 0) {
    return <p className="p-6 text-center text-muted">This branch hasn’t published a dine-in menu yet.</p>;
  }

  return (
    <div className="pb-24">
      <CategoryTabs categories={categories} activeId={activeCategoryId} onSelect={setActiveCategoryId} />

      <div className="flex flex-col gap-3 p-4">
        {itemsByCategory.length === 0 && <p className="py-8 text-center text-muted">Nothing in this category right now.</p>}
        {itemsByCategory.map((item) => (
          <MenuItemCard key={item.id} item={item} onSelect={setSelectedItem} />
        ))}
      </div>

      {selectedItem && <ItemDetailSheet item={selectedItem} onClose={() => setSelectedItem(null)} />}

      {itemCount > 0 && (
        <button
          onClick={onOpenCart}
          className="fixed bottom-4 left-1/2 flex w-[calc(100%-2rem)] max-w-[calc(theme(maxWidth.app)-2rem)] -translate-x-1/2 items-center justify-between rounded-pill bg-primary px-5 py-3.5 text-white shadow-lg"
        >
          <span className="font-semibold">
            View cart · {itemCount} item{itemCount > 1 ? 's' : ''}
          </span>
          <span className="font-semibold">{formatMoney(subtotal)}</span>
        </button>
      )}
    </div>
  );
}
