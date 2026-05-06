export function Spinner({ label = "Ładowanie…" }: { label?: string }) {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-neutral-500 text-sm">{label}</div>
    </div>
  );
}
