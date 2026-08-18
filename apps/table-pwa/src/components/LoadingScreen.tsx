export function LoadingScreen({ label }: { label: string }) {
  return (
    <div className="flex h-full min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
      <p className="text-muted">{label}</p>
    </div>
  );
}
