import { useEffect, useState } from 'react';
import {
  adjustLoyaltyPoints,
  createPromoCode,
  deletePromoCode,
  fetchLoyaltyAccounts,
  fetchLoyaltyLedger,
  fetchPromoCodes,
  updatePromoCode,
} from '../api/endpoints';
import { ApiError } from '../api/client';
import { LoadingScreen } from '../components/LoadingScreen';
import { Modal } from '../components/Modal';
import type { LoyaltyAccount, LoyaltyLedgerEntry, PromoCode, PromoDiscountType } from '../api/types';

function formatMoney(amount: string | number): string {
  return `$${Number(amount).toFixed(2)}`;
}

function NewPromoForm({ restaurantId, onDone }: { restaurantId: string; onDone: () => void }) {
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<PromoDiscountType>('percentage');
  const [value, setValue] = useState('');
  const [minOrderAmount, setMinOrderAmount] = useState('');
  const [usageLimit, setUsageLimit] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await createPromoCode({
        restaurantId,
        code,
        discountType,
        value,
        minOrderAmount: minOrderAmount || undefined,
        usageLimit: usageLimit ? Number(usageLimit) : undefined,
      });
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Couldn’t create the promo code.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <label className="text-sm font-medium">
        Code
        <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. WELCOME10" className="mt-1 w-full rounded border border-border p-2 uppercase" />
      </label>
      <label className="text-sm font-medium">
        Discount type
        <select value={discountType} onChange={(e) => setDiscountType(e.target.value as PromoDiscountType)} className="mt-1 w-full rounded border border-border p-2">
          <option value="percentage">Percentage off</option>
          <option value="fixed_amount">Fixed amount off</option>
        </select>
      </label>
      <label className="text-sm font-medium">
        {discountType === 'percentage' ? 'Percent (e.g. 10 = 10%)' : 'Amount ($)'}
        <input value={value} onChange={(e) => setValue(e.target.value)} placeholder={discountType === 'percentage' ? '10' : '5.00'} className="mt-1 w-full rounded border border-border p-2" />
      </label>
      <label className="text-sm font-medium">
        Minimum order (optional)
        <input value={minOrderAmount} onChange={(e) => setMinOrderAmount(e.target.value)} placeholder="0.00" className="mt-1 w-full rounded border border-border p-2" />
      </label>
      <label className="text-sm font-medium">
        Usage limit (optional)
        <input value={usageLimit} onChange={(e) => setUsageLimit(e.target.value)} placeholder="Unlimited" className="mt-1 w-full rounded border border-border p-2" />
      </label>
      {error && <p className="text-sm text-error">{error}</p>}
      <button onClick={submit} disabled={submitting || !code || !value} className="rounded bg-primary py-2.5 font-semibold text-white disabled:opacity-40">
        {submitting ? 'Creating…' : 'Create promo code'}
      </button>
    </div>
  );
}

