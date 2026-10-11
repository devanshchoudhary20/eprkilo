export type MaterialKey = 'paper' | 'plastic' | 'glass' | 'steel' | 'aluminium' | 'wood' | 'composite' | 'other'
export type Counts = 'unit' | 'parcel'

export const MATERIALS: Array<{ key: MaterialKey; label: string; example: string }> = [
  { key: 'paper', label: 'Paper/cardboard', example: 'e.g. 18 g, a C5 board-backed envelope' },
  { key: 'plastic', label: 'Plastic', example: 'e.g. 6 g, a clear polybag' },
  { key: 'glass', label: 'Glass', example: 'e.g. 210 g, a 250 ml jar' },
  { key: 'steel', label: 'Steel (ferrous)', example: 'e.g. 12 g, a tin lid' },
  { key: 'aluminium', label: 'Aluminium', example: 'e.g. 9 g, a foil tray' },
  { key: 'wood', label: 'Wood', example: 'e.g. 35 g, a wooden gift tag box' },
  { key: 'composite', label: 'Composite', example: 'e.g. 25 g, a bubble mailer lining' },
  { key: 'other', label: 'Other', example: 'e.g. 4 g, a sticker label' },
]

export const MATERIAL_KEYS = MATERIALS.map((material) => material.key)
export const materialLabel = (key: MaterialKey) => MATERIALS.find((material) => material.key === key)?.label ?? 'Other'
export const materialExample = (key: MaterialKey) => MATERIALS.find((material) => material.key === key)?.example ?? 'e.g. 4 g'

export type Component = { material: MaterialKey; grams: number; counts: Counts }
export type Setup = { id: string; name: string; components: Component[] }
export type SetupStore = { setups: Setup[]; defaultId: string | null; mapping: Record<string, string> }
export type ComponentDraft = { key: string; material: MaterialKey; grams: string; counts: Counts }
export type SetupDraft = { id: string; name: string; components: ComponentDraft[] }

export const emptyStore = (): SetupStore => ({ setups: [], defaultId: null, mapping: {} })

const STORAGE_KEY = 'eprkilo-setups-v1'
const isMaterial = (value: unknown): value is MaterialKey => MATERIAL_KEYS.includes(value as MaterialKey)

export function validateGrams(raw: string): { grams: number } | { error: string } {
  const text = raw.trim().replace(',', '.')
  if (text === '') return { error: 'Enter the weight in grams, for example 18.' }
  const grams = Number(text)
  if (!Number.isFinite(grams)) return { error: 'Grams must be a number, for example 18.' }
  if (grams <= 0) return { error: 'Grams must be more than 0.' }
  return { grams }
}

export function validateName(name: string): string | null {
  return name.trim() === '' ? "Give this setup a name, for example 'Card in mailer'." : null
}

function sanitizeSetup(raw: unknown): Setup | null {
  const candidate = raw as { id?: unknown; name?: unknown; components?: unknown }
  if (typeof candidate?.id !== 'string' || typeof candidate.name !== 'string' || !Array.isArray(candidate.components)) return null
  const components = candidate.components.flatMap((item: Partial<Component>) =>
    isMaterial(item?.material) && typeof item.grams === 'number' && item.grams > 0 && Number.isFinite(item.grams)
      ? [{ material: item.material, grams: item.grams, counts: item.counts === 'parcel' ? ('parcel' as const) : ('unit' as const) }]
      : [],
  )
  return { id: candidate.id, name: candidate.name.trim() || 'Untitled setup', components }
}

export function parseStore(text: string): SetupStore {
  const data = JSON.parse(text) as { setups?: unknown; defaultId?: unknown; mapping?: unknown }
  const setups = (Array.isArray(data.setups) ? data.setups : []).flatMap((item) => sanitizeSetup(item) ?? [])
  const wanted = typeof data.defaultId === 'string' ? data.defaultId : null
  const defaultId = setups.find((setup) => setup.id === wanted)?.id ?? setups[0]?.id ?? null
  const mapping: Record<string, string> = {}
  Object.entries(typeof data.mapping === 'object' && data.mapping ? data.mapping : {}).forEach(([key, value]) => {
    if (typeof value === 'string') mapping[key] = value
  })
  return { setups, defaultId, mapping }
}

export function loadStore(): { store: SetupStore; unreadable: boolean } {
  try {
    const text = localStorage.getItem(STORAGE_KEY)
    return { store: text === null ? emptyStore() : parseStore(text), unreadable: false }
  } catch {
    return { store: emptyStore(), unreadable: true }
  }
}

export function saveStore(store: SetupStore): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  } catch {
    // storage blocked: setups last until reload
  }
}

let counter = 0
export const newId = () => `${Date.now().toString(36)}-${(counter += 1)}`

export const blankComponent = (material: MaterialKey = 'paper', counts: Counts = 'unit'): ComponentDraft => ({
  key: newId(),
  material,
  grams: '',
  counts,
})

export const blankDraft = (): SetupDraft => ({ id: newId(), name: '', components: [blankComponent()] })

export const toDraft = (setup: Setup): SetupDraft => ({
  id: setup.id,
  name: setup.name,
  components: setup.components.map((item) => ({ key: newId(), material: item.material, grams: String(item.grams), counts: item.counts })),
})

export type DraftCheck = { nameError: string | null; gramsErrors: Record<string, string>; setup: Setup | null; errorCount: number }

export function checkDraft(draft: SetupDraft): DraftCheck {
  const nameError = validateName(draft.name)
  const gramsErrors: Record<string, string> = {}
  const components: Component[] = []
  draft.components.forEach((item) => {
    const result = validateGrams(item.grams)
    if ('error' in result) gramsErrors[item.key] = result.error
    else components.push({ material: item.material, grams: result.grams, counts: item.counts })
  })
  const errorCount = Object.keys(gramsErrors).length + (nameError ? 1 : 0)
  const setup = errorCount === 0 ? { id: draft.id, name: draft.name.trim(), components } : null
  return { nameError, gramsErrors, setup, errorCount }
}
