"use client";
import { useId, useMemo, useRef, useState } from "react";

type Props = {
  label: string;
  hint?: string;
  value: string[];
  onChange: (v: string[]) => void;
  suggestions?: readonly string[];
  /** Suggestions that exist in the real catalog get a small marker. */
  marked?: ReadonlySet<string>;
  placeholder?: string;
  max?: number;
  allowCustom?: boolean;
  /** Pick one and close (used for the country picker): clears the input after each pick. */
  addLabel?: string;
};

const input = "w-full rounded-xl border border-sand-300 bg-white px-4 py-3 text-base text-forest-900 placeholder:text-forest-500/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600";

/** Searchable multi-select with chips. Keyboard: type to search, Up/Down to move, Enter to add, Backspace to remove the last chip, Escape to close. */
export function ChipInput({ label, hint, value, onChange, suggestions = [], marked, placeholder, max = 20, allowCustom = true }: Props) {
  const id = useId();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const ref = useRef<HTMLInputElement>(null);
  const has = (s: string) => value.some((v) => v.toLowerCase() === s.toLowerCase());

  const options = useMemo(() => {
    const t = q.trim().toLowerCase();
    const list = suggestions.filter((s) => !has(s) && (!t || s.toLowerCase().includes(t))).slice(0, 8);
    const custom = allowCustom && t && !suggestions.some((s) => s.toLowerCase() === t) && !has(q.trim()) ? [q.trim()] : [];
    return [...list.map((s) => ({ s, custom: false })), ...custom.map((s) => ({ s, custom: true }))];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, suggestions, value, allowCustom]);

  const add = (s: string) => {
    const v = s.trim();
    if (!v || has(v) || value.length >= max) return;
    onChange([...value, v]);
    setQ(""); setActive(0);
    ref.current?.focus();
  };

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-forest-900">{label}</label>
      {value.length > 0 && (
        <ul className="mb-2 flex flex-wrap gap-2" aria-label={`Selected: ${label}`}>
          {value.map((v) => (
            <li key={v} className="flex items-center gap-1 rounded-full bg-forest-100 py-1 pl-3 pr-1 text-sm font-semibold text-forest-900">
              {v}
              <button type="button" aria-label={`Remove ${v}`} onClick={() => onChange(value.filter((x) => x !== v))} className="grid size-6 place-items-center rounded-full hover:bg-white focus-visible:outline-2 focus-visible:outline-purple-600">×</button>
            </li>
          ))}
        </ul>
      )}
      <div className="relative">
        <input
          ref={ref} id={id} value={q} placeholder={value.length >= max ? `Up to ${max}` : placeholder} disabled={value.length >= max} autoComplete="off"
          role="combobox" aria-expanded={open && options.length > 0} aria-controls={`${id}-list`} aria-autocomplete="list" aria-activedescendant={open && options[active] ? `${id}-o${active}` : undefined}
          className={input}
          onChange={(e) => { setQ(e.target.value); setOpen(true); setActive(0); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") { e.preventDefault(); setOpen(true); setActive((a) => Math.min(options.length - 1, a + 1)); }
            else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
            else if (e.key === "Enter") { if (open && options[active]) { e.preventDefault(); add(options[active].s); } else if (q.trim() && allowCustom) { e.preventDefault(); add(q); } }
            else if (e.key === "," && allowCustom && q.trim()) { e.preventDefault(); add(q); }
            else if (e.key === "Escape") setOpen(false);
            else if (e.key === "Backspace" && !q && value.length) onChange(value.slice(0, -1));
          }}
        />
        {open && options.length > 0 && (
          <ul id={`${id}-list`} role="listbox" aria-label={`${label} suggestions`} className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-sand-200 bg-white p-1 shadow-lg">
            {options.map((o, i) => (
              <li key={o.s} id={`${id}-o${i}`} role="option" aria-selected={i === active} onMouseDown={(e) => { e.preventDefault(); add(o.s); }} onMouseEnter={() => setActive(i)}
                className={`flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm ${i === active ? "bg-forest-100 text-forest-900" : ""}`}>
                <span>{o.custom ? <>Add “{o.s}”</> : o.s}</span>
                {!o.custom && marked?.has(o.s) && <span className="text-xs font-semibold text-forest-500">In our catalog</span>}
              </li>
            ))}
          </ul>
        )}
      </div>
      {hint && <p className="mt-1.5 text-sm">{hint}</p>}
    </div>
  );
}
