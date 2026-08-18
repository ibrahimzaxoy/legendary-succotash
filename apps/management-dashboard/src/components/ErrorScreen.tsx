export function ErrorScreen({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-8 text-center">
      <div className="text-4xl">⚠️</div>
      <p className="max-w-[40ch] text-muted">{message}</p>
    </div>
  );
}
