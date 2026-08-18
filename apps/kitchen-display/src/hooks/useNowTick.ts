import { useEffect, useState } from 'react';

// A single shared "now" that ticks periodically, so every ticket card's
// elapsed-time/urgency color recomputes together without each card running
// its own timer.
export function useNowTick(intervalMs = 15000): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return now;
}
