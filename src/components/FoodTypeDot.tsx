import type { FoodType } from '../types'

const STYLES: Record<FoodType, { border: string; dot: string; label: string }> = {
  veg: { border: 'border-emerald-600', dot: 'bg-emerald-600', label: 'Veg' },
  'non-veg': { border: 'border-rose-600', dot: 'bg-rose-600', label: 'Non-veg' },
  egg: { border: 'border-amber-600', dot: 'bg-amber-600', label: 'Egg' },
}

export function FoodTypeMark({ type, className = '' }: { type: FoodType; className?: string }) {
  const s = STYLES[type]
  return (
    <span
      className={`inline-flex h-3.5 w-3.5 items-center justify-center border ${s.border} ${className}`}
      title={s.label}
      aria-label={s.label}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
    </span>
  )
}
