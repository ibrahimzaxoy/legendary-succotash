export function ErrorScreen({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex h-full min-h-screen flex-col items-center justify-center gap-4 px-8 text-center">
      <div className="text-4xl">🍽️</div>
      <p className="max-w-[32ch] text-ink">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="rounded-pill bg-primary px-6 py-2.5 font-medium text-white active:bg-primary-dark">
          Try again
        </button>
      )}
    </div>
  );
}
