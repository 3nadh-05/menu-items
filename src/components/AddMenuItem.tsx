import { useId, useState, type FormEvent } from 'react'
import { suggestFor } from '../lib/match'
import { DEFAULT_AVAILABILITY, type Availability, type CatalogDish, type FoodType, type MenuItemDraft, type Offer, type Variant } from '../types'
import { AvailabilityEditor } from './AvailabilityEditor'
import { CatalogAutocomplete } from './CatalogAutocomplete'
import { Combobox } from './Combobox'
import { FoodTypeMark } from './FoodTypeDot'
import { ImageUpload } from './ImageUpload'
import { OfferEditor, discountedPrice } from './OfferEditor'

const TYPES: FoodType[] = ['veg', 'non-veg', 'egg']

function uid() {
  return Math.random().toString(36).slice(2, 10)
}

function suggestionBadge(source: MenuItemDraft['source'], confidence: number, matchedName?: string) {
  if (confidence >= 0.85) {
    return { tone: 'bg-emerald-50 text-emerald-700 border-emerald-200', text: `Matched "${matchedName}" in the dish catalog — category, type & GST auto-filled` }
  }
  if (source === 'catalog') {
    return { tone: 'bg-amber-50 text-amber-700 border-amber-200', text: `Looks like "${matchedName}" — auto-filled below, please confirm` }
  }
  if (source === 'inferred') {
    return { tone: 'bg-amber-50 text-amber-700 border-amber-200', text: 'Guessed category from the name — please confirm' }
  }
  return { tone: 'bg-slate-50 text-slate-600 border-slate-200', text: "New dish — we couldn't guess, pick or create a category below" }
}

interface Props {
  onAdd: (item: MenuItemDraft) => void
  categories: string[]
  subcategoriesFor: (category: string) => string[]
  onAddCategory: (name: string) => void
  onAddSubcategory: (category: string, name: string) => void
}

