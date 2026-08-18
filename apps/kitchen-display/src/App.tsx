import { useSession } from './hooks/useSession';
import { LoginScreen } from './pages/LoginScreen';
import { BranchPicker } from './pages/BranchPicker';
import { StationPicker } from './pages/StationPicker';
import { KitchenDisplay } from './pages/KitchenDisplay';

export function App() {
  const session = useSession();

  if (!session) return <LoginScreen />;
  if (!session.branchId) return <BranchPicker session={session} />;
  if (!session.stationId || !session.stationName) return <StationPicker session={session} />;

  return <KitchenDisplay session={{ ...session, stationId: session.stationId, stationName: session.stationName }} />;
}
