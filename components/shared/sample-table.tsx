import { Lock } from "lucide-react";
import { sampleColumns, type SampleRow } from "@/lib/sample-data";

export function SampleTable({ rows }: { rows: readonly SampleRow[] }) {
  return (
    <div className="rounded-xl border-2 border-forest-900 bg-white shadow-[6px_6px_0_0_var(--color-forest-900)]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[34rem] text-left text-sm">
          <thead>
            <tr className="border-b border-sand-200 text-forest-500">
              {sampleColumns.map((c) => (
                <th key={c} scope="col" className="px-4 py-2.5 font-semibold">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r[0]} className="border-b border-sand-200">
                <td className="px-4 py-3 font-medium text-forest-900">{r[0]}</td>
                <td className="px-4 py-3">{r[1]}</td>
                <td className="whitespace-nowrap px-4 py-3 tabular-nums">{r[2]}</td>
                <td className="whitespace-nowrap px-4 py-3 tabular-nums">{r[3]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center gap-2 bg-forest-900 px-4 py-3 text-sm text-sand-100">
        <Lock className="size-4 shrink-0" aria-hidden />
        <span>Emails stay masked until you buy. The full file has every row, unmasked.</span>
      </div>
      <p className="border-t border-sand-200 px-4 py-2 text-xs text-forest-500">
        Layout preview with placeholder rows. Not real businesses.
      </p>
    </div>
  );
}
