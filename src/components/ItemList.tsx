import type { MenuItemDraft } from '../types'
import { FoodTypeMark } from './FoodTypeDot'

const SOURCE_LABEL: Record<MenuItemDraft['source'], string> = {
  catalog: 'Auto-matched',
  inferred: 'Auto-guessed',
  manual: 'Manual',
}

export function ItemList({ items }: { items: MenuItemDraft[] }) {
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
        <h3 className="text-sm font-semibold text-slate-700">{items.length} item{items.length === 1 ? '' : 's'} added</h3>
        {autoFilled > 0 && (
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
            {autoFilled} auto-categorised
          </span>
        )}
      </div>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id} className="rounded-lg border border-slate-200 bg-white p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                <FoodTypeMark type={item.type} className="mt-1" />
                <div>
                  <p className="text-sm font-medium text-slate-800">{item.name}</p>
                  <p className="text-xs text-slate-400">
                    {item.category} · {item.subcategory} · GST {item.gst}%
                  </p>
                  {item.description && <p className="mt-0.5 text-xs text-slate-500">{item.description}</p>}
                </div>
              </div>
              <div className="text-right">
                {item.variants.length > 1 ? (
                  <p className="text-xs text-slate-500">
                    {item.variants.map((v) => (
                      <span key={v.id} className="block">
                        {v.sizeLabel} · ₹{v.price}
                      </span>
                    ))}
                  </p>
                ) : (
                  <p className="text-sm font-semibold text-slate-800">₹{item.price}</p>
                )}
              </div>
            </div>
            <span className="mt-2 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
              {SOURCE_LABEL[item.source]}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
