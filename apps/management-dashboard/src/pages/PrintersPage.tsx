import { useEffect, useState } from 'react';
import { createPrinter, deletePrinter, fetchPrinters, fetchPrintJobs, fetchStations, updatePrinter } from '../api/endpoints';
import { ApiError } from '../api/client';
import { LoadingScreen } from '../components/LoadingScreen';
import { Modal } from '../components/Modal';
import type { KitchenStation, PrinterConfig, PrintJobLog } from '../api/types';

function NewPrinterForm({
  branchId,
  stations,
  onDone,
}: {
  branchId: string;
  stations: KitchenStation[];
  onDone: () => void;
}) {
  const [name, setName] = useState('');
  const [kitchenStationId, setKitchenStationId] = useState('');
  const [ipAddress, setIpAddress] = useState('');
  const [port, setPort] = useState('9100');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await createPrinter({ branchId, name, ipAddress, port: Number(port), kitchenStationId: kitchenStationId || undefined });
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Couldn’t create the printer.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <label className="text-sm font-medium">
        Name
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Grill ticket printer" className="mt-1 w-full rounded border border-border p-2" />
      </label>
      <label className="text-sm font-medium">
        Kitchen station (leave blank for a receipt/pre-bill printer)
        <select value={kitchenStationId} onChange={(e) => setKitchenStationId(e.target.value)} className="mt-1 w-full rounded border border-border p-2">
          <option value="">— Receipt printer (no station) —</option>
          {stations.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </label>
      <div className="flex gap-3">
        <label className="flex-1 text-sm font-medium">
          IP address
          <input value={ipAddress} onChange={(e) => setIpAddress(e.target.value)} placeholder="192.168.1.50" className="mt-1 w-full rounded border border-border p-2" />
        </label>
        <label className="w-28 text-sm font-medium">
          Port
          <input value={port} onChange={(e) => setPort(e.target.value)} className="mt-1 w-full rounded border border-border p-2" />
        </label>
      </div>
      {error && <p className="text-sm text-error">{error}</p>}
      <button
        onClick={submit}
        disabled={submitting || !name || !ipAddress}
        className="rounded bg-primary py-2.5 font-semibold text-white disabled:opacity-40"
      >
        {submitting ? 'Adding…' : 'Add printer'}
      </button>
    </div>
  );
}

export function PrintersPage({ branchId }: { branchId: string }) {
  const [printers, setPrinters] = useState<PrinterConfig[] | null>(null);
  const [stations, setStations] = useState<KitchenStation[]>([]);
  const [jobs, setJobs] = useState<PrintJobLog[]>([]);
  const [showForm, setShowForm] = useState(false);

  const load = () => {
    fetchPrinters(branchId).then(setPrinters);
    fetchPrintJobs(branchId).then(setJobs);
  };

  useEffect(() => {
    setPrinters(null);
    load();
    fetchStations(branchId).then(setStations);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId]);

  if (!printers) return <LoadingScreen label="Loading printers…" />;

  const stationName = (id: string | null) => (id ? stations.find((s) => s.id === id)?.name ?? '—' : 'Receipt printer');
  const failedJobs = jobs.filter((j) => j.status === 'failed');

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold">Printers</h1>
        <button onClick={() => setShowForm(true)} className="rounded bg-primary px-4 py-2 text-sm font-semibold text-white">
          + Add printer
        </button>
      </div>
      <p className="mb-4 text-sm text-muted">
        Network ESC/POS printers only (LAN, port 9100 by default). A kitchen ticket prints the moment an item is sent to that
        station; a printer without a station handles guest pre-bills and receipts. A printer being offline never blocks
        ordering or payment - it just shows up as a failed job below.
      </p>

      <div className="mb-6 overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Assigned to</th>
              <th className="px-4 py-3">Address</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {printers.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-3 font-medium">{p.name}</td>
                <td className="px-4 py-3">{stationName(p.kitchenStationId)}</td>
                <td className="px-4 py-3 font-mono text-xs">{p.ipAddress}:{p.port}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-pill px-2.5 py-0.5 text-xs font-semibold ${p.active ? 'bg-success/10 text-success' : 'bg-stone-100 text-muted'}`}>
                    {p.active ? 'Active' : 'Disabled'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => updatePrinter(p.id, { active: !p.active }).then(load)}
                    className="mr-3 text-sm text-primary"
                  >
                    {p.active ? 'Disable' : 'Enable'}
                  </button>
                  <button onClick={() => deletePrinter(p.id).then(load)} className="text-sm text-error">
                    Remove
                  </button>
                </td>
              </tr>
            ))}
            {printers.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-muted">
                  No printers configured for this branch yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <h2 className="mb-3 font-heading text-lg font-semibold">Recent print jobs</h2>
      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Error</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {jobs.slice(0, 20).map((j) => (
              <tr key={j.id}>
                <td className="px-4 py-3">{new Date(j.createdAt).toLocaleString()}</td>
                <td className="px-4 py-3 capitalize">{j.jobType.replace('_', ' ')}</td>
                <td className={`px-4 py-3 font-semibold ${j.status === 'sent' ? 'text-success' : 'text-error'}`}>{j.status}</td>
                <td className="px-4 py-3 text-muted">{j.errorMessage ?? '—'}</td>
              </tr>
            ))}
            {jobs.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-muted">
                  No print jobs yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {failedJobs.length > 0 && (
        <p className="mt-3 text-sm text-error">{failedJobs.length} failed print job{failedJobs.length > 1 ? 's' : ''} in the recent log - check the printer is online.</p>
      )}

      {showForm && (
        <Modal title="Add printer" onClose={() => setShowForm(false)}>
          <NewPrinterForm
            branchId={branchId}
            stations={stations}
            onDone={() => {
              setShowForm(false);
              load();
            }}
          />
        </Modal>
      )}
    </div>
  );
}
