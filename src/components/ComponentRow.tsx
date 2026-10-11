import { MATERIALS, materialExample, materialLabel } from '../lib/setups'
import type { ComponentDraft, Counts, MaterialKey } from '../lib/setups'
import { TrashIcon } from './icons'

type Props = {
  item: ComponentDraft
  error: string | undefined
  canRemove: boolean
  onChange: (next: ComponentDraft) => void
  onRemove: () => void
}

export function ComponentRow({ item, error, canRemove, onChange, onRemove }: Props) {
  const example = materialExample(item.material)
  const label = materialLabel(item.material)
  const errorId = `grams-error-${item.key}`
  const fieldClass = error ? 'field invalid' : 'field'

  return (
    <div className="component-row">
      <label className="field">
        Material
        <select value={item.material} onChange={(e) => onChange({ ...item, material: e.target.value as MaterialKey })}>
          {MATERIALS.map((material) => (
            <option key={material.key} value={material.key}>{material.label}</option>
          ))}
        </select>
      </label>
      <div className={fieldClass}>
        <label htmlFor={`grams-${item.key}`}>Grams</label>
        <input
          id={`grams-${item.key}`}
          type="text"
          inputMode="decimal"
          className="grams-input"
          value={item.grams}
          placeholder={example}
          title={example}
          aria-label={`Grams of ${label}, ${example}`}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          onChange={(e) => onChange({ ...item, grams: e.target.value })}
        />
        {error && <p className="field-error" id={errorId} role="alert">{error}</p>}
      </div>
      <label className="field">
        Counts
        <select value={item.counts} onChange={(e) => onChange({ ...item, counts: e.target.value as Counts })}>
          <option value="unit">Per item sold</option>
          <option value="parcel">Once per order</option>
        </select>
      </label>
      <button type="button" className="icon-btn row-remove" aria-label={`Remove ${label} component`} disabled={!canRemove} onClick={onRemove}>
        <TrashIcon />
      </button>
    </div>
  )
}
