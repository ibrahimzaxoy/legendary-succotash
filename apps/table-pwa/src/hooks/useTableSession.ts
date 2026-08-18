import { useEffect, useState } from 'react';
import { scanTable } from '../api/endpoints';
import { ApiError } from '../api/client';
import { loadTableSession, saveTableSession, type TableSession } from '../utils/storage';

type SessionState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; session: TableSession };

// Validates the table's QR token against the API (GET /tables/:id/scan) and
// persists the result so a page refresh doesn't need network access to
// know which table this device is sitting at.
export function useTableSession(tableIdParam: string | undefined, tokenParam: string | null): SessionState {
  const [state, setState] = useState<SessionState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;

    async function resolve() {
      // No QR params in the URL (e.g. the installed PWA icon was tapped
      // directly) - fall back to whichever table was scanned last.
      if (!tableIdParam || !tokenParam) {
        const cached = loadTableSession();
        if (cached) {
          setState({ status: 'ready', session: cached });
        } else {
          setState({ status: 'error', message: 'Scan the QR code on your table to start ordering.' });
        }
        return;
      }

      try {
        const table = await scanTable(tableIdParam, tokenParam);
        const session: TableSession = {
          tableId: table.id,
          token: tokenParam,
          branchId: table.branchId,
          tableNumber: table.number,
        };
        saveTableSession(session);
        if (!cancelled) setState({ status: 'ready', session });
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof ApiError ? err.message : 'This table code isn’t valid. Ask a staff member for help.';
        setState({ status: 'error', message });
      }
    }

    resolve();
    return () => {
      cancelled = true;
    };
  }, [tableIdParam, tokenParam]);

  return state;
}
