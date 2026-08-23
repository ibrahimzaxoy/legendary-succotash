import { useEffect, useState } from 'react';
import { useSession } from './hooks/useSession';
import { useSelectedBranchId } from './hooks/useSelectedBranch';
import { useBranches } from './hooks/useBranches';
import { setSelectedBranchId } from './state/store';
import { Login } from './pages/Login';
import { LoadingScreen } from './components/LoadingScreen';
import { ErrorScreen } from './components/ErrorScreen';
import { Sidebar, type Tab } from './components/Sidebar';
import { ReportsPage } from './pages/ReportsPage';
import { OrdersPage } from './pages/OrdersPage';
import { MenuPage } from './pages/MenuPage';
import { TablesPage } from './pages/TablesPage';
import { StaffPage } from './pages/StaffPage';
import { ShiftsPage } from './pages/ShiftsPage';
import { PayrollPage } from './pages/PayrollPage';
import { ExpensesPage } from './pages/ExpensesPage';
import { SuppliersPage } from './pages/SuppliersPage';
import { CashSessionsPage } from './pages/CashSessionsPage';
import { InventoryPage } from './pages/InventoryPage';
import { PrintersPage } from './pages/PrintersPage';
import { PromotionsPage } from './pages/PromotionsPage';

export function App() {
  const session = useSession();
  const selectedBranchId = useSelectedBranchId();
  const [tab, setTab] = useState<Tab>('reports');

  if (!session) return <Login />;

  return <DashboardShell restaurantId={session.staff.restaurantId} branchId={selectedBranchId} tab={tab} onTabChange={setTab} />;
}

function DashboardShell({
  restaurantId,
  branchId,
  tab,
  onTabChange,
}: {
  restaurantId: string;
  branchId: string;
  tab: Tab;
  onTabChange: (tab: Tab) => void;
}) {
  const session = useSession()!;
  const branchesState = useBranches(restaurantId);

  // First load: pin branch-scoped staff to their own branch; let
  // owner/admin start on "All branches" unless they'd already picked one.
  useEffect(() => {
    if (branchesState.status !== 'ready') return;
    if (branchId && branchesState.branches.some((b) => b.id === branchId)) return;
    if (session.staff.branchId) setSelectedBranchId(session.staff.branchId);
  }, [branchesState, branchId, session.staff.branchId]);

  if (branchesState.status === 'loading') return <LoadingScreen label="Loading…" />;
  if (branchesState.status === 'error') return <ErrorScreen message={branchesState.message} />;

  const { restaurant, branches } = branchesState;
  const effectiveTab: Tab = branchId === '' && tab !== 'reports' ? 'reports' : tab;

  return (
    <div className="flex">
      <Sidebar
        restaurant={restaurant}
        branches={branches}
        selectedBranchId={branchId}
        staff={session.staff}
        activeTab={effectiveTab}
        onSelectTab={onTabChange}
      />
      <main className="min-h-screen flex-1 overflow-x-hidden">
        {effectiveTab === 'reports' && <ReportsPage branches={branches} selectedBranchId={branchId} />}
        {effectiveTab === 'orders' && branchId && <OrdersPage branchId={branchId} />}
        {effectiveTab === 'menu' && branchId && <MenuPage branchId={branchId} />}
        {effectiveTab === 'tables' && branchId && <TablesPage branchId={branchId} />}
        {effectiveTab === 'staff' && branchId && <StaffPage restaurantId={restaurantId} branchId={branchId} />}
        {effectiveTab === 'shifts' && branchId && <ShiftsPage branchId={branchId} />}
        {effectiveTab === 'payroll' && branchId && <PayrollPage branchId={branchId} />}
        {effectiveTab === 'expenses' && branchId && <ExpensesPage restaurantId={restaurantId} branchId={branchId} />}
        {effectiveTab === 'suppliers' && branchId && <SuppliersPage restaurantId={restaurantId} branchId={branchId} />}
        {effectiveTab === 'cash' && branchId && <CashSessionsPage branchId={branchId} />}
        {effectiveTab === 'inventory' && branchId && <InventoryPage branchId={branchId} />}
        {effectiveTab === 'printers' && branchId && <PrintersPage branchId={branchId} />}
        {effectiveTab === 'promotions' && branchId && <PromotionsPage restaurantId={restaurantId} />}
      </main>
    </div>
  );
}