function LoyaltyAccountPanel({ account, onAdjusted }: { account: LoyaltyAccount; onAdjusted: () => void }) {
  const [ledger, setLedger] = useState<LoyaltyLedgerEntry[] | null>(null);
  const [points, setPoints] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLedger(null);
    fetchLoyaltyLedger(account.id).then(setLedger);
  }, [account.id]);

  const submit = async () => {
    setError(null);
    const pts = Number(points);
    if (!pts) {
      setError('Enter a non-zero number of points.');
      return;
    }
    try {
      await adjustLoyaltyPoints(account.id, pts, note || undefined);
      setPoints('');
      setNote('');
      onAdjusted();
      fetchLoyaltyLedger(account.id).then(setLedger);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Couldn’t adjust points.');
    }
  };

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="font-semibold">{account.phone}</p>
          {account.name && <p className="text-sm text-muted">{account.name}</p>}
        </div>
        <p className="text-2xl font-bold text-primary">{account.pointsBalance} pts</p>
      </div>

      <div className="mb-3 flex gap-2">
        <input value={points} onChange={(e) => setPoints(e.target.value)} placeholder="+100 or -50" className="w-28 rounded border border-border p-2 text-sm" />
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Reason (optional)" className="flex-1 rounded border border-border p-2 text-sm" />
        <button onClick={submit} className="rounded bg-primary px-3 py-2 text-sm font-semibold text-white">
          Adjust
        </button>
      </div>
      {error && <p className="mb-2 text-sm text-error">{error}</p>}

      {ledger && (
        <div className="max-h-48 overflow-y-auto text-sm">
          {ledger.length === 0 && <p className="text-muted">No history yet.</p>}
          {ledger.map((entry) => (
            <div key={entry.id} className="flex justify-between border-b border-border py-1.5">
              <span className="capitalize text-muted">
                {entry.type}
                {entry.note && ` · ${entry.note}`}
              </span>
              <span className={entry.points >= 0 ? 'text-success' : 'text-error'}>{entry.points >= 0 ? '+' : ''}{entry.points}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function PromotionsPage({ restaurantId }: { restaurantId: string }) {
  const [promoCodes, setPromoCodes] = useState<PromoCode[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [accounts, setAccounts] = useState<LoyaltyAccount[] | null>(null);

  const loadPromos = () => fetchPromoCodes(restaurantId).then(setPromoCodes);
  const loadAccounts = () => fetchLoyaltyAccounts(restaurantId, search || undefined).then(setAccounts);

  useEffect(() => {
    setPromoCodes(null);
    loadPromos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId]);

  useEffect(() => {
    setAccounts(null);
    loadAccounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId, search]);

  if (!promoCodes) return <LoadingScreen label="Loading promotions…" />;

  return (
    <div className="p-8">
      <h1 className="mb-6 font-heading text-2xl font-bold">Promotions &amp; Loyalty</h1>

      <div className="mb-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold">Promo codes</h2>
          <button onClick={() => setShowForm(true)} className="rounded bg-primary px-4 py-2 text-sm font-semibold text-white">
            + New promo code
          </button>
        </div>
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Discount</th>
                <th className="px-4 py-3">Min order</th>
                <th className="px-4 py-3">Usage</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {promoCodes.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3 font-mono font-medium">{p.code}</td>
                  <td className="px-4 py-3">{p.discountType === 'percentage' ? `${p.value}%` : formatMoney(p.value)} off</td>
                  <td className="px-4 py-3">{p.minOrderAmount ? formatMoney(p.minOrderAmount) : '—'}</td>
                  <td className="px-4 py-3">{p.usageCount}{p.usageLimit ? ` / ${p.usageLimit}` : ''}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-pill px-2.5 py-0.5 text-xs font-semibold ${p.active ? 'bg-success/10 text-success' : 'bg-stone-100 text-muted'}`}>
                      {p.active ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => updatePromoCode(p.id, { active: !p.active }).then(loadPromos)} className="mr-3 text-sm text-primary">
                      {p.active ? 'Disable' : 'Enable'}
                    </button>
                    <button onClick={() => deletePromoCode(p.id).then(loadPromos)} className="text-sm text-error">
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
              {promoCodes.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-muted">
                    No promo codes yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold">Loyalty accounts</h2>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by phone…"
            className="w-56 rounded border border-border p-2 text-sm"
          />
        </div>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-4">
          {accounts?.map((account) => (
            <LoyaltyAccountPanel key={account.id} account={account} onAdjusted={loadAccounts} />
          ))}
          {accounts?.length === 0 && <p className="text-muted">No loyalty accounts found.</p>}
        </div>
      </div>

      {showForm && (
        <Modal title="New promo code" onClose={() => setShowForm(false)}>
          <NewPromoForm
            restaurantId={restaurantId}
            onDone={() => {
              setShowForm(false);
              loadPromos();
            }}
          />
        </Modal>
      )}
    </div>
  );
}
