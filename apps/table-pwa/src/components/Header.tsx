export function Header({ tableNumber, itemCount }: { tableNumber: string; itemCount?: number }) {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-surface/95 px-4 py-3 backdrop-blur">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted">Table</p>
        <h1 className="text-xl font-heading font-semibold leading-tight">{tableNumber}</h1>
      </div>
      {itemCount !== undefined && itemCount > 0 && (
        <div className="flex h-8 min-w-8 items-center justify-center rounded-pill bg-primary px-2 text-sm font-semibold text-white">
          {itemCount}
        </div>
      )}
    </header>
  );
}
