import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useTableSession } from '../hooks/useTableSession';
import { useGuestSession } from '../hooks/useGuestSession';
import { useMenu } from '../hooks/useMenu';
import { useOrderSocket } from '../hooks/useOrderSocket';
import { fetchOrder, findActiveOrderForTable } from '../api/endpoints';
import type { Guest, Order, SharedCartItem } from '../api/types';
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
  const scan = useTableSession(tableId, searchParams.get('tk'));

  if (scan.status === 'loading') return <LoadingScreen label="Setting your table…" />;
  if (scan.status === 'error') return <ErrorScreen message={scan.message} />;

  return <GuestSessionGate branchId={scan.session.branchId} tableId={scan.session.tableId} tableNumber={scan.session.tableNumber} />;
}

// Joins (or rejoins) this table's shared session before anything cart-related
// can render - every guest at the table needs a session+guestId before their
// phone can add to the live shared cart.
function GuestSessionGate({ branchId, tableId, tableNumber }: { branchId: string; tableId: string; tableNumber: string }) {
  const guestSession = useGuestSession(tableId);

  if (guestSession.status === 'loading') return <LoadingScreen label="Joining your table…" />;
  if (guestSession.status === 'error') return <ErrorScreen message={guestSession.message} />;

  const { session, guest, guests, cartItems } = guestSession.state;

  return (
    <TableOrderingFlow
      branchId={branchId}
      tableId={tableId}
      tableNumber={tableNumber}
      sessionId={session.id}
      guestId={guest.id}
      initialGuests={guests}
      initialCartItems={cartItems}
    />
  );
}

function TableOrderingFlow({
  branchId,
  tableId,
  tableNumber,
  sessionId,
  guestId,
  initialGuests,
  initialCartItems,
}: {
  branchId: string;
  tableId: string;
  tableNumber: string;
  sessionId: string;
  guestId: string;
  initialGuests: Guest[];
  initialCartItems: SharedCartItem[];
}) {
  const menu = useMenu(branchId);

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

  // Fires for every guest at the table the moment *any* of them submits
  // the shared cart - not just the one who tapped the button (see
  // CartContext's 'cart-submitted' socket handler).
  const handleSubmitted = (orderId: string) => {
    fetchOrder(orderId).then((order) => {
      setActiveOrder(order);
      setShowCart(false);
      setView('status');
      void subscribeToOrderPush(order.id);
    });
  };

  if (activeOrder === undefined) {
    return <LoadingScreen label="Checking your table…" />;
  }

  return (
    <CartProvider
      tableId={tableId}
      sessionId={sessionId}
      myGuestId={guestId}
      initialGuests={initialGuests}
      initialCartItems={initialCartItems}
      onSubmitted={handleSubmitted}
    >
      <TableOrderingScreens
        tableNumber={tableNumber}
        activeOrder={activeOrder}
        view={view}
        setView={setView}
        showCart={showCart}
        setShowCart={setShowCart}
        itemStatusUpdates={itemStatusUpdates}
        menu={menu}
      />
    </CartProvider>
  );
}

function TableOrderingScreens({
  tableNumber,
  activeOrder,
  view,
  setView,
  showCart,
  setShowCart,
  itemStatusUpdates,
  menu,
}: {
  tableNumber: string;
  activeOrder: Order | null;
  view: 'menu' | 'status';
  setView: (v: 'menu' | 'status') => void;
  showCart: boolean;
  setShowCart: (v: boolean) => void;
  itemStatusUpdates: ReturnType<typeof useOrderSocket>['itemStatusUpdates'];
  menu: ReturnType<typeof useMenu>;
}) {
  const cart = useCart();
  const itemCount = view === 'menu' ? cart.itemCount : undefined;

  return (
    <div className="mx-auto min-h-screen max-w-app bg-surface">
      <Header tableNumber={tableNumber} itemCount={itemCount} />

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
              onSubmit={cart.submit}
              submitLabel={activeOrder ? 'Add to order' : 'Send to kitchen'}
            />
          )}
        </>
      )}
    </div>
  );
}
