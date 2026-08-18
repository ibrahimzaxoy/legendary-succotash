export function Header({
  title,
  subtitle,
  onBack,
  itemCount,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  itemCount?: number;
}) {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-surface/95 px-4 py-3 backdrop-blur">
      <div className="flex items-center gap-2">
        {onBack && (
          <button onClick={onBack} className="text-lg text-muted">
            ←
          </button>
        )}
        <div>
          {subtitle && <p className="text-xs font-medium uppercase tracking-wide text-muted">{subtitle}</p>}
          <h1 className="font-heading text-xl font-semibold leading-tight">{title}</h1>
        </div>
      </div>
      {itemCount !== undefined && itemCount > 0 && (
        <div className="flex h-8 min-w-8 items-center justify-center rounded-pill bg-primary px-2 text-sm font-semibold text-white">
          {itemCount}
        </div>
      )}
    </header>
  );
}
