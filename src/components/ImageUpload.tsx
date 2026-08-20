import { useId, useRef, useState } from 'react'

const MAX_BYTES = 4 * 1024 * 1024

export function ImageUpload({ value, onChange }: { value: string | null; onChange: (dataUrl: string | null) => void }) {
  const id = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)

  function handleFile(file: File | undefined) {
    setError(null)
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file')
      return
    }
    if (file.size > MAX_BYTES) {
      setError('Image is too large (max 4MB)')
      return
    }
    const reader = new FileReader()
    reader.onload = () => onChange(reader.result as string)
    reader.readAsDataURL(file)
  }

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">
        Item photo
      </label>
      <div className="flex items-center gap-3">
        {value ? (
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-slate-200">
            <img src={value} alt="Item preview" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => {
                onChange(null)
                if (inputRef.current) inputRef.current.value = ''
              }}
              className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-xs text-white hover:bg-black/80"
              aria-label="Remove photo"
            >
              ✕
            </button>
          </div>
        ) : (
          <label
            htmlFor={id}
            className="flex h-20 w-20 shrink-0 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-slate-300 text-slate-400 transition hover:border-orange-400 hover:text-orange-500"
          >
            <span className="text-lg leading-none">+</span>
            <span className="text-[10px] font-medium">Upload</span>
          </label>
        )}
        <input
          id={id}
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        <p className="max-w-[220px] text-xs text-slate-400">
          Optional, but items with a photo get noticeably higher click-through in the customer app.
        </p>
      </div>
      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
    </div>
  )
}
