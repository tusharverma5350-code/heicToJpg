/**
 * Warms up the Railway backend on page load so the first conversion
 * doesn't hit a cold-start delay.
 */
export function warmUp() {
  fetch('/api/health').catch(() => {})
}

/**
 * Sends multiple HEIC files in ONE request to the batch endpoint.
 * Returns an array of { name, data (base64 JPEG), success }.
 */
export async function convertBatch(files) {
  const formData = new FormData()
  files.forEach(f => formData.append('files', f))

  const res  = await fetch('/api/convert-batch', { method: 'POST', body: formData })
  const json = await res.json()

  if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`)
  return json.files   // array of { success, name, data }
}

/**
 * Sends one HEIC file to the Spring Boot backend for conversion.
 * Returns { name, data (base64 JPEG) } on success, throws on failure.
 */
export async function convertFile(file) {
  const formData = new FormData()
  formData.append('file', file)

  const res  = await fetch('/api/convert', { method: 'POST', body: formData })
  const json = await res.json()

  if (!res.ok || !json.success) {
    throw new Error(json.details || json.error || `HTTP ${res.status}`)
  }
  return json   // { success, name, data }
}

export function base64ToBlob(base64, mime = 'image/jpeg') {
  const binary = atob(base64)
  const bytes  = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new Blob([bytes], { type: mime })
}
