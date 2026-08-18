import { useState } from 'react';
import { useDevice } from './hooks/useDevice';
import { useStaffSession } from './hooks/useStaffSession';
import { DeviceSetup } from './pages/DeviceSetup';
import { StaffLogin } from './pages/StaffLogin';
import { DeliveryList } from './pages/DeliveryList';
import { DeliveryDetail } from './pages/DeliveryDetail';

type View = { name: 'list' } | { name: 'detail'; deliveryId: string };

export function App() {
  const device = useDevice();
  const session = useStaffSession();
  const [view, setView] = useState<View>({ name: 'list' });

  if (!device) return <DeviceSetup />;
  if (!session) return <StaffLogin device={device} />;

  if (view.name === 'detail') {
    return (
      <DeliveryDetail
        device={device}
        session={session}
        deliveryId={view.deliveryId}
        onBack={() => setView({ name: 'list' })}
      />
    );
  }

  return <DeliveryList device={device} session={session} onOpenDelivery={(deliveryId) => setView({ name: 'detail', deliveryId })} />;
}