export function AddMenuItem({ onAdd, categories, subcategoriesFor, onAddCategory, onAddSubcategory }: Props) {
  const formId = useId()
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [type, setType] = useState<FoodType>('veg')
  const [category, setCategory] = useState('Main Course')
  const [subcategory, setSubcategory] = useState('Veg Curries')
  const [gst, setGst] = useState(5)
  const [description, setDescription] = useState('')
  const [variants, setVariants] = useState<Variant[]>([])
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [touchedType, setTouchedType] = useState(false)
  const [touchedCategory, setTouchedCategory] = useState(false)
  const [badge, setBadge] = useState<{ tone: string; text: string } | null>(null)
  const [lastSource, setLastSource] = useState<MenuItemDraft['source']>('manual')
  const [lastConfidence, setLastConfidence] = useState(0)
  const [active, setActive] = useState(true)
  const [availability, setAvailability] = useState<Availability>(DEFAULT_AVAILABILITY)
  const [offerEnabled, setOfferEnabled] = useState(false)
  const [offer, setOffer] = useState<Offer>({ type: 'percent', value: 10 })
  const [image, setImage] = useState<string | null>(null)

  function applySuggestionFromName(nextName: string) {
    const suggestion = suggestFor(nextName)
    setLastSource(suggestion.source)
    setLastConfidence(suggestion.confidence)
    if (!nextName.trim()) {
      setBadge(null)
      return
    }
    setBadge(suggestionBadge(suggestion.source, suggestion.confidence, suggestion.matchedDish?.name ?? nextName.trim()))
    if (!touchedType) setType(suggestion.type)
    if (!touchedCategory) {
      setCategory(suggestion.category)
      setSubcategory(suggestion.subcategory)
    }
    setGst(suggestion.gst)
  }

  function handleNameChange(next: string) {
    setName(next)
    applySuggestionFromName(next)
  }

  function handlePick(dish: CatalogDish) {
    setName(dish.name)
    setType(dish.type)
    setCategory(dish.category)
    setSubcategory(dish.subcategory)
    setGst(dish.gst)
    setTouchedType(false)
    setTouchedCategory(false)
    setLastSource('catalog')
    setLastConfidence(1)
    setBadge(suggestionBadge('catalog', 1, dish.name))
  }

  function commitCategory(next: string) {
    setCategory(next)
    setTouchedCategory(true)
    onAddCategory(next)
    const existingSub = subcategoriesFor(next)
    setSubcategory(existingSub[0] ?? 'General')
  }

  function commitSubcategory(next: string) {
    setSubcategory(next)
    onAddSubcategory(category, next)
  }

  function addVariantRow() {
    if (variants.length === 0) {
      const base = Number(price) || 0
      setVariants([
        { id: uid(), sizeLabel: 'Regular', price: base },
        { id: uid(), sizeLabel: '', price: 0 },
      ])
    } else {
      setVariants((v) => [...v, { id: uid(), sizeLabel: '', price: 0 }])
    }
    setAdvancedOpen(true)
  }

  function updateVariant(id: string, patch: Partial<Variant>) {
    setVariants((v) => v.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }

  function removeVariant(id: string) {
    setVariants((v) => {
      const next = v.filter((r) => r.id !== id)
      return next.length === 1 ? [] : next
    })
  }

  const usingVariants = variants.length > 0
  const isValid = name.trim().length > 0 && (usingVariants ? variants.every((v) => v.sizeLabel.trim() && v.price > 0) : Number(price) > 0)

  function reset() {
    setName('')
    setPrice('')
    setType('veg')
    setCategory('Main Course')
    setSubcategory('Veg Curries')
    setGst(5)
    setDescription('')
    setVariants([])
    setAdvancedOpen(false)
    setTouchedType(false)
    setTouchedCategory(false)
    setBadge(null)
    setActive(true)
    setAvailability(DEFAULT_AVAILABILITY)
    setOfferEnabled(false)
    setOffer({ type: 'percent', value: 10 })
    setImage(null)
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!isValid) return
    const finalVariants: Variant[] = usingVariants ? variants : [{ id: uid(), sizeLabel: 'Regular', price: Number(price) }]
    onAdd({
      id: uid(),
      name: name.trim(),
      price: finalVariants[0].price,
      type,
      category,
      subcategory,
      gst,
      description,
      variants: finalVariants,
      source: lastSource,
      matchConfidence: lastConfidence,
      active,
      availability,
      offer: offerEnabled ? offer : null,
      image,
    })
    reset()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor={`${formId}-name`} className="mb-1.5 block text-sm font-medium text-slate-700">
          Name of the item <span className="text-orange-500">*</span>
        </label>
        <CatalogAutocomplete value={name} onChange={handleNameChange} onPick={handlePick} />
        {badge && <p className={`mt-1.5 rounded-md border px-2.5 py-1.5 text-xs ${badge.tone}`}>{badge.text}</p>}
      </div>

      <ImageUpload value={image} onChange={setImage} />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            {usingVariants ? 'Base price' : 'Price'} {!usingVariants && <span className="text-orange-500">*</span>}
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">₹</span>
            <input
              type="number"
              min={0}
              step="0.01"
              disabled={usingVariants}
              className="w-full rounded-lg border border-slate-300 py-2.5 pl-7 pr-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100 disabled:bg-slate-50 disabled:text-slate-400"
              placeholder="0.00"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>
          {usingVariants && <p className="mt-1 text-xs text-slate-400">Priced by size below</p>}
        </div>

        <div>
          <span className="mb-1.5 block text-sm font-medium text-slate-700">
            Type <span className="text-orange-500">*</span>
          </span>
          <div className="flex gap-1.5">
            {TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setType(t)
                  setTouchedType(true)
                }}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-2 py-2.5 text-xs font-medium capitalize transition ${
                  type === t ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <FoodTypeMark type={t} />
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Category <span className="text-orange-500">*</span>
          </label>
          <Combobox value={category} onChange={commitCategory} options={categories} placeholder="e.g. Breakfast" createLabel="+ Create category" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">GST</label>
          <select
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
            value={gst}
            onChange={(e) => setGst(Number(e.target.value))}
          >
            {[0, 5, 12, 18].map((g) => (
              <option key={g} value={g}>
                {g}%
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-lg bg-slate-50 p-4">
        <h3 className="mb-2 text-sm font-semibold text-slate-700">Availability</h3>
        <AvailabilityEditor value={availability} onChange={setAvailability} />
      </div>

      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300 text-orange-500 focus:ring-orange-400"
            checked={offerEnabled}
            onChange={(e) => setOfferEnabled(e.target.checked)}
          />
          Give an offer on this item
        </label>
        {offerEnabled && (
          <div className="mt-2 flex items-center gap-3">
            <OfferEditor value={offer} onChange={setOffer} />
            {Number(price) > 0 && offer.value > 0 && (
              <span className="text-xs text-slate-500">
                <span className="line-through">₹{Number(price)}</span>{' '}
                <span className="font-semibold text-emerald-600">₹{discountedPrice(Number(price), offer)}</span>
              </span>
            )}
          </div>
        )}
      </div>

      <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-slate-300 text-orange-500 focus:ring-orange-400"
          checked={active}
          onChange={(e) => setActive(e.target.checked)}
        />
        Show this item to customers immediately
      </label>

      <button
        type="button"
        onClick={() => setAdvancedOpen((v) => !v)}
        className="text-sm font-medium text-orange-600 hover:text-orange-700"
      >
        {advancedOpen ? '− Hide' : '+ Add'} description, subcategory or multiple sizes (optional)
      </button>

      {advancedOpen && (
        <div className="space-y-4 rounded-lg border border-dashed border-slate-200 bg-slate-50/60 p-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Subcategory</label>
            <Combobox
              value={subcategory}
              onChange={commitSubcategory}
              options={subcategoriesFor(category)}
              placeholder="e.g. Weekend Specials"
              createLabel="+ Create subcategory"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Description</label>
            <textarea
              rows={2}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
              placeholder="Enter item description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">Sizes / variants</span>
              <button type="button" onClick={addVariantRow} className="text-xs font-medium text-orange-600 hover:text-orange-700">
                + Add a size
              </button>
            </div>
            {!usingVariants && <p className="text-xs text-slate-400">Single price by default — add sizes only if this item comes in more than one (e.g. Half / Full).</p>}
            {usingVariants && (
              <div className="space-y-2">
                {variants.map((v) => (
                  <div key={v.id} className="flex items-center gap-2">
                    <input
                      className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
                      placeholder="Size label (e.g. Half)"
                      value={v.sizeLabel}
                      onChange={(e) => updateVariant(v.id, { sizeLabel: e.target.value })}
                    />
                    <div className="relative w-28">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">₹</span>
                      <input
                        type="number"
                        min={0}
                        className="w-full rounded-lg border border-slate-300 py-2 pl-7 pr-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
                        value={v.price || ''}
                        onChange={(e) => updateVariant(v.id, { price: Number(e.target.value) })}
                      />
                    </div>
                    <button type="button" onClick={() => removeVariant(v.id)} className="rounded-md px-2 py-1 text-xs text-slate-400 hover:bg-slate-200 hover:text-slate-600">
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 pt-1">
        <button
          type="submit"
          disabled={!isValid}
          className="rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
        >
          Add Menu Item
        </button>
        <span className="text-xs text-slate-400">Everything else defaults sensibly — edit anytime after adding.</span>
      </div>
    </form>
  )
}
