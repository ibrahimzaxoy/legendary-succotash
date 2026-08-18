import { loadHistory } from '../utils/storage';
import { Header } from '../components/Header';

export function History({ onBack, onSelect }: { onBack: () => void; onSelect: (orderId: string) => void }) {
  const history = loadHistory();

  return (
    <div className="mx-auto min-h-screen max-w-app bg-surface pb-8">
      <Header title="Your orders" onBack={onBack} />
      <div className="flex flex-col gap-2 p-5">
        {history.length === 0 && <p className="py-8 text-center text-muted">No orders on this device yet.</p>}
        {history.map((entry) => (
          <button
            key={entry.orderId}
            onClick={() => onSelect(entry.orderId)}
            className="rounded-lg border border-border bg-card p-3.5 text-left"
          >
            <p className="font-medium">{entry.branchName}</p>
            <p className="text-sm text-muted">
              {entry.channel === 'mobile_delivery' ? 'Delivery' : 'Pickup'} ·{' '}
              {new Date(entry.placedAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
