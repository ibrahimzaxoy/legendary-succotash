import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useTableSession } from '../hooks/useTableSession';
import { useMenu } from '../hooks/useMenu';
import { useOrderSocket } from '../hooks/useOrderSocket';
import { addItemsToOrder, createDineInOrder, findActiveOrderForTable } from '../api/endpoints';
import type { Order } from '../api/types';
import { CartProvider, useCart } from '../state/CartContext';
import { Header } from '../components/Header';
import { LoadingScreen } from '../components/LoadingScreen';
import { ErrorScreen } from '../components/ErrorScreen';
import { MenuBrowser } from '../components/MenuBrowser';
import { CartDrawer } from '../components/CartDrawer';
import { OrderStatusView } from '../components/OrderStatusView';
import { subscribeToOrderPush } from '../utils/push';

export function TableEntry() {
  const { tableId } = useParams();
  const [searchParams] = useSearchParams();
  const session = useTableSession(tableId, searchParams.get('tk'));

  if (session.status === 'loading') return <LoadingScreen label="Setting your table…" />;
  if (session.status === 'error') return <ErrorScreen message={session.message} />;

  return (
    <CartProvider>
      <TableOrderingFlow branchId={session.session.branchId} tableId={session.session.tableId} tableNumber={session.session.tableNumber} />
    </CartProvider>
  );
}

function TableOrderingFlow({ branchId, tableId, tableNumber }: { branchId: string; tableId: string; tableNumber: string }) {
  const menu = useMenu(branchId);
  const cart = useCart();

  const [activeOrder, setActiveOrder] = useState<Order | null | undefined>(undefined); // undefined = still checking
  const [view, setView] = useState<'menu' | 'status'>('menu');
  const [showCart, setShowCart] = useState(false);

  useEffect(() => {
    let cancelled = false;
    findActiveOrderForTable(branchId, tableId)
      .then((order) => {
        if (cancelled) return;
        setActiveOrder(order);
        setView(order ? 'status' : 'menu');
      })
      .catch(() => !cancelled && setActiveOrder(null));
    return () => {
      cancelled = true;
    };
  }, [branchId, tableId]);

  const { itemStatusUpdates } = useOrderSocket(activeOrder?.id ?? null);

  if (activeOrder === undefined) {
    return <LoadingScreen label="Checking your table…" />;
  }

  const submitCart = async () => {
    const items = cart.toOrderItemInputs();
    const order = activeOrder
      ? await addItemsToOrder(activeOrder.id, items)
      : await createDineInOrder(branchId, tableId, items);
    setActiveOrder(order);
    cart.clear();
    setShowCart(false);
    setView('status');
    void subscribeToOrderPush(order.id);
  };

  const itemCount = cart.itemCount;

  return (
    <div className="mx-auto min-h-screen max-w-app bg-surface">
      <Header tableNumber={tableNumber} itemCount={view === 'menu' ? itemCount : undefined} />

      {view === 'status' && activeOrder && (
        <OrderStatusView order={activeOrder} liveStatuses={itemStatusUpdates} onAddMore={() => setView('menu')} />
      )}

      {view === 'menu' && (
        <>
          {menu.status === 'loading' && <LoadingScreen label="Loading the menu…" />}
          {menu.status === 'error' && <ErrorScreen message={menu.message} />}
          {menu.status === 'ready' && (
            <MenuBrowser categories={menu.categories} items={menu.items} onOpenCart={() => setShowCart(true)} />
          )}
          {showCart && (
            <CartDrawer
              onClose={() => setShowCart(false)}
              onSubmit={submitCart}
              submitLabel={activeOrder ? 'Add to order' : 'Send to kitchen'}
            />
          )}
        </>
      )}
    </div>
  );
}
