import { useState } from 'react'
import { AddMenuItem } from './components/AddMenuItem'
import { BulkAdd } from './components/BulkAdd'
import { ItemList } from './components/ItemList'
import type { MenuItemDraft } from './types'

type Mode = 'single' | 'bulk'

function App() {
  const [items, setItems] = useState<MenuItemDraft[]>([])
  const [mode, setMode] = useState<Mode>('single')

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-5">
          <p className="text-xs font-medium uppercase tracking-wide text-orange-500">Menu Control Panel</p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900">Add Menu Item — simplified</h1>
          <p className="mt-1 text-sm text-slate-500">
            Name and price is all that's required. Category, veg/non-veg and GST are auto-detected — a prototype of the
            Swiggy/Zomato-style onboarding flow, in place of the 15-field form it replaces.
          </p>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-6 py-8 lg:grid-cols-[1fr_360px]">
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="mb-5 flex gap-1 rounded-lg bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setMode('single')}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition ${
                mode === 'single' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Add single item
            </button>
            <button
              type="button"
              onClick={() => setMode('bulk')}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition ${
                mode === 'bulk' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Bulk add from a list
            </button>
          </div>

          {mode === 'single' ? (
            <AddMenuItem onAdd={(item) => setItems((prev) => [item, ...prev])} />
          ) : (
            <BulkAdd onAddMany={(newItems) => setItems((prev) => [...newItems, ...prev])} />
          )}
        </section>

        <aside className="rounded-xl border border-slate-200 bg-white p-5">
          <ItemList items={items} />
        </aside>
      </main>
    </div>
  )
}

export default App
