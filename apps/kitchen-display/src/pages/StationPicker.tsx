import { useEffect, useState } from 'react';
import { fetchStations } from '../api/endpoints';
import type { KitchenStation } from '../api/types';
import { setSession } from '../state/sessionStore';
import { LoadingScreen } from '../components/LoadingScreen';
import type { KdsSession } from '../utils/storage';

export function StationPicker({ session }: { session: KdsSession }) {
  const [stations, setStations] = useState<KitchenStation[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStations(session.branchId)
      .then(setStations)
      .catch(() => setError('Couldn’t load kitchen stations.'));
  }, [session.branchId]);

  if (error) return <div className="p-8 text-center text-error">{error}</div>;
  if (!stations) return <LoadingScreen label="Loading stations…" />;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <h1 className="mb-1 text-center font-heading text-2xl font-bold">Which station is this screen?</h1>
      <p className="mb-8 text-center text-muted">It’ll only show tickets routed here.</p>
      <div className="grid w-full max-w-2xl grid-cols-2 gap-4 sm:grid-cols-3">
        {stations.map((station) => (
          <button
            key={station.id}
            onClick={() => setSession({ ...session, stationId: station.id, stationName: station.name })}
            className="rounded-lg border border-border bg-card px-4 py-8 text-center text-xl font-semibold active:bg-cardhover"
          >
            {station.name}
          </button>
        ))}
        {stations.length === 0 && (
          <p className="col-span-full text-center text-muted">
            No kitchen stations set up for this branch yet - add some from the Management Dashboard first.
          </p>
        )}
      </div>
    </div>
  );
}
