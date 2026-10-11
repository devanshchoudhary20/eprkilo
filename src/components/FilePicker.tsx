import type { ChangeEvent } from 'react'

type Props = { label: string; variant: 'primary' | 'secondary'; onFile: (file: File) => void }

export function FilePicker({ label, variant, onFile }: Props) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (file) onFile(file)
  }
  return (
    <label className={`btn btn-${variant} file-btn`}>
      <input className="sr-only" type="file" accept=".csv,text/csv" onChange={handleChange} />
      {label}
    </label>
  )
}
