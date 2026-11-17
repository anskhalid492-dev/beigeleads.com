export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading" className="animate-pulse space-y-4">
      <div className="h-10 w-64 rounded-xl bg-sand-200" />
      <div className="grid gap-4 sm:grid-cols-3"><div className="h-28 rounded-2xl bg-sand-200" /><div className="h-28 rounded-2xl bg-sand-200" /><div className="h-28 rounded-2xl bg-sand-200" /></div>
      <div className="h-64 rounded-2xl bg-sand-200" />
    </div>
  );
}
