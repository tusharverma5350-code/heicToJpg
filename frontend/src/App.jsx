import { useState, useCallback, useRef, useEffect, startTransition } from 'react'
import UploadZone   from './components/UploadZone'
import ProgressBar  from './components/ProgressBar'
import Gallery      from './components/Gallery'
import { convertBatch, convertFile, base64ToBlob, warmUp } from './api/convert'

export default function App() {
  // 'upload' | 'converting' | 'done'
  const [view,     setView]     = useState('upload')
  const [progress, setProgress] = useState({ done: 0, total: 0, failed: 0 })
  const [images,   setImages]   = useState([])   // { id, name, url }  — no blob in state
  const blobsRef = useRef(new Map())             // id → Blob, kept outside React state
  const [errorMsg, setErrorMsg] = useState('')

  // Ping the backend the moment the page loads so Railway wakes up
  // before the user selects files — eliminates cold-start delay.
  useEffect(() => { warmUp() }, [])

  const handleFiles = useCallback(async (files) => {
    const heicFiles = Array.from(files).filter(f =>
      /\.(heic|heif)$/i.test(f.name) ||
      f.type === 'image/heic' ||
      f.type === 'image/heif'
    )
    if (!heicFiles.length) {
      setErrorMsg('No HEIC/HEIF files found. Please select .heic or .heif images.')
      return
    }

    setView('converting')
    setImages([])
    setErrorMsg('')
    setProgress({ done: 0, total: heicFiles.length, failed: 0 })

    try {
      // Send all files in ONE request — avoids N round trips to Railway
      const results = await convertBatch(heicFiles)

      results.forEach((result, i) => {
        if (!result.success) {
          setProgress(p => ({ ...p, done: p.done + 1, failed: p.failed + 1 }))
          return
        }
        const blob  = base64ToBlob(result.data)
        const url   = URL.createObjectURL(blob)
        const id    = `${heicFiles[i].name}-${Date.now()}-${Math.random()}`
        blobsRef.current.set(id, blob)
        startTransition(() => {
          setImages(prev => [...prev, { id, name: result.name, url }])
        })
        setProgress(p => ({ ...p, done: p.done + 1 }))
      })
    } catch (err) {
      console.error('[convert] Batch failed, falling back to single:', err)
      // Fallback: individual requests if batch endpoint fails
      await Promise.all(
        heicFiles.map(async (file) => {
          try {
            const result = await convertFile(file)
            const blob   = base64ToBlob(result.data)
            const url    = URL.createObjectURL(blob)
            const id     = `${file.name}-${Date.now()}-${Math.random()}`
            blobsRef.current.set(id, blob)
            startTransition(() => {
              setImages(prev => [...prev, { id, name: result.name, url }])
            })
            setProgress(p => ({ ...p, done: p.done + 1 }))
          } catch (e) {
            console.error('[convert] Failed:', file.name, e)
            setProgress(p => ({ ...p, done: p.done + 1, failed: p.failed + 1 }))
          }
        })
      )
    }

    setView('done')
  }, [])

  const reset = useCallback(() => {
    setImages(prev => {
      prev.forEach(img => {
        URL.revokeObjectURL(img.url)
        blobsRef.current.delete(img.id)
      })
      return []
    })
    setView('upload')
    setProgress({ done: 0, total: 0, failed: 0 })
    setErrorMsg('')
  }, [])

  return (
    <div className="app">
      <header className="header">
        <h1>HEIC &rarr; JPG Converter</h1>
        <p className="subtitle">Upload iPhone HEIC photos &mdash; converted in parallel on Java server</p>
        {errorMsg && <p className="status-message error">{errorMsg}</p>}
      </header>

      <main className="main">
        {view === 'upload' && (
          <UploadZone onFiles={handleFiles} />
        )}

        {view === 'converting' && (
          <>
            <ProgressBar done={progress.done} total={progress.total} failed={progress.failed} />
            {/* Show gallery progressively as images arrive during conversion */}
            {images.length > 0 && (
              <Gallery images={images} blobsRef={blobsRef} onReset={reset} converting />
            )}
          </>
        )}

        {view === 'done' && (
          <Gallery
            images={images}
            blobsRef={blobsRef}
            onReset={reset}
            failed={progress.failed}
          />
        )}
      </main>

      <footer className="footer">
        <p>Conversion runs on your local Java server &mdash; files never leave your machine.</p>
      </footer>
    </div>
  )
}
