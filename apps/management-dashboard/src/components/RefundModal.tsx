import { useEffect, useState } from 'react';
import { fetchPaymentsForOrder, fetchRefundsForPayment, refundPayment } from '../api/endpoints';
import { ApiError } from '../api/client';
import type { Order, Payment, PaymentRefund } from '../api/types';

function formatMoney(amount: string | number): string {
  return `$${Number(amount).toFixed(2)}`;
}

function PaymentRow({ payment, onRefunded }: { payment: Payment; onRefunded: () => void }) {
  const [refunds, setRefunds] = useState<PaymentRefund[] | null>(null);
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = () => fetchRefundsForPayment(payment.id).then(setRefunds);
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payment.id]);

  const alreadyRefunded = (refunds ?? []).reduce((sum, r) => sum + Number(r.amount), 0);
  const captured = Number(payment.amount) + Number(payment.tipAmount);
  const remaining = Math.max(captured - alreadyRefunded, 0);

  const submit = async () => {
    setError(null);
    if (!amount || Number(amount) <= 0) {
      setError('Enter a refund amount.');
      return;
    }
    setSubmitting(true);
    try {
      await refundPayment(payment.id, amount, reason || undefined);
      setAmount('');
      setReason('');
      load();
      onRefunded();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Couldn’t issue the refund.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-lg border border-border p-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium capitalize">{payment.method} · {formatMoney(captured)}</p>
          <p className="text-xs text-muted">
            {payment.status === 'refunded' ? 'Fully refunded' : alreadyRefunded > 0 ? `${formatMoney(alreadyRefunded)} refunded so far` : 'No refunds yet'}
          </p>
        </div>
        <span className={`rounded-pill px-2.5 py-0.5 text-xs font-semibold ${payment.status === 'refunded' ? 'bg-error/10 text-error' : 'bg-success/10 text-success'}`}>
          {payment.status}
        </span>
      </div>

      {refunds && refunds.length > 0 && (
        <div className="mt-2 flex flex-col gap-1 border-t border-border pt-2 text-xs text-muted">
          {refunds.map((r) => (
            <div key={r.id} className="flex justify-between">
              <span>{r.reason || 'Refund'}{r.staff && ` · ${r.staff.fullName}`}</span>
              <span className="text-error">−{formatMoney(r.amount)}</span>
            </div>
          ))}
        </div>
      )}

      {remaining > 0.001 && (
        <div className="mt-2.5 flex items-end gap-2 border-t border-border pt-2.5">
          <label className="text-xs font-medium">
            Amount
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={remaining.toFixed(2)}
              className="mt-1 w-24 rounded border border-border p-1.5 text-sm"
            />
          </label>
          <label className="flex-1 text-xs font-medium">
            Reason (optional)
            <input value={reason} onChange={(e) => setReason(e.target.value)} className="mt-1 w-full rounded border border-border p-1.5 text-sm" />
          </label>
          <button onClick={() => setAmount(remaining.toFixed(2))} className="mb-0.5 text-xs font-medium text-primary">
            Max
          </button>
          <button onClick={submit} disabled={submitting} className="rounded bg-error px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-40">
            {submitting ? '…' : 'Refund'}
          </button>
        </div>
      )}
      {error && <p className="mt-2 text-sm text-error">{error}</p>}
    </div>
  );
}

export function RefundModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const [payments, setPayments] = useState<Payment[] | null>(null);

  const load = () => fetchPaymentsForOrder(order.id).then(setPayments);
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order.id]);

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 px-6" onClick={onClose}>
      <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-lg bg-card p-5" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-heading text-lg font-semibold">Payments &amp; refunds</h2>
            <p className="text-sm text-muted">
              {order.customerName ?? 'Guest'} · {formatMoney(order.total)}
              {Number(order.discount) > 0 && ` (${formatMoney(order.discount)} discount applied)`}
            </p>
          </div>
          <button onClick={onClose} className="text-muted">
            ✕
          </button>
        </div>

        {!payments && <p className="text-sm text-muted">Loading…</p>}
        <div className="flex flex-col gap-3">
          {payments?.map((p) => (
            <PaymentRow key={p.id} payment={p} onRefunded={load} />
          ))}
          {payments?.length === 0 && <p className="text-sm text-muted">No payments recorded for this order.</p>}
        </div>
      </div>
    </div>
  );
}
