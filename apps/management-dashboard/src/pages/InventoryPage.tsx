import { useEffect, useState } from 'react';
import {
  adjustInventoryStock,
  createInventoryItem,
  fetchAllItemsForAdmin,
  fetchInventoryItems,
  fetchLowStockItems,
  fetchRecipeForMenuItem,
  removeRecipeIngredient,
  setRecipeIngredient,
} from '../api/endpoints';
import { ApiError } from '../api/client';
import { LoadingScreen } from '../components/LoadingScreen';
import { Modal } from '../components/Modal';
import type { InventoryItem, InventoryUnit, MenuItem, RecipeIngredient } from '../api/types';

const UNITS: InventoryUnit[] = ['kg', 'g', 'l', 'ml', 'each'];

function AddIngredientForm({ branchId, onDone }: { branchId: string; onDone: () => void }) {
  const [name, setName] = useState('');
  const [unit, setUnit] = useState<InventoryUnit>('kg');
  const [currentStock, setCurrentStock] = useState('0');
  const [reorderThreshold, setReorderThreshold] = useState('0');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await createInventoryItem({ branchId, name, unit, currentStock, reorderThreshold });
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Couldn’t create the ingredient.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <label className="text-sm font-medium">
        Name
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Mozzarella" className="mt-1 w-full rounded border border-border p-2" />
      </label>
      <label className="text-sm font-medium">
        Unit
        <select value={unit} onChange={(e) => setUnit(e.target.value as InventoryUnit)} className="mt-1 w-full rounded border border-border p-2">
          {UNITS.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
      </label>
      <div className="flex gap-3">
        <label className="flex-1 text-sm font-medium">
          Starting stock
          <input value={currentStock} onChange={(e) => setCurrentStock(e.target.value)} className="mt-1 w-full rounded border border-border p-2" />
        </label>
        <label className="flex-1 text-sm font-medium">
          Reorder threshold
          <input value={reorderThreshold} onChange={(e) => setReorderThreshold(e.target.value)} className="mt-1 w-full rounded border border-border p-2" />
        </label>
      </div>
      {error && <p className="text-sm text-error">{error}</p>}
      <button onClick={submit} disabled={submitting || !name} className="rounded bg-primary py-2.5 font-semibold text-white disabled:opacity-40">
        {submitting ? 'Creating…' : 'Create ingredient'}
      </button>
    </div>
  );
}

function AdjustStockForm({ item, onDone }: { item: InventoryItem; onDone: () => void }) {
  const [quantityDelta, setQuantityDelta] = useState('');
  const [reason, setReason] = useState<'waste' | 'manual_correction' | 'stocktake'>('waste');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await adjustInventoryStock(item.id, { quantityDelta, reason, note: note || undefined });
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Couldn’t adjust stock.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted">
        Current stock: {item.currentStock} {item.unit}
      </p>
      <label className="text-sm font-medium">
        Quantity change (negative to remove, positive to add)
        <input value={quantityDelta} onChange={(e) => setQuantityDelta(e.target.value)} placeholder="-1.5" className="mt-1 w-full rounded border border-border p-2" />
      </label>
      <label className="text-sm font-medium">
        Reason
        <select value={reason} onChange={(e) => setReason(e.target.value as typeof reason)} className="mt-1 w-full rounded border border-border p-2">
          <option value="waste">Waste</option>
          <option value="manual_correction">Manual correction</option>
          <option value="stocktake">Stocktake</option>
        </select>
      </label>
      <label className="text-sm font-medium">
        Note (optional)
        <input value={note} onChange={(e) => setNote(e.target.value)} className="mt-1 w-full rounded border border-border p-2" />
      </label>
      {error && <p className="text-sm text-error">{error}</p>}
      <button onClick={submit} disabled={submitting || !quantityDelta} className="rounded bg-primary py-2.5 font-semibold text-white disabled:opacity-40">
        {submitting ? 'Saving…' : 'Save adjustment'}
      </button>
    </div>
  );
}

