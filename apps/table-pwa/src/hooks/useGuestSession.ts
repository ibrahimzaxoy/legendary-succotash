import { useEffect, useState } from 'react';
import { joinTableSession } from '../api/endpoints';
import { ApiError } from '../api/client';
import { loadOrCreateGuestDeviceToken } from '../utils/storage';
import type { GuestSessionState } from '../api/types';

type GuestSessionResult =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; state: GuestSessionState };

// Joins (or rejoins) this table's shared session on load. Always hits the
// network rather than trusting a cached session/guest id, since the
// session may have been closed server-side since the last visit (the table
// was bussed and reseated - see TablesService.setStatus).
export function useGuestSession(tableId: string): GuestSessionResult {
  const [state, setState] = useState<GuestSessionResult>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading' });

    const deviceToken = loadOrCreateGuestDeviceToken(tableId);
    joinTableSession(tableId, deviceToken)
      .then((result) => {
        if (!cancelled) setState({ status: 'ready', state: result });
      })
      .catch((err) => {
        if (cancelled) return;
        const message = err instanceof ApiError ? err.message : 'Couldn’t join this table’s shared cart.';
        setState({ status: 'error', message });
      });

    return () => {
      cancelled = true;
    };
  }, [tableId]);

  return state;
}
