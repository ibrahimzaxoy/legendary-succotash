import { useState } from 'react';
import { useFloorData } from '../hooks/useFloorData';
import { useNowTick } from '../hooks/useNowTick';
import { setTableStatus } from '../api/endpoints';
import { Header } from '../components/Header';
import { TableTile } from '../components/TableTile';
import { TableActionModal } from '../components/TableActionModal';
import { LoadingScreen } from '../components/LoadingScreen';
import type { RestaurantTable } from '../api/types';
import type { Device, StaffSession } from '../utils/storage';

export function FloorView({
  device,
  session,
  onSeatTable,
  onOpenOrder,
}: {
  device: Device;
  session: StaffSession;
  onSeatTable: (table: RestaurantTable) => void;
  onOpenOrder: (orderId: string) => void;
}) {
  const { tables, orderByTable, loading, error, connected, refresh } = useFloorData(device.branchId);
  const now = useNowTick();
  const [actionTable, setActionTable] = useState<RestaurantTable | null>(null);

  const handleTap = (table: RestaurantTable) => {
    const order = orderByTable.get(table.id);
    if (order) {
      onOpenOrder(order.id);
      return;
    }
    if (table.status === 'needs_cleaning' || table.status === 'reserved') {
      setActionTable(table);
      return;
    }
    onSeatTable(table);
  };

  const markFree = async (table: RestaurantTable) => {
    setActionTable(null);
    await setTableStatus(table.id, 'free');
    refresh();
  };

  if (loading) return <LoadingScreen label="Loading the floor…" />;

  return (
    <div className="flex min-h-screen flex-col">
      <Header branchName={device.branchName} session={session} connected={connected} />

      {error && <div className="bg-error/15 px-5 py-2 text-center text-error">{error}</div>}

      <div className="grid flex-1 grid-cols-[repeat(auto-fill,minmax(160px,1fr))] content-start gap-4 p-5">
        {tables.map((table) => (
          <TableTile key={table.id} table={table} order={orderByTable.get(table.id)} now={now} onTap={() => handleTap(table)} />
        ))}
        {tables.length === 0 && <p className="col-span-full text-center text-muted">No tables set up for this branch yet.</p>}
      </div>

      {actionTable && (
        <TableActionModal
          table={actionTable}
          onClose={() => setActionTable(null)}
          onMarkFree={() => markFree(actionTable)}
          onSeat={() => {
            const table = actionTable;
            setActionTable(null);
            onSeatTable(table);
          }}
        />
      )}
    </div>
  );
}
