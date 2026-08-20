import { useState } from 'react'
import { autocomplete } from '../lib/match'
import type { CatalogDish } from '../types'
import { FoodTypeMark } from './FoodTypeDot'

interface Props {
  value: string
  onChange: (value: string) => void
  onPick: (dish: CatalogDish) => void
}

export function CatalogAutocomplete({ value, onChange, onPick }: Props) {
  const [open, setOpen] = useState(false)
  const matches = open ? autocomplete(value) : []

  return (
    <div className="relative">
      <input
        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm placeholder:text-slate-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
        placeholder="e.g. Chicken Biryani, Paneer Tikka…"
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
      />
      {open && matches.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
          {matches.map((dish) => (
            <li key={dish.name}>
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-orange-50"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onPick(dish)
                  setOpen(false)
                }}
              >
                <FoodTypeMark type={dish.type} />
                <span className="flex-1 text-slate-700">{dish.name}</span>
                <span className="text-xs text-slate-400">{dish.category}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