function RecipeEditor({ menuItems, ingredients }: { menuItems: MenuItem[]; ingredients: InventoryItem[] }) {
  const [menuItemId, setMenuItemId] = useState('');
  const [recipe, setRecipe] = useState<RecipeIngredient[] | null>(null);
  const [inventoryItemId, setInventoryItemId] = useState('');
  const [quantityRequired, setQuantityRequired] = useState('');
  const [error, setError] = useState<string | null>(null);

  const load = (id: string) => fetchRecipeForMenuItem(id).then(setRecipe);

  useEffect(() => {
    if (!menuItemId) {
      setRecipe(null);
      return;
    }
    load(menuItemId);
  }, [menuItemId]);

  const addLink = async () => {
    setError(null);
    try {
      await setRecipeIngredient({ menuItemId, inventoryItemId, quantityRequired });
      setInventoryItemId('');
      setQuantityRequired('');
      load(menuItemId);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Couldn’t link the ingredient.');
    }
  };

  const removeLink = async (id: string) => {
    setError(null);
    try {
      await removeRecipeIngredient(id);
      load(menuItemId);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Couldn’t remove the ingredient.');
    }
  };

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <label className="text-sm font-medium">
        Menu item
        <select value={menuItemId} onChange={(e) => setMenuItemId(e.target.value)} className="mt-1 w-full rounded border border-border p-2">
          <option value="">Select a menu item to map its recipe…</option>
          {menuItems.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </label>

      {menuItemId && recipe && (
        <div className="mt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
            Ingredients (base recipe - no per-item cooking action needed once set)
          </p>
          <div className="mb-3 flex flex-col gap-1.5">
            {recipe.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded bg-surface px-3 py-2 text-sm">
                <span>
                  {r.quantityRequired} {r.inventoryItem.unit} {r.inventoryItem.name}
                </span>
                <button onClick={() => removeLink(r.id)} className="text-xs text-error">
                  Remove
                </button>
              </div>
            ))}
            {recipe.length === 0 && <p className="text-sm text-muted">No ingredients linked yet - this item won't deduct stock.</p>}
          </div>

          <div className="flex gap-2">
            <select value={inventoryItemId} onChange={(e) => setInventoryItemId(e.target.value)} className="flex-1 rounded border border-border p-2 text-sm">
              <option value="">Ingredient…</option>
              {ingredients.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name} ({i.unit})
                </option>
              ))}
            </select>
            <input
              value={quantityRequired}
              onChange={(e) => setQuantityRequired(e.target.value)}
              placeholder="Qty"
              className="w-24 rounded border border-border p-2 text-sm"
            />
            <button onClick={addLink} disabled={!inventoryItemId || !quantityRequired} className="rounded bg-primary px-3 text-sm font-semibold text-white disabled:opacity-40">
              + Add
            </button>
          </div>
          {error && <p className="mt-2 text-sm text-error">{error}</p>}
        </div>
      )}
    </div>
  );
}

export function InventoryPage({ branchId }: { branchId: string }) {
  const [items, setItems] = useState<InventoryItem[] | null>(null);
  const [lowStock, setLowStock] = useState<InventoryItem[] | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[] | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [adjustingItem, setAdjustingItem] = useState<InventoryItem | null>(null);

  const load = () => {
    fetchInventoryItems(branchId).then(setItems);
    fetchLowStockItems(branchId).then(setLowStock);
    fetchAllItemsForAdmin(branchId).then(setMenuItems);
  };

  useEffect(() => {
    setItems(null);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId]);

  if (!items || !lowStock || !menuItems) return <LoadingScreen label="Loading inventory…" />;

  return (
    <div className="p-8">
      <h1 className="mb-6 font-heading text-2xl font-bold">Inventory</h1>

      {lowStock.length > 0 && (
        <div className="mb-6 rounded-lg border border-cooking bg-cooking/10 p-4 text-sm text-cooking">
          <strong>Low stock:</strong> {lowStock.map((i) => `${i.name} (${i.currentStock} ${i.unit})`).join(', ')}
        </div>
      )}

      <section className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold">Ingredients</h2>
          <button onClick={() => setShowAddForm(true)} className="text-sm font-medium text-primary">
            + Add ingredient
          </button>
        </div>
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Reorder at</th>
                <th className="px-4 py-3">Avg. cost/unit</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((i) => (
                <tr key={i.id} className={lowStock.some((l) => l.id === i.id) ? 'bg-cooking/5' : ''}>
                  <td className="px-4 py-3">{i.name}</td>
                  <td className="px-4 py-3">
                    {i.currentStock} {i.unit}
                  </td>
                  <td className="px-4 py-3">
                    {i.reorderThreshold} {i.unit}
                  </td>
                  <td className="px-4 py-3">${Number(i.averageUnitCost).toFixed(4)}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => setAdjustingItem(i)} className="text-xs font-medium text-primary">
                      Adjust
                    </button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-muted">
                    No ingredients yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-heading text-lg font-semibold">Recipes</h2>
        <RecipeEditor menuItems={menuItems} ingredients={items} />
      </section>

      {showAddForm && (
        <Modal title="New ingredient" onClose={() => setShowAddForm(false)}>
          <AddIngredientForm
            branchId={branchId}
            onDone={() => {
              setShowAddForm(false);
              load();
            }}
          />
        </Modal>
      )}
      {adjustingItem && (
        <Modal title={`Adjust ${adjustingItem.name}`} onClose={() => setAdjustingItem(null)}>
          <AdjustStockForm
            item={adjustingItem}
            onDone={() => {
              setAdjustingItem(null);
              load();
            }}
          />
        </Modal>
      )}
    </div>
  );
}
