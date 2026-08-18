import { useMemo, useState } from 'react';
import { useMenu } from '../hooks/useMenu';
import { addItemsToOrder, createOrder } from '../api/endpoints';
import { ApiError } from '../api/client';
import { Header } from '../components/Header';
import { CategoryTabs } from '../components/CategoryTabs';
import { MenuItemCard } from '../components/MenuItemCard';
import { ItemDetailSheet } from '../components/ItemDetailSheet';
import { CartPanel } from '../components/CartPanel';
import { LoadingScreen } from '../components/LoadingScreen';
import { ErrorScreen } from '../components/ErrorScreen';
import { cartLinesToOrderItemInputs, type CartLine } from '../utils/cart';
import type { MenuItem, RestaurantTable } from '../api/types';
import type { Device, StaffSession } from '../utils/storage';

// Two modes: seating a free table (creates a new dine_in_waiter order) or
// adding to a table that's already ordering, reached from OrderDetail's
// "Add items" button (appends to the same order - the same merge behavior
// a second guest's phone gets from the table PWA).
export function OrderBuilder({
  device,
  session,
  table,
  existingOrderId,
  onDone,
  onBack,
}: {
  device: Device;
  session: StaffSession;
  table: RestaurantTable;
  existingOrderId?: string;
  onDone: (orderId: string) => void;
  onBack: () => void;
}) {
  const menu = useMenu(device.branchId);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [lines, setLines] = useState<CartLine[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categoryId =
    activeCategoryId ?? (menu.status === 'ready' ? (menu.categories[0]?.id ?? null) : null);
  const itemsForCategory = menu.status === 'ready' ? menu.items.filter((i) => i.categoryId === categoryId) : [];

  const addLine = (line: Omit<CartLine, 'lineId'>) => setLines((prev) => [...prev, { ...line, lineId: crypto.randomUUID() }]);
  const updateQuantity = (lineId: string, quantity: number) =>
    setLines((prev) => (quantity <= 0 ? prev.filter((l) => l.lineId !== lineId) : prev.map((l) => (l.lineId === lineId ? { ...l, quantity } : l))));
  const removeLine = (lineId: string) => setLines((prev) => prev.filter((l) => l.lineId !== lineId));

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const items = cartLinesToOrderItemInputs(lines);
      const order = existingOrderId
        ? await addItemsToOrder(existingOrderId, session.staff.id, items)
        : await createOrder(device.branchId, table.id, session.staff.id, items);
      onDone(order.id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Couldn’t send the order - check the connection.');
    } finally {
      setSubmitting(false);
    }
  };

  const categories = useMemo(() => (menu.status === 'ready' ? menu.categories : []), [menu]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header branchName={`Table ${table.number}`} session={session} onBack={onBack} />

      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 flex-col overflow-hidden">
          {menu.status === 'loading' && <LoadingScreen label="Loading the menu…" />}
          {menu.status === 'error' && <ErrorScreen message={menu.message} />}
          {menu.status === 'ready' && categoryId && (
            <>
              <CategoryTabs categories={categories} activeId={categoryId} onSelect={setActiveCategoryId} />
              <div className="flex-1 overflow-y-auto p-4">
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
                  {itemsForCategory.map((item) => (
                    <MenuItemCard key={item.id} item={item} onSelect={setSelectedItem} />
                  ))}
                </div>
                {itemsForCategory.length === 0 && <p className="py-8 text-center text-muted">Nothing in this category.</p>}
              </div>
            </>
          )}
        </div>

        <CartPanel
          lines={lines}
          updateQuantity={updateQuantity}
          removeLine={removeLine}
          onSubmit={submit}
          submitLabel={existingOrderId ? 'Add to order' : 'Send to kitchen'}
          submitting={submitting}
          error={error}
        />
      </div>

      {selectedItem && <ItemDetailSheet item={selectedItem} onClose={() => setSelectedItem(null)} onAdd={addLine} />}
    </div>
  );
}
