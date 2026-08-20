import { ALL_DAYS, type Availability, type DayOfWeek } from '../types'

export function AvailabilityEditor({ value, onChange }: { value: Availability; onChange: (next: Availability) => void }) {
  function toggleDay(day: DayOfWeek) {
    const days = value.days.includes(day) ? value.days.filter((d) => d !== day) : [...value.days, day]
    onChange({ ...value, days })
  }

  return (
    <div>
      <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-slate-300 text-orange-500 focus:ring-orange-400"
          checked={value.allDay}
          onChange={(e) => onChange({ ...value, allDay: e.target.checked })}
        />
        Available all day, every day
      </label>

      {!value.allDay && (
        <div className="mt-3 space-y-3 rounded-lg bg-white p-3">
          <div className="flex items-center gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">From</label>
              <input
                type="time"
                className="rounded-lg border border-slate-300 px-2.5 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
                value={value.startTime}
                onChange={(e) => onChange({ ...value, startTime: e.target.value })}
              />
            </div>
            <span className="mt-4 text-slate-400">–</span>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">To</label>
              <input
                type="time"
                className="rounded-lg border border-slate-300 px-2.5 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
                value={value.endTime}
                onChange={(e) => onChange({ ...value, endTime: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Days</label>
            <div className="flex flex-wrap gap-1.5">
              {ALL_DAYS.map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`rounded-md border px-2.5 py-1 text-xs font-medium transition ${
                    value.days.includes(day) ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-slate-300 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
