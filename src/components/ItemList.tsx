import { useState } from 'react'
import type { MenuItemDraft, Offer } from '../types'
import { FoodTypeMark } from './FoodTypeDot'
import { OfferEditor, discountedPrice } from './OfferEditor'

const SOURCE_LABEL: Record<MenuItemDraft['source'], string> = {
  catalog: 'Auto-matched',
  inferred: 'Auto-guessed',
  manual: 'Manual',
}

function availabilityText(item: MenuItemDraft) {
  if (item.availability.allDay) return null
  const days = item.availability.days.length === 7 ? 'daily' : item.availability.days.join(', ')
  return `${item.availability.startTime}–${item.availability.endTime} · ${days}`
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onChange}
      aria-pressed={checked}
      aria-label={label}
      className={`relative h-5 w-9 shrink-0 rounded-full transition ${checked ? 'bg-emerald-500' : 'bg-slate-300'}`}
    >
      <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition ${checked ? 'left-4' : 'left-0.5'}`} />
    </button>
  )
}

function ItemRow({ item, onUpdate }: { item: MenuItemDraft; onUpdate: (patch: Partial<MenuItemDraft>) => void }) {
  const [offerOpen, setOfferOpen] = useState(false)
  const availText = availabilityText(item)

  return (
    <li className={`rounded-lg border border-slate-200 bg-white p-3 transition ${item.active ? '' : 'opacity-50'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2">
          <FoodTypeMark type={item.type} className="mt-1" />
          <div>
            <p className="text-sm font-medium text-slate-800">{item.name}</p>
            <p className="text-xs text-slate-400">
              {item.category} · {item.subcategory} · GST {item.gst}%
            </p>
            {item.description && <p className="mt-0.5 text-xs text-slate-500">{item.description}</p>}
            {availText && <p className="mt-0.5 text-xs text-amber-600">⏱ {availText}</p>}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <Toggle checked={item.active} onChange={() => onUpdate({ active: !item.active })} label={item.active ? 'Disable item' : 'Enable item'} />
          {item.variants.length > 1 ? (
            <p className="text-right text-xs text-slate-500">
              {item.variants.map((v) => (
                <span key={v.id} className="block">
                  {v.sizeLabel} · ₹{v.price}
                </span>
              ))}
            </p>
          ) : item.offer ? (
            <p className="text-right text-sm">
              <span className="text-slate-400 line-through">₹{item.price}</span>{' '}
              <span className="font-semibold text-emerald-600">₹{discountedPrice(item.price, item.offer)}</span>
            </p>
          ) : (
            <p className="text-sm font-semibold text-slate-800">₹{item.price}</p>
          )}
        </div>
      </div>

      <div className="mt-2 flex items-center gap-2">
        <span className="inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">{SOURCE_LABEL[item.source]}</span>
        {!item.active && <span className="inline-block rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-medium text-rose-600">Disabled</span>}
        <button type="button" onClick={() => setOfferOpen((v) => !v)} className="ml-auto text-xs font-medium text-orange-600 hover:text-orange-700">
          {item.offer ? 'Edit offer' : '+ Add offer'}
        </button>
      </div>

      {offerOpen && (
        <div className="mt-2 flex items-center gap-2 rounded-lg bg-slate-50 p-2">
          <OfferEditor value={item.offer ?? { type: 'percent', value: 10 }} onChange={(o: Offer) => onUpdate({ offer: o })} />
          {item.offer && (
            <button
              type="button"
              onClick={() => {
                onUpdate({ offer: null })
                setOfferOpen(false)
              }}
              className="text-xs font-medium text-slate-400 hover:text-rose-600"
            >
              Remove
            </button>
          )}
        </div>
      )}
    </li>
  )
}

export function ItemList({ items, onUpdateItem }: { items: MenuItemDraft[]; onUpdateItem: (id: string, patch: Partial<MenuItemDraft>) => void }) {
  if (items.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 p-10 text-center text-sm text-slate-400">
        <p className="font-medium text-slate-500">No items yet</p>
        <p className="mt-1 max-w-[220px]">Items you add will show up here, exactly as they'd appear on the live menu.</p>
      </div>
    )
  }

  const autoFilled = items.filter((i) => i.source !== 'manual').length

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">
          {items.length} item{items.length === 1 ? '' : 's'} added
        </h3>
        {autoFilled > 0 && <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">{autoFilled} auto-categorised</span>}
      </div>
      <ul className="space-y-2">
        {items.map((item) => (
          <ItemRow key={item.id} item={item} onUpdate={(patch) => onUpdateItem(item.id, patch)} />
        ))}
      </ul>
    </div>
  )
}
