import type { Offer } from '../types'

export function OfferEditor({ value, onChange }: { value: Offer; onChange: (next: Offer) => void }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex overflow-hidden rounded-lg border border-slate-300">
        <button
          type="button"
          onClick={() => onChange({ ...value, type: 'percent' })}
          className={`px-2.5 py-2 text-xs font-medium ${value.type === 'percent' ? 'bg-orange-500 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
        >
          % off
        </button>
        <button
          type="button"
          onClick={() => onChange({ ...value, type: 'flat' })}
          className={`px-2.5 py-2 text-xs font-medium ${value.type === 'flat' ? 'bg-orange-500 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
        >
          ₹ off
        </button>
      </div>
      <input
        type="number"
        min={0}
        max={value.type === 'percent' ? 100 : undefined}
        className="w-24 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
        placeholder={value.type === 'percent' ? '10' : '50'}
        value={value.value || ''}
        onChange={(e) => onChange({ ...value, value: Number(e.target.value) })}
      />
    </div>
  )
}

export function discountedPrice(price: number, offer: Offer | null): number {
  if (!offer || offer.value <= 0) return price
  const off = offer.type === 'percent' ? (price * offer.value) / 100 : offer.value
  return Math.max(0, Math.round((price - off) * 100) / 100)
}
