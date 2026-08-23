import { useEffect, useState } from 'react';
import { fetchCashDrawerSessions } from '../api/endpoints';
import { LoadingScreen } from '../components/LoadingScreen';
import type { CashDrawerSession } from '../api/types';

function formatMoney(amount: string | number | null): string {
  if (amount == null) return '—';
  return `$${Number(amount).toFixed(2)}`;
}

export function CashSessionsPage({ branchId }: { branchId: string }) {
  const [sessions, setSessions] = useState<CashDrawerSession[] | null>(null);

  useEffect(() => {
    setSessions(null);
    fetchCashDrawerSessions(branchId).then(setSessions);
  }, [branchId]);

  if (!sessions) return <LoadingScreen label="Loading cash sessions…" />;

  return (
    <div className="p-8">
      <h1 className="mb-6 font-heading text-2xl font-bold">Cash Sessions</h1>
      <p className="mb-4 text-sm text-muted">
        Opened and closed from the Waiter POS by the cashier operating the drawer. Non-zero variances are flagged.
      </p>
      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3">Cashier</th>
              <th className="px-4 py-3">Opened</th>
              <th className="px-4 py-3">Closed</th>
              <th className="px-4 py-3">Opening float</th>
              <th className="px-4 py-3">Expected</th>
              <th className="px-4 py-3">Counted</th>
              <th className="px-4 py-3">Variance</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sessions.map((s) => {
              const variance = s.variance != null ? Number(s.variance) : null;
              return (
                <tr key={s.id}>
                  <td className="px-4 py-3">{s.cashier.fullName}</td>
                  <td className="px-4 py-3">{new Date(s.openedAt).toLocaleString()}</td>
                  <td className="px-4 py-3">{s.closedAt ? new Date(s.closedAt).toLocaleString() : '—'}</td>
                  <td className="px-4 py-3">{formatMoney(s.openingFloat)}</td>
                  <td className="px-4 py-3">{formatMoney(s.expectedClosingCash)}</td>
                  <td className="px-4 py-3">{formatMoney(s.countedClosingCash)}</td>
                  <td className={`px-4 py-3 font-semibold ${variance == null ? '' : variance === 0 ? 'text-muted' : variance > 0 ? 'text-success' : 'text-error'}`}>
                    {variance != null ? formatMoney(variance) : '—'}
                    {s.varianceNote && <span className="block text-xs font-normal text-muted">{s.varianceNote}</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-pill px-2.5 py-0.5 text-xs font-semibold ${s.status === 'open' ? 'bg-primary/10 text-primary' : 'bg-stone-100 text-muted'}`}>
                      {s.status}
                    </span>
                  </td>
                </tr>
              );
            })}
            {sessions.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-muted">
                  No cash drawer sessions yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
