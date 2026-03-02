import { useState, useEffect, useCallback } from 'react'
import JSZip from 'jszip'
import GalleryItem from './GalleryItem'

export default function Gallery({ images, blobsRef, onReset, converting = false, failed = 0 }) {
  // Set of selected image IDs — kept separate from images array so toggling
  // one item doesn't re-render the whole list (only the toggled GalleryItem re-renders)
  const [selected, setSelected] = useState(new Set())
  const [zipping,  setZipping]  = useState(false)

  // Auto-select every image as it arrives
  useEffect(() => {
    if (!images.length) { setSelected(new Set()); return }
    setSelected(prev => {
      const next = new Set(prev)
      images.forEach(img => next.add(img.id))
      return next
    })
  }, [images])

  const toggleSelect = useCallback((id) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }, [])

  const downloadOne = useCallback((img) => {
    const a = document.createElement('a')
    a.href     = img.url
    a.download = img.name
    a.click()
  }, [])

  const downloadZip = useCallback(async (imgs, filename) => {
    if (!imgs.length) return
    setZipping(true)
    try {
      const zip  = new JSZip()
      const used = new Set()
      imgs.forEach(img => {
        let name = img.name
        if (used.has(name)) {
          const base = name.replace(/\.jpg$/i, '')
          let n = 1
          while (used.has(`${base}_${n}.jpg`)) n++
          name = `${base}_${n}.jpg`
        }
        used.add(name)
        zip.file(name, blobsRef.current.get(img.id))
      })
      const blob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 4 },
      })
      const url = URL.createObjectURL(blob)
      const a   = document.createElement('a')
      a.href     = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('ZIP failed', err)
      alert('ZIP creation failed. Try downloading images individually.')
    } finally {
      setZipping(false)
    }
  }, [])

  const selectedImages = images.filter(img => selected.has(img.id))
  const selectedCount  = selectedImages.length

  const handleDownloadSelected = useCallback(() => {
    if (selectedCount === 1) downloadOne(selectedImages[0])
    else downloadZip(selectedImages, 'heic-converted-selected.zip')
  }, [selectedCount, selectedImages, downloadOne, downloadZip])

  return (
    <section className="gallery-section">
      {/* Action bar — hidden while still converting */}
      {!converting && (
        <div className="actions-bar">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => downloadZip(images, 'heic-converted-all.zip')}
            disabled={zipping || !images.length}
          >
            {zipping ? 'Zipping…' : '⬇ Download All as ZIP'}
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleDownloadSelected}
            disabled={selectedCount === 0 || zipping}
          >
            Download Selected ({selectedCount})
          </button>

          <button type="button" className="btn btn-ghost" onClick={onReset}>
            + Upload More
          </button>

          {failed > 0 && (
            <span className="status-message error" style={{ marginLeft: 'auto' }}>
              {failed} file{failed > 1 ? 's' : ''} failed to convert
            </span>
          )}
        </div>
      )}

      {converting && (
        <p className="select-hint">Images appear as they finish converting…</p>
      )}

      {!converting && (
        <p className="select-hint">
          Click an image to select / deselect. Hover for individual download.
        </p>
      )}

      <div className="gallery">
        {images.map(img => (
          <GalleryItem
            key={img.id}
            img={img}
            selected={selected.has(img.id)}
            onToggle={toggleSelect}
            onDownload={downloadOne}
          />
        ))}
      </div>
    </section>
  )
}
