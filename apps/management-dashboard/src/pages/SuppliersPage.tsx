import { useEffect, useState } from 'react';
import {
  cancelPurchaseOrder,
  createPurchaseOrder,
  createSupplier,
  fetchPurchaseOrders,
  fetchSupplierBalance,
  fetchSupplierPayments,
  fetchSuppliers,
  placePurchaseOrder,
  receivePurchaseOrder,
  recordSupplierPayment,
  type PurchaseOrderItemInput,
} from '../api/endpoints';
import { ApiError } from '../api/client';
import { LoadingScreen } from '../components/LoadingScreen';
import { Modal } from '../components/Modal';
import { StatTile } from '../components/StatTile';
import type { PurchaseOrder, Supplier, SupplierBalance, SupplierPayment } from '../api/types';

function formatMoney(amount: string | number): string {
  return `$${Number(amount).toFixed(2)}`;
}

const PO_STYLE: Record<string, string> = {
  draft: 'bg-stone-100 text-muted',
  ordered: 'bg-primary/10 text-primary',
  partially_received: 'bg-cooking/10 text-cooking',
  received: 'bg-success/10 text-success',
  cancelled: 'bg-error/10 text-error',
};

function NewSupplierForm({ restaurantId, onDone }: { restaurantId: string; onDone: () => void }) {
  const [name, setName] = useState('');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [paymentTermsDays, setPaymentTermsDays] = useState('30');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await createSupplier({ restaurantId, name, contactName: contactName || undefined, phone: phone || undefined, paymentTermsDays: Number(paymentTermsDays) });
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Couldn’t create the supplier.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <label className="text-sm font-medium">
        Name
        <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded border border-border p-2" />
      </label>
      <label className="text-sm font-medium">
        Contact name
        <input value={contactName} onChange={(e) => setContactName(e.target.value)} className="mt-1 w-full rounded border border-border p-2" />
      </label>
      <label className="text-sm font-medium">
        Phone
        <input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 w-full rounded border border-border p-2" />
      </label>
      <label className="text-sm font-medium">
        Payment terms (days)
        <input value={paymentTermsDays} onChange={(e) => setPaymentTermsDays(e.target.value)} className="mt-1 w-full rounded border border-border p-2" />
      </label>
      {error && <p className="text-sm text-error">{error}</p>}
      <button onClick={submit} disabled={submitting || !name} className="rounded bg-primary py-2.5 font-semibold text-white disabled:opacity-40">
        {submitting ? 'Creating…' : 'Create supplier'}
      </button>
    </div>
  );
}

function NewPurchaseOrderForm({ branchId, supplierId, onDone }: { branchId: string; supplierId: string; onDone: () => void }) {
  const [items, setItems] = useState<PurchaseOrderItemInput[]>([{ itemName: '', unit: '', quantityOrdered: '', unitCost: '' }]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const updateItem = (i: number, patch: Partial<PurchaseOrderItemInput>) =>
    setItems((prev) => prev.map((item, idx) => (idx === i ? { ...item, ...patch } : item)));

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await createPurchaseOrder({ branchId, supplierId, items: items.filter((i) => i.itemName && i.quantityOrdered && i.unitCost) });
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Couldn’t create the purchase order.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {items.map((item, i) => (
        <div key={i} className="flex gap-2">
          <input value={item.itemName} onChange={(e) => updateItem(i, { itemName: e.target.value })} placeholder="Item" className="flex-[2] rounded border border-border p-2 text-sm" />
          <input value={item.unit} onChange={(e) => updateItem(i, { unit: e.target.value })} placeholder="Unit" className="w-16 rounded border border-border p-2 text-sm" />
          <input value={item.quantityOrdered} onChange={(e) => updateItem(i, { quantityOrdered: e.target.value })} placeholder="Qty" className="w-16 rounded border border-border p-2 text-sm" />
          <input value={item.unitCost} onChange={(e) => updateItem(i, { unitCost: e.target.value })} placeholder="Cost" className="w-20 rounded border border-border p-2 text-sm" />
        </div>
      ))}
      <button
        type="button"
        onClick={() => setItems((prev) => [...prev, { itemName: '', unit: '', quantityOrdered: '', unitCost: '' }])}
        className="text-left text-sm font-medium text-primary"
      >
        + Add line
      </button>
      {error && <p className="text-sm text-error">{error}</p>}
      <button onClick={submit} disabled={submitting} className="rounded bg-primary py-2.5 font-semibold text-white disabled:opacity-40">
        {submitting ? 'Creating…' : 'Create purchase order'}
      </button>
    </div>
  );
}

