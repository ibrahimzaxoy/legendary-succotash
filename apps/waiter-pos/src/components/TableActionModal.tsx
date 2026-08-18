import type { RestaurantTable } from '../api/types';

export function TableActionModal({
  table,
  onClose,
  onMarkFree,
  onSeat,
}: {
  table: RestaurantTable;
  onClose: () => void;
  onMarkFree: () => void;
  onSeat: () => void;
}) {
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 px-6" onClick={onClose}>
      <div className="w-full max-w-xs rounded-lg bg-card p-5" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-4 text-center font-heading text-xl font-semibold">Table {table.number}</h2>
        <div className="flex flex-col gap-3">
          {table.status === 'needs_cleaning' && (
            <button onClick={onMarkFree} className="rounded-lg bg-primary py-3.5 font-semibold text-white">
              Mark clean &amp; free
            </button>
          )}
          {table.status === 'reserved' && (
            <>
              <button onClick={onSeat} className="rounded-lg bg-primary py-3.5 font-semibold text-white">
                Seat guests
              </button>
              <button onClick={onMarkFree} className="rounded-lg border border-border py-3.5 font-semibold">
                Cancel reservation
              </button>
            </>
          )}
          <button onClick={onClose} className="py-2 text-muted">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
