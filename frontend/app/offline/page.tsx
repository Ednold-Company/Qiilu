export default function OfflinePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
      <div className="max-w-md rounded-[2rem] border border-border bg-card p-8 text-center shadow-sm">
        <div className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-primary">Offline</div>
        <h1 className="text-3xl font-bold">Qiilu is temporarily offline</h1>
        <p className="mt-4 text-sm leading-7 text-muted-foreground">
          Your connection dropped. Reconnect to continue booking, dispatching, or managing trips.
        </p>
      </div>
    </main>
  );
}
