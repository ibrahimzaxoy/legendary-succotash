import { useEffect, useState } from 'react';
import { fetchAccountingSummary, fetchCogs, fetchCustomerRetention, fetchStaffPerformance, fetchTopItems } from '../api/endpoints';
import { StatTile } from '../components/StatTile';
import { BarChart, type BarDatum } from '../components/BarChart';
import { LoadingScreen } from '../components/LoadingScreen';
import type { Branch, CustomerRetentionSummary, StaffPerformanceSummary, TopItemRow } from '../api/types';

// Fixed categorical order (never cycled) - see the dataviz skill's color
// formula. Only the ledger types actually present in the data get a bar.
// Revenue/adjustment types use slots 1-5; the separate Outflows chart below
// uses slots 6-8 for its own (disjoint) set of categories, so no single
// chart ever exceeds the reference palette's 8-slot fixed order.
const REVENUE_TYPE_STYLE: Record<string, { label: string; color: string }> = {
  sale: { label: 'Sales', color: '#2a78d6' },
  tip: { label: 'Tips', color: '#eb6834' },
  tax: { label: 'Tax', color: '#1baf7a' },
  discount: { label: 'Discounts', color: '#eda100' },
  refund: { label: 'Refunds', color: '#e87ba4' },
};

const OUTFLOW_TYPE_STYLE: Record<string, { label: string; color: string }> = {
  expense: { label: 'Expenses', color: '#008300' },
  payroll_payout: { label: 'Payroll', color: '#4a3aa7' },
  supplier_payment: { label: 'Supplier payments', color: '#e34948' },
};

function formatMoney(n: number): string {
  return `$${n.toFixed(2)}`;
}

function defaultRange() {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
}

