import { useEffect, useState } from 'react';
import { createTable, fetchTableQr, fetchTables } from '../api/endpoints';
import { ApiError } from '../api/client';
import { Modal } from '../components/Modal';
import { LoadingScreen } from '../components/LoadingScreen';
import type { RestaurantTable } from '../api/types';

const STATUS_STYLES: Record<string, string> = {
  free: 'bg-success/10 text-success',
  occupied: 'bg-cooking/10 text-cooking',
  needs_cleaning: 'bg-stone-200 text-muted',
  reserved: 'bg-purple-100 text-purple-700',
};

export function TablesPage({ branchId }: { branchId: string }) {
  const [tables, setTables] = useState<RestaurantTable[] | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [qrTable, setQrTable] = useState<RestaurantTable | null>(null);

  const load = () => fetchTables(branchId).then(setTables);
  useEffect(() => {
    setTables(null);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId]);

  if (!tables) return <LoadingScreen label="Loading tables…" />;

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold">Tables</h1>
        <button onClick={() => setShowCreate(true)} className="rounded bg-primary px-4 py-2 font-medium text-white">
          + Add table
        </button>
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3">
        {tables.map((table) => (
          <div key={table.id} className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <p className="font-heading text-lg font-semibold">Table {table.number}</p>
              <span className={`rounded-pill px-2 py-0.5 text-xs font-semibold ${STATUS_STYLES[table.status]}`}>
                {table.status.replace('_', ' ')}
              </span>
            </div>
            <p className="mt-1 text-sm text-muted">
              {table.zone ? `${table.zone} · ` : ''}Seats {table.capacity}
            </p>
            <button onClick={() => setQrTable(table)} className="mt-3 text-sm font-medium text-primary">
              View QR code →
            </button>
          </div>
        ))}
        {tables.length === 0 && <p className="text-muted">No tables yet.</p>}
      </div>

      {showCreate && (
        <CreateTableModal
          branchId={branchId}
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            load();
          }}
        />
      )}
      {qrTable && <QrModal table={qrTable} onClose={() => setQrTable(null)} />}
    </div>
  );
}

function CreateTableModal({ branchId, onClose, onCreated }: { branchId: string; onClose: () => void; onCreated: () => void }) {
  const [number, setNumber] = useState('');
  const [zone, setZone] = useState('');
  const [capacity, setCapacity] = useState(4);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await createTable({ branchId, number: number.trim(), zone: zone.trim() || undefined, capacity });
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Couldn’t create the table.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal title="Add table" onClose={onClose}>
      <div className="flex flex-col gap-3">
        <label className="text-sm font-medium">
          Number/name
          <input
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            placeholder="e.g. 12 or Patio-3"
            className="mt-1 w-full rounded border border-border p-2.5"
          />
        </label>
        <label className="text-sm font-medium">
          Zone (optional)
          <input value={zone} onChange={(e) => setZone(e.target.value)} className="mt-1 w-full rounded border border-border p-2.5" />
        </label>
        <label className="text-sm font-medium">
          Capacity
          <input
            type="number"
            min={1}
            value={capacity}
            onChange={(e) => setCapacity(Number(e.target.value))}
            className="mt-1 w-full rounded border border-border p-2.5"
          />
        </label>
        {error && <p className="text-sm text-error">{error}</p>}
        <button
          onClick={submit}
          disabled={!number.trim() || submitting}
          className="mt-2 rounded bg-primary py-2.5 font-semibold text-white disabled:opacity-40"
        >
          {submitting ? 'Creating…' : 'Create table'}
        </button>
      </div>
    </Modal>
  );
}

function QrModal({ table, onClose }: { table: RestaurantTable; onClose: () => void }) {
  const [qr, setQr] = useState<{ url: string; qrPngDataUrl: string } | null>(null);
  useEffect(() => {
    fetchTableQr(table.id).then(setQr);
  }, [table.id]);

  return (
    <Modal title={`Table ${table.number} - QR code`} onClose={onClose}>
      {!qr ? (
        <p className="text-muted">Loading…</p>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <img src={qr.qrPngDataUrl} alt={`QR code for table ${table.number}`} className="h-56 w-56" />
          <p className="break-all text-center text-xs text-muted">{qr.url}</p>
          <p className="text-center text-sm text-muted">Print this for the table tent - scanning it opens the ordering app.</p>
        </div>
      )}
    </Modal>
  );
}
