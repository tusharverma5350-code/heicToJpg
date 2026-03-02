import { memo, useCallback } from 'react'

// memo() prevents re-render when sibling images change selection state
const GalleryItem = memo(function GalleryItem({ img, selected, onToggle, onDownload }) {
  const handleClick    = useCallback(() => onToggle(img.id), [img.id, onToggle])
  const handleDownload = useCallback((e) => {
    e.stopPropagation()
    onDownload(img)
  }, [img, onDownload])

  return (
    <div
      className={`gallery-item${selected ? ' selected' : ''}`}
      onClick={handleClick}
      role="checkbox"
      aria-checked={selected}
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
    >
      {/* loading="lazy"  — defers network fetch for off-screen images        */}
      {/* decoding="async" — image decode runs off the main thread            */}
      <img src={img.url} alt={img.name} decoding="async" />

      {selected && (
        <span className="check">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </span>
      )}

      <span className="label">{img.name}</span>

      <button
        type="button"
        className="btn-download-one"
        onClick={handleDownload}
        title="Download this image"
      >
        ⬇ Download
      </button>
    </div>
  )
})

export default GalleryItem
