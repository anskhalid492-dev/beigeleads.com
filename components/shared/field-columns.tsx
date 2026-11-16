export function FieldColumns({ fields }: { fields: readonly string[] }) {
  return (
    <div className="overflow-x-auto">
      <div
        className="grid min-w-[44rem] overflow-hidden rounded-lg border border-forest-900 bg-white text-center"
        style={{ gridTemplateColumns: `repeat(${fields.length}, minmax(0, 1fr))` }}
      >
        {fields.map((f, i) => (
          <div key={f} className="border-r border-forest-900 last:border-r-0">
            <div className="border-b border-forest-900 bg-sand-200 py-1 text-xs font-semibold text-forest-700">
              {String.fromCharCode(65 + i)}
            </div>
            <div className="px-2 py-4 text-sm font-semibold text-forest-900">{f}</div>
            <div className="space-y-2 pb-4">
              <div className="mx-auto h-2 w-3/4 rounded bg-sand-200" />
              <div className="mx-auto h-2 w-2/3 rounded bg-sand-200" />
              <div className="mx-auto h-2 w-4/5 rounded bg-sand-200" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
