import { useEffect, useId, useState } from 'react'

interface Props {
  value: string
  onChange: (value: string) => void
  options: string[]
  placeholder?: string
  createLabel: string
}

/**
 * Type-to-filter select that also lets the merchant create a brand-new
 * option on the spot (e.g. a "Breakfast" category that doesn't exist yet)
 * instead of being locked to a fixed dropdown.
 */
export function Combobox({ value, onChange, options, placeholder, createLabel }: Props) {
  const id = useId()
  const [draft, setDraft] = useState(value)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setDraft(value)
  }, [value])

  const query = draft.trim().toLowerCase()
  const filtered = query ? options.filter((o) => o.toLowerCase().includes(query)) : options
  const exactMatch = options.some((o) => o.toLowerCase() === query)
  const canCreate = draft.trim().length > 0 && !exactMatch

  function commit(next: string) {
    const trimmed = next.trim()
    if (!trimmed) return
    setDraft(trimmed)
    onChange(trimmed)
    setOpen(false)
  }

  return (
    <div className="relative">
      <input
        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
        placeholder={placeholder}
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => commit(draft || value), 120)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            commit(draft)
          }
        }}
        aria-expanded={open}
        aria-controls={id}
      />
      {open && (filtered.length > 0 || canCreate) && (
        <ul id={id} className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg">
          {filtered.map((opt) => (
            <li key={opt}>
              <button
                type="button"
                className={`block w-full px-3 py-2 text-left text-sm hover:bg-orange-50 ${opt === value ? 'bg-orange-50 font-medium text-orange-700' : 'text-slate-700'}`}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => commit(opt)}
              >
                {opt}
              </button>
            </li>
          ))}
          {canCreate && (
            <li>
              <button
                type="button"
                className="block w-full border-t border-slate-100 px-3 py-2 text-left text-sm font-medium text-orange-600 hover:bg-orange-50"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => commit(draft)}
              >
                {createLabel} "{draft.trim()}"
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  )
}
