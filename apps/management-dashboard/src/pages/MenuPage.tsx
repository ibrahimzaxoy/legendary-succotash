import { useEffect, useState } from 'react';
import {
  createCategory,
  createItem,
  deleteCategory,
  deleteItem,
  fetchAllItemsForAdmin,
  fetchCategories,
  fetchStations,
  setItemAvailability,
  updateCategory,
  updateItem,
} from '../api/endpoints';
import { ApiError } from '../api/client';
import { Modal } from '../components/Modal';
import { LoadingScreen } from '../components/LoadingScreen';
import type { KitchenStation, MenuCategory, MenuItem } from '../api/types';

export function MenuPage({ branchId }: { branchId: string }) {
  const [categories, setCategories] = useState<MenuCategory[] | null>(null);
  const [items, setItems] = useState<MenuItem[] | null>(null);
  const [stations, setStations] = useState<KitchenStation[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [editingCategory, setEditingCategory] = useState<MenuCategory | 'new' | null>(null);
  const [editingItem, setEditingItem] = useState<MenuItem | 'new' | null>(null);

  const load = () => {
    fetchCategories(branchId).then(setCategories);
    fetchAllItemsForAdmin(branchId).then(setItems);
    fetchStations(branchId).then(setStations);
  };

  useEffect(() => {
    setCategories(null);
    setItems(null);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId]);

  const handleDeleteCategory = async (category: MenuCategory) => {
    const itemCount = items?.filter((i) => i.categoryId === category.id).length ?? 0;
    const warning = itemCount > 0 ? ` This will also delete its ${itemCount} item(s), unless any have order history.` : '';
    if (!confirm(`Delete category "${category.name}"?${warning}`)) return;
    try {
      await deleteCategory(category.id);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Couldn’t delete this category.');
    }
  };

  const handleDeleteItem = async (item: MenuItem) => {
    if (!confirm(`Delete "${item.name}"?`)) return;
    try {
      await deleteItem(item.id);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Couldn’t delete this item.');
    }
  };

  const handleToggleAvailability = async (item: MenuItem) => {
    try {
      await setItemAvailability(item.id, !item.isAvailable);
      load();
    } catch {
      setError('Couldn’t update availability.');
    }
  };

  if (!categories || !items || !stations) return <LoadingScreen label="Loading menu…" />;

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold">Menu</h1>
        <div className="flex gap-2">
          <button onClick={() => setEditingCategory('new')} className="rounded border border-border bg-card px-4 py-2 font-medium">
            + Category
          </button>
          <button
            onClick={() => setEditingItem('new')}
            disabled={categories.length === 0 || stations.length === 0}
            className="rounded bg-primary px-4 py-2 font-medium text-white disabled:opacity-40"
          >
            + Item
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-center justify-between rounded bg-error/10 px-4 py-2 text-sm text-error">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="font-semibold">
            Dismiss
          </button>
        </div>
      )}

      {stations.length === 0 && (
        <p className="mb-4 rounded bg-cooking/10 px-4 py-2 text-sm text-cooking">
          No kitchen stations set up for this branch yet - items need one to route to the kitchen.
        </p>
      )}

      {categories.length === 0 && <p className="text-muted">No categories yet - add one to start building the menu.</p>}

      {categories.map((category) => (
        <section key={category.id} className="mb-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-heading text-lg font-semibold">{category.name}</h2>
            <div className="flex gap-3 text-sm">
              <button onClick={() => setEditingCategory(category)} className="text-primary">
                Rename
              </button>
              <button onClick={() => handleDeleteCategory(category)} className="text-error">
                Delete
              </button>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-2.5">Item</th>
                  <th className="px-4 py-2.5">Station</th>
                  <th className="px-4 py-2.5">Price</th>
                  <th className="px-4 py-2.5">Channels</th>
                  <th className="px-4 py-2.5">Available</th>
                  <th className="px-4 py-2.5"></th>
                </tr>
              </thead>
              <tbody>
                {items
                  .filter((i) => i.categoryId === category.id)
                  .map((item) => (
                    <tr key={item.id} className="border-t border-border">
                      <td className="px-4 py-2.5 font-medium">{item.name}</td>
                      <td className="px-4 py-2.5 text-muted">{item.kitchenStation?.name}</td>
                      <td className="px-4 py-2.5">${Number(item.basePrice).toFixed(2)}</td>
                      <td className="px-4 py-2.5 text-xs text-muted">
                        {[item.availableDineIn && 'Dine-in', item.availablePickup && 'Pickup', item.availableDelivery && 'Delivery']
                          .filter(Boolean)
                          .join(', ') || '—'}
                      </td>
                      <td className="px-4 py-2.5">
                        <button
                          onClick={() => handleToggleAvailability(item)}
                          className={`rounded-pill px-2.5 py-0.5 text-xs font-semibold ${
                            item.isAvailable ? 'bg-success/10 text-success' : 'bg-error/10 text-error'
                          }`}
                        >
                          {item.isAvailable ? 'Available' : '86’d'}
                        </button>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <button onClick={() => setEditingItem(item)} className="mr-3 text-primary">
                          Edit
                        </button>
                        <button onClick={() => handleDeleteItem(item)} className="text-error">
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                {items.filter((i) => i.categoryId === category.id).length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-4 text-center text-muted">
                      No items in this category.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      ))}

      {editingCategory && (
        <CategoryModal
          branchId={branchId}
          category={editingCategory === 'new' ? null : editingCategory}
          onClose={() => setEditingCategory(null)}
          onSaved={() => {
            setEditingCategory(null);
            load();
          }}
        />
      )}
      {editingItem && (
        <ItemModal
          branchId={branchId}
          categories={categories}
          stations={stations}
          item={editingItem === 'new' ? null : editingItem}
          onClose={() => setEditingItem(null)}
          onSaved={() => {
            setEditingItem(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function CategoryModal({
  branchId,
  category,
  onClose,
  onSaved,
}: {
  branchId: string;
  category: MenuCategory | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(category?.name ?? '');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      if (category) await updateCategory(category.id, { name: name.trim() });
      else await createCategory({ branchId, name: name.trim() });
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Couldn’t save this category.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal title={category ? 'Rename category' : 'New category'} onClose={onClose}>
      <div className="flex flex-col gap-3">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Category name" className="rounded border border-border p-2.5" />
        {error && <p className="text-sm text-error">{error}</p>}
        <button onClick={submit} disabled={!name.trim() || submitting} className="rounded bg-primary py-2.5 font-semibold text-white disabled:opacity-40">
          {submitting ? 'Saving…' : 'Save'}
        </button>
      </div>
    </Modal>
  );
}

interface VariantDraft {
  name: string;
  priceDelta: string;
  isDefault: boolean;
}
interface OptionDraft {
  name: string;
  priceDelta: string;
}
interface GroupDraft {
  name: string;
  isRequired: boolean;
  minSelect: number;
  maxSelect: number;
  options: OptionDraft[];
}

function ItemModal({
  branchId,
  categories,
  stations,
  item,
  onClose,
  onSaved,
}: {
  branchId: string;
  categories: MenuCategory[];
  stations: KitchenStation[];
  item: MenuItem | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(item?.name ?? '');
  const [description, setDescription] = useState(item?.description ?? '');
  const [basePrice, setBasePrice] = useState(item?.basePrice ?? '');
  const [categoryId, setCategoryId] = useState(item?.categoryId ?? categories[0]?.id ?? '');
  const [kitchenStationId, setKitchenStationId] = useState(item?.kitchenStationId ?? stations[0]?.id ?? '');
  const [availableDineIn, setAvailableDineIn] = useState(item?.availableDineIn ?? true);
  const [availablePickup, setAvailablePickup] = useState(item?.availablePickup ?? true);
  const [availableDelivery, setAvailableDelivery] = useState(item?.availableDelivery ?? true);
  const [variants, setVariants] = useState<VariantDraft[]>([]);
  const [groups, setGroups] = useState<GroupDraft[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = name.trim() && basePrice.trim() && categoryId && kitchenStationId;

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      if (item) {
        await updateItem(item.id, {
          name: name.trim(),
          description: description.trim() || undefined,
          basePrice: basePrice.trim(),
          categoryId,
          kitchenStationId,
          availableDineIn,
          availablePickup,
          availableDelivery,
        });
      } else {
        await createItem({
          branchId,
          categoryId,
          kitchenStationId,
          name: name.trim(),
          description: description.trim() || undefined,
          basePrice: basePrice.trim(),
          availableDineIn,
          availablePickup,
          availableDelivery,
          variants: variants.filter((v) => v.name.trim()).map((v) => ({ ...v, priceDelta: v.priceDelta || '0' })),
          modifierGroups: groups
            .filter((g) => g.name.trim())
            .map((g) => ({ ...g, options: g.options.filter((o) => o.name.trim()).map((o) => ({ ...o, priceDelta: o.priceDelta || '0' })) })),
        });
      }
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Couldn’t save this item.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal title={item ? `Edit ${item.name}` : 'New menu item'} onClose={onClose}>
      <div className="flex flex-col gap-3">
        <label className="text-sm font-medium">
          Name
          <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded border border-border p-2.5" />
        </label>
        <label className="text-sm font-medium">
          Description
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="mt-1 w-full rounded border border-border p-2.5" />
        </label>
        <div className="flex gap-3">
          <label className="flex-1 text-sm font-medium">
            Base price
            <input value={basePrice} onChange={(e) => setBasePrice(e.target.value)} placeholder="0.00" className="mt-1 w-full rounded border border-border p-2.5" />
          </label>
          <label className="flex-1 text-sm font-medium">
            Category
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="mt-1 w-full rounded border border-border p-2.5">
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="text-sm font-medium">
          Kitchen station
          <select value={kitchenStationId} onChange={(e) => setKitchenStationId(e.target.value)} className="mt-1 w-full rounded border border-border p-2.5">
            {stations.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>

        <div className="flex gap-4 text-sm">
          <label className="flex items-center gap-1.5">
            <input type="checkbox" checked={availableDineIn} onChange={(e) => setAvailableDineIn(e.target.checked)} />
            Dine-in
          </label>
          <label className="flex items-center gap-1.5">
            <input type="checkbox" checked={availablePickup} onChange={(e) => setAvailablePickup(e.target.checked)} />
            Pickup
          </label>
          <label className="flex items-center gap-1.5">
            <input type="checkbox" checked={availableDelivery} onChange={(e) => setAvailableDelivery(e.target.checked)} />
            Delivery
          </label>
        </div>

        {!item && (
          <>
            <VariantsEditor variants={variants} setVariants={setVariants} />
            <ModifierGroupsEditor groups={groups} setGroups={setGroups} />
          </>
        )}
        {item && (item.variants.length > 0 || item.modifierGroups.length > 0) && (
          <p className="rounded bg-surface p-2.5 text-xs text-muted">
            Variants and modifier groups aren’t editable after creation yet - delete and recreate the item to change them.
          </p>
        )}

        {error && <p className="text-sm text-error">{error}</p>}
        <button onClick={submit} disabled={!canSubmit || submitting} className="mt-1 rounded bg-primary py-2.5 font-semibold text-white disabled:opacity-40">
          {submitting ? 'Saving…' : item ? 'Save changes' : 'Create item'}
        </button>
      </div>
    </Modal>
  );
}

function VariantsEditor({ variants, setVariants }: { variants: VariantDraft[]; setVariants: (v: VariantDraft[]) => void }) {
  return (
    <div>
      <p className="text-sm font-medium">Variants (e.g. sizes) - optional</p>
      {variants.map((v, i) => (
        <div key={i} className="mt-1.5 flex items-center gap-2">
          <input
            value={v.name}
            onChange={(e) => setVariants(variants.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
            placeholder="Name"
            className="flex-1 rounded border border-border p-2 text-sm"
          />
          <input
            value={v.priceDelta}
            onChange={(e) => setVariants(variants.map((x, j) => (j === i ? { ...x, priceDelta: e.target.value } : x)))}
            placeholder="+0.00"
            className="w-24 rounded border border-border p-2 text-sm"
          />
          <button onClick={() => setVariants(variants.filter((_, j) => j !== i))} className="text-error">
            ✕
          </button>
        </div>
      ))}
      <button onClick={() => setVariants([...variants, { name: '', priceDelta: '0', isDefault: variants.length === 0 }])} className="mt-1.5 text-sm text-primary">
        + Add variant
      </button>
    </div>
  );
}

function ModifierGroupsEditor({ groups, setGroups }: { groups: GroupDraft[]; setGroups: (g: GroupDraft[]) => void }) {
  const addGroup = () => setGroups([...groups, { name: '', isRequired: false, minSelect: 1, maxSelect: 1, options: [] }]);
  const updateGroup = (i: number, patch: Partial<GroupDraft>) => setGroups(groups.map((g, j) => (j === i ? { ...g, ...patch } : g)));
  const addOption = (i: number) => updateGroup(i, { options: [...groups[i].options, { name: '', priceDelta: '0' }] });
  const updateOption = (i: number, oi: number, patch: Partial<OptionDraft>) =>
    updateGroup(i, { options: groups[i].options.map((o, j) => (j === oi ? { ...o, ...patch } : o)) });

  return (
    <div>
      <p className="text-sm font-medium">Modifier groups (e.g. toppings) - optional</p>
      {groups.map((g, i) => (
        <div key={i} className="mt-2 rounded border border-border p-3">
          <div className="flex items-center gap-2">
            <input
              value={g.name}
              onChange={(e) => updateGroup(i, { name: e.target.value })}
              placeholder="Group name"
              className="flex-1 rounded border border-border p-2 text-sm"
            />
            <label className="flex items-center gap-1 text-xs">
              <input type="checkbox" checked={g.isRequired} onChange={(e) => updateGroup(i, { isRequired: e.target.checked })} />
              Required
            </label>
            <input
              type="number"
              min={1}
              value={g.maxSelect}
              onChange={(e) => updateGroup(i, { maxSelect: Number(e.target.value) })}
              title="Max selections"
              className="w-14 rounded border border-border p-2 text-xs"
            />
            <button onClick={() => setGroups(groups.filter((_, j) => j !== i))} className="text-error">
              ✕
            </button>
          </div>
          {g.options.map((o, oi) => (
            <div key={oi} className="mt-1.5 ml-4 flex items-center gap-2">
              <input
                value={o.name}
                onChange={(e) => updateOption(i, oi, { name: e.target.value })}
                placeholder="Option name"
                className="flex-1 rounded border border-border p-1.5 text-sm"
              />
              <input
                value={o.priceDelta}
                onChange={(e) => updateOption(i, oi, { priceDelta: e.target.value })}
                placeholder="+0.00"
                className="w-20 rounded border border-border p-1.5 text-sm"
              />
              <button
                onClick={() => updateGroup(i, { options: g.options.filter((_, j) => j !== oi) })}
                className="text-error"
              >
                ✕
              </button>
            </div>
          ))}
          <button onClick={() => addOption(i)} className="ml-4 mt-1.5 text-xs text-primary">
            + Add option
          </button>
        </div>
      ))}
      <button onClick={addGroup} className="mt-1.5 text-sm text-primary">
        + Add modifier group
      </button>
    </div>
  );
}
