import { useState } from 'react'
import type { DragEvent } from 'react'
import { FileUpIcon } from './icons'
import { FilePicker } from './FilePicker'

export function DropZone({ onFile }: { onFile: (file: File) => void }) {
  const [dragging, setDragging] = useState(false)
  const title = dragging ? 'Release to read this file' : 'Drop your Order Items file here'
  const className = dragging ? 'dropzone dragging' : 'dropzone'

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragging(false)
    const file = event.dataTransfer.files[0]
    if (file) onFile(file)
  }
  const handleOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragging(true)
  }

  return (
    <div className={className} onDragOver={handleOver} onDragLeave={() => setDragging(false)} onDrop={handleDrop}>
      <span className="muted"><FileUpIcon size={40} /></span>
      <h2>{title}</h2>
      <div className="dropzone-or">
        <span className="muted">or</span>
        <FilePicker label="Choose file" variant="primary" onFile={onFile} />
      </div>
      <p className="muted small">CSV from Shop Manager, up to 50 MB.</p>
    </div>
  )
}