export function ReportsPage({ branches, selectedBranchId }: { branches: Branch[]; selectedBranchId: string }) {
  const [{ from, to }, setRange] = useState(defaultRange());
  const [totalsByBranch, setTotalsByBranch] = useState<Record<string, Record<string, number>> | null>(null);
  const [cogs, setCogs] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [topItems, setTopItems] = useState<TopItemRow[] | null>(null);
  const [retention, setRetention] = useState<CustomerRetentionSummary | null>(null);
  const [staffPerf, setStaffPerf] = useState<StaffPerformanceSummary | null>(null);

  const targetBranches = selectedBranchId ? branches.filter((b) => b.id === selectedBranchId) : branches;

  useEffect(() => {
    setTotalsByBranch(null);
    setCogs(null);
    setError(null);
    Promise.all(targetBranches.map((b) => fetchAccountingSummary(b.id, from, `${to}T23:59:59`)))
      .then((summaries) => {
        const map: Record<string, Record<string, number>> = {};
        targetBranches.forEach((b, i) => (map[b.id] = summaries[i].totals));
        setTotalsByBranch(map);
      })
      .catch(() => setError('Couldn’t load the report.'));
    Promise.all(targetBranches.map((b) => fetchCogs(b.id, from, `${to}T23:59:59`)))
      .then((results) => setCogs(results.reduce((sum, r) => sum + r.amount, 0)))
      .catch(() => setCogs(0)); // COGS is a bonus figure - don't fail the whole report if it can't load
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBranchId, from, to, branches.length]);

  // Item/customer/staff analytics are single-branch queries server-side
  // (see AnalyticsService) - shown only when one specific branch is
  // selected rather than attempting a cross-branch merge (summing revenue
  // is safe, as above, but re-ranking "top items" or re-averaging staff
  // order values across branches needs real aggregation, not naive
  // addition - out of scope for this pass).
  useEffect(() => {
    if (!selectedBranchId) {
      setTopItems(null);
      setRetention(null);
      setStaffPerf(null);
      return;
    }
    const fromIso = from;
    const toIso = `${to}T23:59:59`;
    fetchTopItems(selectedBranchId, fromIso, toIso, 8).then(setTopItems);
    fetchCustomerRetention(selectedBranchId, fromIso, toIso).then(setRetention);
    fetchStaffPerformance(selectedBranchId, fromIso, toIso).then(setStaffPerf);
  }, [selectedBranchId, from, to]);

  if (error) return <div className="p-8 text-error">{error}</div>;
  if (!totalsByBranch || cogs === null) return <LoadingScreen label="Loading report…" />;

  // Combined totals across whichever branch(es) are in scope.
  const combined: Record<string, number> = {};
  for (const totals of Object.values(totalsByBranch)) {
    for (const [type, amount] of Object.entries(totals)) {
      combined[type] = (combined[type] ?? 0) + amount;
    }
  }
  const presentRevenueTypes = Object.keys(REVENUE_TYPE_STYLE).filter((t) => combined[t] !== undefined);
  const breakdownData: BarDatum[] = presentRevenueTypes.map((t) => ({
    label: REVENUE_TYPE_STYLE[t].label,
    value: combined[t],
    color: REVENUE_TYPE_STYLE[t].color,
  }));

  const presentOutflowTypes = Object.keys(OUTFLOW_TYPE_STYLE).filter((t) => combined[t] !== undefined);
  const outflowData: BarDatum[] = presentOutflowTypes.map((t) => ({
    label: OUTFLOW_TYPE_STYLE[t].label,
    value: combined[t],
    color: OUTFLOW_TYPE_STYLE[t].color,
  }));

  const branchComparisonData: BarDatum[] =
    targetBranches.length > 1
      ? targetBranches.map((b) => ({ label: b.name, value: totalsByBranch[b.id]?.sale ?? 0, color: '#2a78d6' }))
      : [];

  // Net Sales = Sales + Tips − Discounts − Refunds.
  // Gross Profit = Net Sales − COGS (from the Inventory module's recipe deductions).
  // Net Profit = Gross Profit − Expenses − Payroll − Supplier Payments ± Cash Variance.
  const cashVariance = combined.cash_drawer_variance ?? 0;
  const netSales = (combined.sale ?? 0) + (combined.tip ?? 0) - (combined.discount ?? 0) - (combined.refund ?? 0);
  const grossProfit = netSales - cogs;
  const netProfit = grossProfit - (combined.expense ?? 0) - (combined.payroll_payout ?? 0) - (combined.supplier_payment ?? 0) + cashVariance;

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold">
          {selectedBranchId ? 'Reports' : `Reports · All ${branches.length} branches`}
        </h1>
        <div className="flex items-center gap-2 text-sm">
          <input type="date" value={from} onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))} className="rounded border border-border p-1.5" />
          <span className="text-muted">to</span>
          <input type="date" value={to} onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))} className="rounded border border-border p-1.5" />
        </div>
      </div>

      <div className="mb-6 grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3">
        <StatTile label="Net profit" value={formatMoney(netProfit)} />
        <StatTile label="Gross profit" value={formatMoney(grossProfit)} />
        <StatTile label="COGS" value={formatMoney(cogs)} />
        <StatTile label="Total sales" value={formatMoney(combined.sale ?? 0)} />
        {presentRevenueTypes
          .filter((t) => t !== 'sale')
          .map((t) => (
            <StatTile key={t} label={REVENUE_TYPE_STYLE[t].label} value={formatMoney(combined[t])} />
          ))}
        {presentOutflowTypes.map((t) => (
          <StatTile key={t} label={OUTFLOW_TYPE_STYLE[t].label} value={formatMoney(combined[t])} />
        ))}
        {combined.cash_drawer_variance !== undefined && (
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-sm text-muted">Cash variance</p>
            <p className={`mt-1 font-heading text-2xl font-semibold ${cashVariance === 0 ? '' : cashVariance > 0 ? 'text-success' : 'text-error'}`}>
              {formatMoney(cashVariance)}
            </p>
          </div>
        )}
      </div>

      {breakdownData.length === 0 && outflowData.length === 0 ? (
        <p className="text-muted">No financial activity recorded in this date range yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {breakdownData.length > 0 && (
            <div className="rounded-lg border border-border bg-card p-5">
              <h2 className="mb-4 font-heading text-base font-semibold">Sales breakdown</h2>
              <BarChart data={breakdownData} formatValue={formatMoney} />
            </div>
          )}
          {outflowData.length > 0 && (
            <div className="rounded-lg border border-border bg-card p-5">
              <h2 className="mb-4 font-heading text-base font-semibold">Outflows</h2>
              <BarChart data={outflowData} formatValue={formatMoney} />
            </div>
          )}
          {branchComparisonData.length > 0 && (
            <div className="rounded-lg border border-border bg-card p-5">
              <h2 className="mb-4 font-heading text-base font-semibold">Sales by branch</h2>
              <BarChart data={branchComparisonData} formatValue={formatMoney} />
            </div>
          )}
        </div>
      )}

      {selectedBranchId ? (
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {topItems && topItems.length > 0 && (
            <div className="rounded-lg border border-border bg-card p-5">
              <h2 className="mb-4 font-heading text-base font-semibold">Top items by revenue</h2>
              <BarChart data={topItems.map((i): BarDatum => ({ label: i.name, value: i.revenue, color: '#2a78d6' }))} formatValue={formatMoney} />
            </div>
          )}

          {retention && (retention.newCustomers > 0 || retention.repeatCustomers > 0) && (
            <div className="rounded-lg border border-border bg-card p-5">
              <h2 className="mb-4 font-heading text-base font-semibold">Customer retention</h2>
              <div className="grid grid-cols-2 gap-3">
                <StatTile label="New customers" value={String(retention.newCustomers)} />
                <StatTile label="Repeat customers" value={String(retention.repeatCustomers)} />
                <StatTile label="Revenue from new" value={formatMoney(retention.newRevenue)} />
                <StatTile label="Revenue from repeat" value={formatMoney(retention.repeatRevenue)} />
              </div>
            </div>
          )}

          {staffPerf && staffPerf.waiters.length > 0 && (
            <div className="rounded-lg border border-border bg-card p-5">
              <h2 className="mb-4 font-heading text-base font-semibold">Orders taken by waiter</h2>
              <BarChart data={staffPerf.waiters.map((s): BarDatum => ({ label: s.fullName, value: s.orderCount, color: '#2a78d6' }))} formatValue={(v) => String(Math.round(v))} />
              <div className="mt-3 flex flex-col gap-1 text-xs text-muted">
                {staffPerf.waiters.map((s) => (
                  <div key={s.staffId} className="flex justify-between">
                    <span>{s.fullName}</span>
                    <span>avg {formatMoney(s.avgOrderValue)}/order</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {staffPerf && staffPerf.cashiers.length > 0 && (
            <div className="rounded-lg border border-border bg-card p-5">
              <h2 className="mb-4 font-heading text-base font-semibold">Checks closed by cashier</h2>
              <BarChart data={staffPerf.cashiers.map((s): BarDatum => ({ label: s.fullName, value: s.orderCount, color: '#eb6834' }))} formatValue={(v) => String(Math.round(v))} />
              <div className="mt-3 flex flex-col gap-1 text-xs text-muted">
                {staffPerf.cashiers.map((s) => (
                  <div key={s.staffId} className="flex justify-between">
                    <span>{s.fullName}</span>
                    <span>avg {formatMoney(s.avgOrderValue)}/check</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <p className="mt-6 text-sm text-muted">Select a specific branch to see item, staff, and customer analytics.</p>
      )}
    </div>
  );
}
