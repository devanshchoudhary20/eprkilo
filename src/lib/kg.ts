import { classifyCountry } from './countries'
import { rowsInPeriod } from './compute'
import type { Period } from './compute'
import type { ItemRow, ItemsFile } from './parse'
import { MATERIAL_KEYS, MATERIALS } from './setups'
import type { MaterialKey, Setup, SetupStore } from './setups'

export type MilliByMaterial = Record<MaterialKey, number>
export type KgRow = { iso: string; name: string; parcels: number; units: number; mg: MilliByMaterial }
export type KgResult = {
  countries: KgRow[]
  total: KgRow
  usedSetups: Array<{ name: string; isDefault: boolean }>
  defaultListings: number
  quantityAssumed: number
  totalMissing: number
  hasWeights: boolean
}

export type Listing = { key: string; listingId: string; name: string; units: number; by: 'id' | 'sku' | 'name' }

const zeros = (): MilliByMaterial => Object.fromEntries(MATERIAL_KEYS.map((key) => [key, 0])) as MilliByMaterial

export function listingKey(row: ItemRow): { key: string; by: Listing['by'] } | null {
  if (row.listingId) return { key: `id:${row.listingId}`, by: 'id' }
  if (row.sku) return { key: `sku:${row.sku}`, by: 'sku' }
  if (row.itemName) return { key: `name:${row.itemName}`, by: 'name' }
  return null
}

export const displayName = (row: ItemRow) => row.itemName || `Untitled listing ${row.listingId || row.sku}`.trim()

export function listListings(file: ItemsFile): { listings: Listing[]; noKeyRows: number } {
  const seen = new Map<string, Listing>()
  let noKeyRows = 0
  file.rows.forEach((row) => {
    const found = listingKey(row)
    if (!found) {
      noKeyRows += 1
      return
    }
    const entry = seen.get(found.key) ?? { key: found.key, listingId: row.listingId, name: displayName(row), units: 0, by: found.by }
    entry.units += row.quantity
    seen.set(found.key, entry)
  })
  return { listings: [...seen.values()], noKeyRows }
}

const milli = (setup: Setup, counts: 'unit' | 'parcel'): MilliByMaterial => {
  const out = zeros()
  setup.components.filter((item) => item.counts === counts).forEach((item) => {
    out[item.material] += Math.round(item.grams * 1000)
  })
  return out
}

const sum = (values: MilliByMaterial) => MATERIAL_KEYS.reduce((acc, key) => acc + values[key], 0)

export const rowTotalMg = (row: KgRow) => sum(row.mg)
export const kgText = (mg: number) => (mg / 1_000_000).toFixed(3)

export function computeKg(file: ItemsFile, period: Period, countUnshipped: boolean, store: SetupStore): KgResult {
  const byId = new Map(store.setups.map((setup) => [setup.id, setup]))
  const fallback = store.defaultId ? byId.get(store.defaultId) : undefined
  const parts = new Map(store.setups.map((setup) => [setup.id, { unit: milli(setup, 'unit'), parcel: milli(setup, 'parcel') }]))
  const setupFor = (row: ItemRow): { setup: Setup | undefined; isDefault: boolean } => {
    const found = listingKey(row)
    const chosen = found ? byId.get(store.mapping[found.key] ?? '') : undefined
    return chosen ? { setup: chosen, isDefault: false } : { setup: fallback, isDefault: true }
  }

  const orders = new Map<string, ItemRow[]>()
  const eu = rowsInPeriod(file, period, countUnshipped).filter((row) => classifyCountry(row.shipCountry).kind === 'eu')
  eu.forEach((row) => orders.set(row.orderId, [...(orders.get(row.orderId) ?? []), row]))

  const countries = new Map<string, KgRow>()
  const used = new Set<string>()
  const defaultKeys = new Set<string>()
  orders.forEach((items) => {
    const place = classifyCountry(items[0].shipCountry)
    if (place.kind !== 'eu') return
    const entry = countries.get(place.iso) ?? { iso: place.iso, name: place.name, parcels: 0, units: 0, mg: zeros() }
    entry.parcels += 1
    const parcelParts: MilliByMaterial[] = []
    items.forEach((row) => {
      const { setup, isDefault } = setupFor(row)
      const key = listingKey(row)?.key
      entry.units += row.quantity
      if (isDefault && key) defaultKeys.add(key)
      const part = setup && parts.get(setup.id)
      if (!setup || !part) return
      used.add(setup.id)
      MATERIAL_KEYS.forEach((material) => {
        entry.mg[material] += part.unit[material] * row.quantity
      })
      parcelParts.push(part.parcel)
    })
    const biggest = parcelParts.reduce<MilliByMaterial | null>((best, part) => (!best || sum(part) > sum(best) ? part : best), null)
    if (biggest) MATERIAL_KEYS.forEach((material) => (entry.mg[material] += biggest[material]))
    countries.set(place.iso, entry)
  })

  const rows = [...countries.values()].sort((a, b) => b.parcels - a.parcels || a.name.localeCompare(b.name))
  const total: KgRow = { iso: 'total', name: 'Total', parcels: 0, units: 0, mg: zeros() }
  rows.forEach((row) => {
    total.parcels += row.parcels
    total.units += row.units
    MATERIAL_KEYS.forEach((key) => (total.mg[key] += row.mg[key]))
  })
  return {
    countries: rows,
    total,
    usedSetups: store.setups.filter((setup) => used.has(setup.id)).map((setup) => ({ name: setup.name, isDefault: setup.id === store.defaultId })),
    defaultListings: defaultKeys.size,
    quantityAssumed: eu.filter((row) => row.quantityAssumed).length,
    totalMissing: eu.filter((row) => row.totalMissing).length,
    hasWeights: sum(total.mg) > 0,
  }
}

export function columnsFor(result: KgResult, showEmpty: boolean) {
  const all = MATERIALS.map((material) => ({ key: material.key, label: material.label }))
  const withWeight = all.filter((column) => result.total.mg[column.key] > 0)
  return { visible: showEmpty ? all : withWeight, hidden: all.length - withWeight.length }
}

