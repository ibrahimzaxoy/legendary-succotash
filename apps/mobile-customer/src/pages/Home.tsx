import { useEffect, useState } from 'react';
import { fetchBranches, fetchRestaurant } from '../api/endpoints';
import { ApiError } from '../api/client';
import { loadGuestProfile, loadHistory } from '../utils/storage';
import { LoadingScreen } from '../components/LoadingScreen';
import { ErrorScreen } from '../components/ErrorScreen';
import type { Branch, OrderChannel, Restaurant } from '../api/types';

export function Home({
  restaurantId,
  onContinue,
  onViewHistory,
}: {
  restaurantId: string;
  onContinue: (channel: OrderChannel, branch: Branch, deliveryAddress?: string) => void;
  onViewHistory: () => void;
}) {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [branches, setBranches] = useState<Branch[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [channel, setChannel] = useState<OrderChannel>('mobile_delivery');
  const [branchId, setBranchId] = useState<string | null>(null);
  const [address, setAddress] = useState(loadGuestProfile().address);
  const hasHistory = loadHistory().length > 0;

  useEffect(() => {
    Promise.all([fetchRestaurant(restaurantId), fetchBranches(restaurantId)])
      .then(([r, b]) => {
        setRestaurant(r);
        setBranches(b);
        if (b.length === 1) setBranchId(b[0].id);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Couldn’t reach the server.'));
  }, [restaurantId]);

  if (error) return <ErrorScreen message={error} />;
  if (!restaurant || !branches) return <LoadingScreen label="Loading…" />;

  const selectedBranch = branches.find((b) => b.id === branchId) ?? null;
  const canContinue = selectedBranch && (channel === 'mobile_pickup' || address.trim().length > 4);

  const handleContinue = () => {
    if (!canContinue || !selectedBranch) return;
    onContinue(channel, selectedBranch, channel === 'mobile_delivery' ? address.trim() : undefined);
  };

  return (
    <div className="mx-auto min-h-screen max-w-app bg-surface px-5 pb-28 pt-8">
      <h1 className="font-heading text-2xl font-bold">{restaurant.name}</h1>
      <p className="mt-1 text-muted">Order for delivery or pickup</p>

      {hasHistory && (
        <button onClick={onViewHistory} className="mt-3 text-sm font-medium text-primary">
          View your past orders →
        </button>
      )}

      <div className="mt-6 flex rounded-pill border border-border bg-white p-1">
        {(['mobile_delivery', 'mobile_pickup'] as const).map((c) => (
          <button
            key={c}
            onClick={() => setChannel(c)}
            className={`flex-1 rounded-pill py-2.5 text-sm font-semibold ${
              channel === c ? 'bg-primary text-white' : 'text-ink'
            }`}
          >
            {c === 'mobile_delivery' ? 'Delivery' : 'Pickup'}
          </button>
        ))}
      </div>

      <h2 className="mt-6 font-heading text-lg font-semibold">
        {channel === 'mobile_delivery' ? 'Order from' : 'Pick up from'}
      </h2>
      <div className="mt-2 flex flex-col gap-2">
        {branches.map((branch) => (
          <button
            key={branch.id}
            onClick={() => setBranchId(branch.id)}
            className={`rounded-lg border p-3.5 text-left ${
              branchId === branch.id ? 'border-primary bg-primary-light/30' : 'border-border bg-card'
            }`}
          >
            <p className="font-medium">{branch.name}</p>
            <p className="text-sm text-muted">{branch.address}</p>
          </button>
        ))}
        {branches.length === 0 && <p className="text-muted">No locations available yet.</p>}
      </div>

      {channel === 'mobile_delivery' && selectedBranch && (
        <div className="mt-5">
          <h2 className="font-heading text-lg font-semibold">Delivery address</h2>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Street, unit, city"
            rows={3}
            className="mt-2 w-full rounded-lg border border-border p-3 text-sm outline-primary"
          />
        </div>
      )}

      <button
        onClick={handleContinue}
        disabled={!canContinue}
        className="fixed bottom-4 left-1/2 w-[calc(100%-2.5rem)] max-w-[calc(theme(maxWidth.app)-2.5rem)] -translate-x-1/2 rounded-pill bg-primary py-3.5 font-semibold text-white shadow-lg disabled:opacity-40"
      >
        View menu
      </button>
    </div>
  );
}
