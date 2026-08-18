const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'];

export function NumPad({ onDigit, onBackspace }: { onDigit: (d: string) => void; onBackspace: () => void }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {KEYS.map((key, i) =>
        key === '' ? (
          <div key={i} />
        ) : (
          <button
            key={i}
            onClick={() => (key === '⌫' ? onBackspace() : onDigit(key))}
            className="rounded-lg border border-border bg-card py-5 text-2xl font-semibold active:bg-primary-light/40"
          >
            {key}
          </button>
        ),
      )}
    </div>
  );
}