function ReceiveForm({ po, onDone }: { po: PurchaseOrder; onDone: () => void }) {
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    const lines = po.items
      .filter((i) => quantities[i.id])
      .map((i) => ({ purchaseOrderItemId: i.id, quantityReceived: quantities[i.id] }));
    if (lines.length === 0) return;
    setSubmitting(true);
    setError(null);
    try {
      await receivePurchaseOrder(po.id, { lines });
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Couldn’t record the receipt.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-3 rounded border border-border bg-surface p-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Receive stock</p>
      <div className="flex flex-col gap-2">
        {po.items
          .filter((i) => Number(i.quantityReceived) < Number(i.quantityOrdered))
          .map((i) => (
            <div key={i.id} className="flex items-center justify-between gap-2 text-sm">
              <span>
                {i.itemName} ({i.quantityReceived}/{i.quantityOrdered} {i.unit})
              </span>
              <input
                value={quantities[i.id] ?? ''}
                onChange={(e) => setQuantities((prev) => ({ ...prev, [i.id]: e.target.value }))}
                placeholder="Qty received"
                className="w-28 rounded border border-border p-1.5"
              />
            </div>
          ))}
      </div>
      {error && <p className="mt-2 text-sm text-error">{error}</p>}
      <button onClick={submit} disabled={submitting} className="mt-2 rounded bg-primary px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-40">
        {submitting ? 'Recording…' : 'Record receipt'}
      </button>
    </div>
  );
}

function RecordPaymentForm({ branchId, supplierId, onDone }: { branchId: string; supplierId: string; onDone: () => void }) {
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await recordSupplierPayment({ branchId, supplierId, amount, method: 'cash' });
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Couldn’t record the payment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <label className="text-sm font-medium">
        Amount
        <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="mt-1 w-full rounded border border-border p-2" />
      </label>
      {error && <p className="text-sm text-error">{error}</p>}
      <button onClick={submit} disabled={submitting || !amount} className="rounded bg-primary py-2.5 font-semibold text-white disabled:opacity-40">
        {submitting ? 'Recording…' : 'Record payment'}
      </button>
    </div>
  );
}

