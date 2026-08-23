import { useEffect, useState } from 'react';
import { createExpenseCategory, fetchExpenseCategories, fetchExpenses, logExpense } from '../api/endpoints';
import { ApiError } from '../api/client';
import { LoadingScreen } from '../components/LoadingScreen';
import { Modal } from '../components/Modal';
import { StatTile } from '../components/StatTile';
import type { Expense, ExpenseCategory } from '../api/types';

function formatMoney(amount: string | number): string {
  return `$${Number(amount).toFixed(2)}`;
}

function defaultRange() {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
}

function LogExpenseForm({
  branchId,
  categories,
  onDone,
  onNeedCategory,
}: {
  branchId: string;
  categories: ExpenseCategory[];
  onDone: () => void;
  onNeedCategory: () => void;
}) {
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [receiptNote, setReceiptNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await logExpense({ branchId, categoryId, amount, description, receiptNote: receiptNote || undefined });
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Couldn’t log the expense.');
    } finally {
      setSubmitting(false);
    }
  };

  if (categories.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <p className="text-muted">No expense categories yet.</p>
        <button onClick={onNeedCategory} className="rounded bg-primary px-4 py-2 text-sm font-semibold text-white">
          Add a category first
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <label className="text-sm font-medium">
        Category
        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="mt-1 w-full rounded border border-border p-2">
          <option value="">Select…</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm font-medium">
        Amount
        <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="mt-1 w-full rounded border border-border p-2" />
      </label>
      <label className="text-sm font-medium">
        Description
        <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Propane refill" className="mt-1 w-full rounded border border-border p-2" />
      </label>
      <label className="text-sm font-medium">
        Receipt note (optional)
        <input value={receiptNote} onChange={(e) => setReceiptNote(e.target.value)} placeholder="e.g. paper receipt in drawer" className="mt-1 w-full rounded border border-border p-2" />
      </label>
      {error && <p className="text-sm text-error">{error}</p>}
      <button
        onClick={submit}
        disabled={submitting || !categoryId || !amount || !description}
        className="rounded bg-primary py-2.5 font-semibold text-white disabled:opacity-40"
      >
        {submitting ? 'Logging…' : 'Log expense'}
      </button>
    </div>
  );
}

function NewCategoryForm({ restaurantId, onDone }: { restaurantId: string; onDone: () => void }) {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await createExpenseCategory({ restaurantId, name });
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Couldn’t create the category.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <label className="text-sm font-medium">
        Name
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Electricity" className="mt-1 w-full rounded border border-border p-2" />
      </label>
      {error && <p className="text-sm text-error">{error}</p>}
      <button onClick={submit} disabled={submitting || !name} className="rounded bg-primary py-2.5 font-semibold text-white disabled:opacity-40">
        {submitting ? 'Creating…' : 'Create category'}
      </button>
    </div>
  );
}

export function ExpensesPage({ restaurantId, branchId }: { restaurantId: string; branchId: string }) {
  const [categories, setCategories] = useState<ExpenseCategory[] | null>(null);
  const [expenses, setExpenses] = useState<Expense[] | null>(null);
  const [{ from, to }, setRange] = useState(defaultRange());
  const [showLogForm, setShowLogForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);

  const load = () => {
    fetchExpenseCategories(restaurantId).then(setCategories);
    fetchExpenses(branchId, from, to).then(setExpenses);
  };

  useEffect(() => {
    setExpenses(null);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId, from, to]);

  if (!categories || !expenses) return <LoadingScreen label="Loading expenses…" />;

  const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const byCategory: Record<string, number> = {};
  for (const e of expenses) {
    byCategory[e.category.name] = (byCategory[e.category.name] ?? 0) + Number(e.amount);
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold">Expenses</h1>
        <div className="flex items-center gap-2 text-sm">
          <input type="date" value={from} onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))} className="rounded border border-border p-1.5" />
          <span className="text-muted">to</span>
          <input type="date" value={to} onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))} className="rounded border border-border p-1.5" />
        </div>
      </div>

      <div className="mb-6 grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3">
        <StatTile label="Total expenses" value={formatMoney(total)} />
        {Object.entries(byCategory).map(([name, amount]) => (
          <StatTile key={name} label={name} value={formatMoney(amount)} />
        ))}
      </div>

      <div className="mb-4 flex gap-2">
        <button onClick={() => setShowLogForm(true)} className="rounded bg-primary px-4 py-2 text-sm font-semibold text-white">
          + Log expense
        </button>
        <button onClick={() => setShowCategoryForm(true)} className="rounded border border-border px-4 py-2 text-sm font-medium">
          + Category
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Logged by</th>
              <th className="px-4 py-3 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {expenses.map((e) => (
              <tr key={e.id}>
                <td className="px-4 py-3">{e.spentAt}</td>
                <td className="px-4 py-3">{e.category.name}</td>
                <td className="px-4 py-3">
                  {e.description}
                  {e.receiptNote && <span className="block text-xs text-muted">{e.receiptNote}</span>}
                </td>
                <td className="px-4 py-3">{e.loggedBy.fullName}</td>
                <td className="px-4 py-3 text-right font-medium">{formatMoney(e.amount)}</td>
              </tr>
            ))}
            {expenses.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-muted">
                  No expenses logged in this date range.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showLogForm && (
        <Modal title="Log an expense" onClose={() => setShowLogForm(false)}>
          <LogExpenseForm
            branchId={branchId}
            categories={categories}
            onDone={() => {
              setShowLogForm(false);
              load();
            }}
            onNeedCategory={() => {
              setShowLogForm(false);
              setShowCategoryForm(true);
            }}
          />
        </Modal>
      )}
      {showCategoryForm && (
        <Modal title="New expense category" onClose={() => setShowCategoryForm(false)}>
          <NewCategoryForm
            restaurantId={restaurantId}
            onDone={() => {
              setShowCategoryForm(false);
              load();
            }}
          />
        </Modal>
      )}
    </div>
  );
}
