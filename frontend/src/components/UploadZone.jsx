import { useRef, useState, useCallback } from 'react'

export default function UploadZone({ onFiles }) {
  const inputRef   = useRef(null)
  const [dragOver, setDragOver] = useState(false)

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragOver(false)
    onFiles(e.dataTransfer.files)
  }, [onFiles])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  return (
    <section className="upload-section">
      <div
        className={`upload-zone${dragOver ? ' dragover' : ''}`}
        onClick={() => inputRef.current.click()}
        onDragOver={handleDragOver}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".heic,.HEIC,.heif,.HEIF,image/heic,image/heif"
          multiple
          hidden
          onChange={(e) => {
            if (e.target.files?.length) onFiles(e.target.files)
            e.target.value = ''
          }}
        />
        <div className="upload-content">
          <svg className="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <p className="upload-text">Drop HEIC files here or click to browse</p>
          <p className="upload-hint">Supports .heic and .heif &mdash; multiple files allowed</p>
        </div>
      </div>
    </section>
  )
}
