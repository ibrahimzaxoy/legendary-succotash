import { useState } from 'react';
import { useMenu } from '../hooks/useMenu';
import { Header } from '../components/Header';
import { CategoryTabs } from '../components/CategoryTabs';
import { MenuItemCard } from '../components/MenuItemCard';
import { ItemDetailSheet } from '../components/ItemDetailSheet';
import { CartDrawer } from '../components/CartDrawer';
import { LoadingScreen } from '../components/LoadingScreen';
import { ErrorScreen } from '../components/ErrorScreen';
import { formatMoney } from '../utils/money';
import type { CartLine } from '../utils/cart';
import type { Branch, MenuItem, OrderChannel } from '../api/types';

export function MenuPage({
  branch,
  channel,
  onBack,
  onCheckout,
}: {
  branch: Branch;
  channel: OrderChannel;
  onBack: () => void;
  onCheckout: (lines: CartLine[]) => void;
}) {
  const menu = useMenu(branch.id, channel === 'mobile_delivery' ? 'delivery' : 'pickup');
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [showCart, setShowCart] = useState(false);
  const [lines, setLines] = useState<CartLine[]>([]);

  const addLine = (line: Omit<CartLine, 'lineId'>) => setLines((prev) => [...prev, { ...line, lineId: crypto.randomUUID() }]);
  const updateQuantity = (lineId: string, quantity: number) =>
    setLines((prev) => (quantity <= 0 ? prev.filter((l) => l.lineId !== lineId) : prev.map((l) => (l.lineId === lineId ? { ...l, quantity } : l))));
  const removeLine = (lineId: string) => setLines((prev) => prev.filter((l) => l.lineId !== lineId));

  const itemCount = lines.reduce((sum, l) => sum + l.quantity, 0);
  const subtotal = lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);

  if (menu.status === 'loading') return <LoadingScreen label="Loading the menu…" />;
  if (menu.status === 'error') return <ErrorScreen message={menu.message} />;

  const categoryId = activeCategoryId ?? menu.categories[0]?.id ?? '';
  const itemsForCategory = menu.items.filter((i) => i.categoryId === categoryId);

  return (
    <div className="mx-auto min-h-screen max-w-app bg-surface pb-24">
      <Header title={branch.name} subtitle={channel === 'mobile_delivery' ? 'Delivery' : 'Pickup'} onBack={onBack} />

      {menu.categories.length === 0 ? (
        <p className="p-6 text-center text-muted">This location hasn’t published a menu yet.</p>
      ) : (
        <>
          <CategoryTabs categories={menu.categories} activeId={categoryId} onSelect={setActiveCategoryId} />
          <div className="flex flex-col gap-3 p-4">
            {itemsForCategory.length === 0 && <p className="py-8 text-center text-muted">Nothing in this category right now.</p>}
            {itemsForCategory.map((item) => (
              <MenuItemCard key={item.id} item={item} onSelect={setSelectedItem} />
            ))}
          </div>
        </>
      )}

      {selectedItem && <ItemDetailSheet item={selectedItem} onClose={() => setSelectedItem(null)} onAdd={addLine} />}

      {itemCount > 0 && (
        <button
          onClick={() => setShowCart(true)}
          className="fixed bottom-4 left-1/2 flex w-[calc(100%-2rem)] max-w-[calc(theme(maxWidth.app)-2rem)] -translate-x-1/2 items-center justify-between rounded-pill bg-primary px-5 py-3.5 text-white shadow-lg"
        >
          <span className="font-semibold">
            View cart · {itemCount} item{itemCount > 1 ? 's' : ''}
          </span>
          <span className="font-semibold">{formatMoney(subtotal)}</span>
        </button>
      )}

      {showCart && (
        <CartDrawer
          lines={lines}
          updateQuantity={updateQuantity}
          removeLine={removeLine}
          onClose={() => setShowCart(false)}
          onCheckout={() => onCheckout(lines)}
        />
      )}
    </div>
  );
}
