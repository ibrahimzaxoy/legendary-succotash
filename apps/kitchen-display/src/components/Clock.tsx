import { useEffect, useState } from 'react';

// Isolated in its own component so its per-second re-render doesn't cascade
// into the ticket grid.
export function Clock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return <span className="tabular-nums text-muted">{now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>;
}