export function SuppliersPage({ restaurantId, branchId }: { restaurantId: string; branchId: string }) {
  const [suppliers, setSuppliers] = useState<Supplier[] | null>(null);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[] | null>(null);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
  const [balance, setBalance] = useState<SupplierBalance | null>(null);
  const [payments, setPayments] = useState<SupplierPayment[] | null>(null);
  const [expandedPoId, setExpandedPoId] = useState<string | null>(null);
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [showPoForm, setShowPoForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    fetchSuppliers(restaurantId).then((list) => {
      setSuppliers(list);
      if (!selectedSupplierId && list.length > 0) setSelectedSupplierId(list[0].id);
    });
    fetchPurchaseOrders(branchId).then(setPurchaseOrders);
  };

  useEffect(() => {
    setSuppliers(null);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId, branchId]);

  useEffect(() => {
    if (!selectedSupplierId) return;
    fetchSupplierBalance(selectedSupplierId).then(setBalance);
    fetchSupplierPayments(selectedSupplierId).then(setPayments);
  }, [selectedSupplierId]);

  const refreshSelected = () => {
    if (selectedSupplierId) {
      fetchSupplierBalance(selectedSupplierId).then(setBalance);
      fetchSupplierPayments(selectedSupplierId).then(setPayments);
    }
    fetchPurchaseOrders(branchId).then(setPurchaseOrders);
  };

  const place = async (id: string) => {
    setError(null);
    try {
      await placePurchaseOrder(id);
      refreshSelected();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Couldn’t place the order.');
    }
  };

  const cancel = async (id: string) => {
    setError(null);
    try {
      await cancelPurchaseOrder(id);
      refreshSelected();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Couldn’t cancel the order.');
    }
  };

  if (!suppliers || !purchaseOrders) return <LoadingScreen label="Loading suppliers…" />;

  const selectedSupplier = suppliers.find((s) => s.id === selectedSupplierId) ?? null;
  const supplierPos = purchaseOrders.filter((po) => po.supplierId === selectedSupplierId);

  return (
    <div className="flex h-full">
      <div className="w-72 shrink-0 border-r border-border p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold">Suppliers</h2>
          <button onClick={() => setShowSupplierForm(true)} className="text-sm font-medium text-primary">
            + Add
          </button>
        </div>
        <div className="flex flex-col gap-1.5">
          {suppliers.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedSupplierId(s.id)}
              className={`rounded px-3 py-2.5 text-left text-sm ${selectedSupplierId === s.id ? 'bg-primary/10 text-primary' : 'hover:bg-surface'}`}
            >
              {s.name}
            </button>
          ))}
          {suppliers.length === 0 && <p className="text-sm text-muted">No suppliers yet.</p>}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        {!selectedSupplier ? (
          <p className="text-muted">Add a supplier to get started.</p>
        ) : (
          <>
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h1 className="font-heading text-2xl font-bold">{selectedSupplier.name}</h1>
                <p className="text-sm text-muted">
                  {selectedSupplier.contactName} {selectedSupplier.phone && `· ${selectedSupplier.phone}`} · Net {selectedSupplier.paymentTermsDays}
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowPoForm(true)} className="rounded bg-primary px-4 py-2 text-sm font-semibold text-white">
                  + New PO
                </button>
                <button onClick={() => setShowPaymentForm(true)} className="rounded border border-border px-4 py-2 text-sm font-medium">
                  + Record payment
                </button>
              </div>
            </div>

            {error && <p className="mb-4 text-error">{error}</p>}

            {balance && (
              <div className="mb-6 grid grid-cols-3 gap-3">
                <StatTile label="Owed (ordered/received)" value={formatMoney(balance.owed)} />
                <StatTile label="Paid" value={formatMoney(balance.paid)} />
                <StatTile label="Outstanding balance" value={formatMoney(balance.balance)} />
              </div>
            )}

            <h2 className="mb-3 font-heading text-lg font-semibold">Purchase orders</h2>
            <div className="mb-6 flex flex-col gap-2">
              {supplierPos.map((po) => (
                <div key={po.id} className="rounded-lg border border-border bg-card p-4">
                  <div className="flex items-center justify-between">
                    <button onClick={() => setExpandedPoId(expandedPoId === po.id ? null : po.id)} className="text-left">
                      <span className="font-medium">{new Date(po.createdAt).toLocaleDateString()}</span>{' '}
                      <span className={`ml-2 rounded-pill px-2.5 py-0.5 text-xs font-semibold ${PO_STYLE[po.status]}`}>{po.status.replace('_', ' ')}</span>
                    </button>
                    <span className="font-semibold">{formatMoney(po.items.reduce((s, i) => s + Number(i.lineTotal), 0))}</span>
                  </div>
                  {expandedPoId === po.id && (
                    <div className="mt-3 border-t border-border pt-3">
                      <table className="w-full text-left text-sm">
                        <thead className="text-xs uppercase tracking-wide text-muted">
                          <tr>
                            <th className="py-1">Item</th>
                            <th className="py-1">Ordered</th>
                            <th className="py-1">Received</th>
                            <th className="py-1">Unit cost</th>
                            <th className="py-1 text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {po.items.map((i) => (
                            <tr key={i.id}>
                              <td className="py-1">{i.itemName}</td>
                              <td className="py-1">
                                {i.quantityOrdered} {i.unit}
                              </td>
                              <td className="py-1">{i.quantityReceived}</td>
                              <td className="py-1">{formatMoney(i.unitCost)}</td>
                              <td className="py-1 text-right">{formatMoney(i.lineTotal)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div className="mt-2 flex gap-2">
                        {po.status === 'draft' && (
                          <>
                            <button onClick={() => place(po.id)} className="rounded bg-primary px-3 py-1.5 text-sm font-semibold text-white">
                              Place order
                            </button>
                            <button onClick={() => cancel(po.id)} className="rounded border border-error px-3 py-1.5 text-sm font-medium text-error">
                              Cancel
                            </button>
                          </>
                        )}
                        {(po.status === 'ordered' || po.status === 'partially_received') && (
                          <button onClick={() => cancel(po.id)} className="rounded border border-error px-3 py-1.5 text-sm font-medium text-error">
                            Cancel
                          </button>
                        )}
                      </div>
                      {(po.status === 'ordered' || po.status === 'partially_received') && <ReceiveForm po={po} onDone={refreshSelected} />}
                    </div>
                  )}
                </div>
              ))}
              {supplierPos.length === 0 && <p className="text-muted">No purchase orders for this supplier yet.</p>}
            </div>

            <h2 className="mb-3 font-heading text-lg font-semibold">Payment history</h2>
            <div className="flex flex-col gap-1.5">
              {payments?.map((p) => (
                <div key={p.id} className="flex justify-between rounded border border-border bg-card px-4 py-2.5 text-sm">
                  <span>{new Date(p.paidAt).toLocaleDateString()}</span>
                  <span className="font-medium">{formatMoney(p.amount)}</span>
                </div>
              ))}
              {payments && payments.length === 0 && <p className="text-sm text-muted">No payments recorded yet.</p>}
            </div>
          </>
        )}
      </div>

      {showSupplierForm && (
        <Modal title="New supplier" onClose={() => setShowSupplierForm(false)}>
          <NewSupplierForm
            restaurantId={restaurantId}
            onDone={() => {
              setShowSupplierForm(false);
              load();
            }}
          />
        </Modal>
      )}
      {showPoForm && selectedSupplierId && (
        <Modal title="New purchase order" onClose={() => setShowPoForm(false)}>
          <NewPurchaseOrderForm
            branchId={branchId}
            supplierId={selectedSupplierId}
            onDone={() => {
              setShowPoForm(false);
              refreshSelected();
            }}
          />
        </Modal>
      )}
      {showPaymentForm && selectedSupplierId && (
        <Modal title="Record supplier payment" onClose={() => setShowPaymentForm(false)}>
          <RecordPaymentForm
            branchId={branchId}
            supplierId={selectedSupplierId}
            onDone={() => {
              setShowPaymentForm(false);
              refreshSelected();
            }}
          />
        </Modal>
      )}
    </div>
  );
}
