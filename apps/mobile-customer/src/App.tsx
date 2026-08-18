import { useState } from 'react';
import { Home } from './pages/Home';
import { MenuPage } from './pages/MenuPage';
import { Checkout } from './pages/Checkout';
import { Tracking } from './pages/Tracking';
import { History } from './pages/History';
import { ErrorScreen } from './components/ErrorScreen';
import type { Branch, OrderChannel } from './api/types';
import type { CartLine } from './utils/cart';

type View =
  | { name: 'home' }
  | { name: 'menu'; channel: OrderChannel; branch: Branch; deliveryAddress?: string }
  | { name: 'checkout'; channel: OrderChannel; branch: Branch; deliveryAddress?: string; lines: CartLine[] }
  | { name: 'tracking'; orderId: string }
  | { name: 'history' };

export function App() {
  const restaurantId = import.meta.env.VITE_RESTAURANT_ID;
  const [view, setView] = useState<View>({ name: 'home' });

  if (!restaurantId) {
    return <ErrorScreen message="This app isn’t configured yet - set VITE_RESTAURANT_ID and reload." />;
  }

  if (view.name === 'menu') {
    return (
      <MenuPage
        branch={view.branch}
        channel={view.channel}
        onBack={() => setView({ name: 'home' })}
        onCheckout={(lines) => setView({ ...view, name: 'checkout', lines })}
      />
    );
  }

  if (view.name === 'checkout') {
    return (
      <Checkout
        branch={view.branch}
        channel={view.channel}
        deliveryAddress={view.deliveryAddress}
        lines={view.lines}
        onBack={() => setView({ name: 'menu', channel: view.channel, branch: view.branch, deliveryAddress: view.deliveryAddress })}
        onPlaced={(orderId) => setView({ name: 'tracking', orderId })}
      />
    );
  }

  if (view.name === 'tracking') {
    return <Tracking orderId={view.orderId} onDone={() => setView({ name: 'home' })} />;
  }

  if (view.name === 'history') {
    return <History onBack={() => setView({ name: 'home' })} onSelect={(orderId) => setView({ name: 'tracking', orderId })} />;
  }

  return (
    <Home
      restaurantId={restaurantId}
      onContinue={(channel, branch, deliveryAddress) => setView({ name: 'menu', channel, branch, deliveryAddress })}
      onViewHistory={() => setView({ name: 'history' })}
    />
  );
}
