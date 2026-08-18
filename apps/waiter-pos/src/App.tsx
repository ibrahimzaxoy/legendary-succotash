import { useState } from 'react';
import { useDevice } from './hooks/useDevice';
import { useStaffSession } from './hooks/useStaffSession';
import { DeviceSetup } from './pages/DeviceSetup';
import { StaffLogin } from './pages/StaffLogin';
import { FloorView } from './pages/FloorView';
import { OrderBuilder } from './pages/OrderBuilder';
import { OrderDetail } from './pages/OrderDetail';
import type { RestaurantTable } from './api/types';

type View =
  | { name: 'floor' }
  | { name: 'seat'; table: RestaurantTable }
  | { name: 'order'; orderId: string }
  | { name: 'add-items'; table: RestaurantTable; orderId: string };

export function App() {
  const device = useDevice();
  const session = useStaffSession();
  const [view, setView] = useState<View>({ name: 'floor' });

  if (!device) return <DeviceSetup />;
  if (!session) return <StaffLogin device={device} />;

  if (view.name === 'seat') {
    return (
      <OrderBuilder
        device={device}
        session={session}
        table={view.table}
        onBack={() => setView({ name: 'floor' })}
        onDone={(orderId) => setView({ name: 'order', orderId })}
      />
    );
  }

  if (view.name === 'add-items') {
    return (
      <OrderBuilder
        device={device}
        session={session}
        table={view.table}
        existingOrderId={view.orderId}
        onBack={() => setView({ name: 'order', orderId: view.orderId })}
        onDone={(orderId) => setView({ name: 'order', orderId })}
      />
    );
  }

  if (view.name === 'order') {
    return (
      <OrderDetail
        session={session}
        orderId={view.orderId}
        onBack={() => setView({ name: 'floor' })}
        onAddItems={(table) => setView({ name: 'add-items', table, orderId: view.orderId })}
      />
    );
  }

  return (
    <FloorView
      device={device}
      session={session}
      onSeatTable={(table) => setView({ name: 'seat', table })}
      onOpenOrder={(orderId) => setView({ name: 'order', orderId })}
    />
  );
}
