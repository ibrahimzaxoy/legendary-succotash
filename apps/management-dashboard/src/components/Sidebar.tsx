import { setSession } from '../state/store';
import { setSelectedBranchId } from '../state/store';
import type { Branch, Restaurant, StaffSummary } from '../api/types';

export type Tab =
  | 'reports'
  | 'menu'
  | 'tables'
  | 'staff'
  | 'orders'
  | 'shifts'
  | 'payroll'
  | 'expenses'
  | 'suppliers'
  | 'cash'
  | 'inventory'
  | 'printers'
  | 'promotions';

const TABS: { id: Tab; label: string }[] = [
  { id: 'reports', label: 'Reports' },
  { id: 'orders', label: 'Live Orders' },
  { id: 'menu', label: 'Menu' },
  { id: 'tables', label: 'Tables' },
  { id: 'staff', label: 'Staff' },
  { id: 'shifts', label: 'Shifts & Attendance' },
  { id: 'payroll', label: 'Payroll' },
  { id: 'expenses', label: 'Expenses' },
  { id: 'suppliers', label: 'Suppliers' },
  { id: 'inventory', label: 'Inventory' },
  { id: 'cash', label: 'Cash Sessions' },
  { id: 'printers', label: 'Printers' },
  { id: 'promotions', label: 'Promotions' },
];

export function Sidebar({
  restaurant,
  branches,
  selectedBranchId,
  staff,
  activeTab,
  onSelectTab,
}: {
  restaurant: Restaurant;
  branches: Branch[];
  selectedBranchId: string;
  staff: StaffSummary;
  activeTab: Tab;
  onSelectTab: (tab: Tab) => void;
}) {
  // Branch-scoped staff (most managers) only ever see their own branch;
  // owner/admin (branchId: null) get the full switcher including "All branches".
  const canSwitchBranches = staff.branchId === null;

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-border bg-card">
      <div className="border-b border-border p-5">
        <h1 className="font-heading text-lg font-bold leading-tight">{restaurant.name}</h1>
        <p className="text-sm text-muted">{staff.fullName}</p>
      </div>

      <div className="border-b border-border p-4">
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">Branch</label>
        {canSwitchBranches ? (
          <select
            value={selectedBranchId}
            onChange={(e) => setSelectedBranchId(e.target.value)}
            className="w-full rounded border border-border bg-surface px-2.5 py-2 text-sm"
          >
            <option value="">All branches</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        ) : (
          <p className="rounded border border-border bg-surface px-2.5 py-2 text-sm">
            {branches.find((b) => b.id === selectedBranchId)?.name ?? '—'}
          </p>
        )}
      </div>

      <nav className="flex-1 p-3">
        {TABS.map((tab) => {
          // "Reports" is the only tab that makes sense with "All branches"
          // selected (it aggregates); everything else needs one specific branch.
          const disabled = tab.id !== 'reports' && selectedBranchId === '';
          return (
            <button
              key={tab.id}
              disabled={disabled}
              onClick={() => onSelectTab(tab.id)}
              className={`mb-1 w-full rounded px-3 py-2.5 text-left text-sm font-medium disabled:opacity-30 ${
                activeTab === tab.id ? 'bg-primary/10 text-primary' : 'text-ink hover:bg-surface'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>

      <div className="border-t border-border p-4">
        <button onClick={() => setSession(null)} className="text-sm text-muted">
          Sign out
        </button>
      </div>
    </aside>
  );
}
