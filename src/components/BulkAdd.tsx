import { useState } from 'react'
import { suggestFor } from '../lib/match'
import { DEFAULT_AVAILABILITY, type FoodType, type MenuItemDraft } from '../types'
import { Combobox } from './Combobox'
import { FoodTypeMark } from './FoodTypeDot'

interface Row {
  id: string
  name: string
  price: number
  type: FoodType
  category: string
  subcategory: string
  gst: number
  source: MenuItemDraft['source']
  confidence: number
}

function uid() {
  return Math.random().toString(36).slice(2, 10)
}

const LINE_RE = /^(.+?)[\s,\t\-–—]+₹?\s*(\d+(?:\.\d{1,2})?)\s*$/

function parseLine(line: string): { name: string; price: number } {
  const match = line.trim().match(LINE_RE)
  if (match) return { name: match[1].trim(), price: Number(match[2]) }
  return { name: line.trim(), price: 0 }
}

const PLACEHOLDER = `Paste one item per line, e.g.\nChicken Biryani - 249\nPaneer Tikka, 199\nMasala Dosa 120`

interface Props {
  onAddMany: (items: MenuItemDraft[]) => void
  categories: string[]
  subcategoriesFor: (category: string) => string[]
  onAddCategory: (name: string) => void
}

export function BulkAdd({ onAddMany, categories, subcategoriesFor, onAddCategory }: Props) {
  const [text, setText] = useState('')
  const [rows, setRows] = useState<Row[]>([])

  function parse() {
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
    const parsed = lines.map((line) => {
      const { name, price } = parseLine(line)
      const suggestion = suggestFor(name)
      return {
        id: uid(),
        name,
        price,
        type: suggestion.type,
        category: suggestion.category,
        subcategory: suggestion.subcategory,
        gst: suggestion.gst,
        source: suggestion.source,
        confidence: suggestion.confidence,
      }
    })
    setRows(parsed)
  }

  function updateRow(id: string, patch: Partial<Row>) {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }

  function removeRow(id: string) {
    setRows((rs) => rs.filter((r) => r.id !== id))
  }

  const validRows = rows.filter((r) => r.name && r.price > 0)

  function confirmAdd() {
    const items: MenuItemDraft[] = validRows.map((r) => ({
      id: r.id,
      name: r.name,
      price: r.price,
      type: r.type,
      category: r.category,
      subcategory: r.subcategory,
      gst: r.gst,
      description: '',
      variants: [{ id: uid(), sizeLabel: 'Regular', price: r.price }],
      source: r.source,
      matchConfidence: r.confidence,
      active: true,
      availability: DEFAULT_AVAILABILITY,
      offer: null,
    }))
    onAddMany(items)
    setText('')
    setRows([])
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">
        Paste your existing menu (from a doc, spreadsheet, or WhatsApp list) and we'll detect the type, category and GST for every line —
        the same shortcut Swiggy/Zomato onboarding teams use when scanning a printed menu.
      </p>
      <textarea
        rows={5}
        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 font-mono text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
        placeholder={PLACEHOLDER}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button
        type="button"
        onClick={parse}
        disabled={!text.trim()}
        className="rounded-lg border border-orange-300 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-700 hover:bg-orange-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-300"
      >
        Detect items
      </button>

      {rows.length > 0 && (
        <div className="space-y-2 rounded-lg border border-slate-200 p-3">
          <div className="grid grid-cols-[1fr_90px_84px_1fr_40px] gap-2 px-1 text-xs font-medium uppercase tracking-wide text-slate-400">
            <span>Item</span>
            <span>Price</span>
            <span>Type</span>
            <span>Category</span>
            <span />
          </div>
          {rows.map((r) => (
            <div key={r.id} className="grid grid-cols-[1fr_90px_84px_1fr_40px] items-center gap-2 rounded-md px-1 py-1 odd:bg-slate-50">
              <input
                className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-orange-500 focus:outline-none"
                value={r.name}
                onChange={(e) => updateRow(r.id, { name: e.target.value })}
              />
              <input
                type="number"
                className={`w-full rounded-md border px-2 py-1.5 text-sm focus:border-orange-500 focus:outline-none ${r.price > 0 ? 'border-slate-300' : 'border-rose-300'}`}
                value={r.price || ''}
                onChange={(e) => updateRow(r.id, { price: Number(e.target.value) })}
              />
              <select
                className="w-full rounded-md border border-slate-300 bg-white px-1 py-1.5 text-xs focus:border-orange-500 focus:outline-none"
                value={r.type}
                onChange={(e) => updateRow(r.id, { type: e.target.value as FoodType })}
              >
                <option value="veg">Veg</option>
                <option value="non-veg">Non-veg</option>
                <option value="egg">Egg</option>
              </select>
              <Combobox
                value={r.category}
                onChange={(next) => {
                  updateRow(r.id, { category: next, subcategory: subcategoriesFor(next)[0] ?? 'General' })
                  onAddCategory(next)
                }}
                options={categories}
                createLabel="+ Create"
              />
              <div className="flex items-center justify-center gap-1">
                <FoodTypeMark type={r.type} />
                <button type="button" onClick={() => removeRow(r.id)} className="text-xs text-slate-400 hover:text-rose-600">
                  ✕
                </button>
              </div>
            </div>
          ))}

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-slate-400">
              {validRows.length} of {rows.length} ready {rows.length !== validRows.length && '— fix missing prices highlighted in red'}
            </span>
            <button
              type="button"
              onClick={confirmAdd}
              disabled={validRows.length === 0}
              className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
            >
              Add {validRows.length} item{validRows.length === 1 ? '' : 's'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
