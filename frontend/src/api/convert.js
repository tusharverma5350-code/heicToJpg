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
