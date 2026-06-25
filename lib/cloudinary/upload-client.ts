/**
 * Sube un archivo a Cloudinary usando una firma generada en el servidor.
 * Uso exclusivo del cliente (admin). Reporta progreso vía callback.
 */
export async function uploadToCloudinary(
  file: File,
  folder: string,
  onProgress: (pct: number) => void,
): Promise<string> {
  const signRes = await fetch('/api/admin/cloudinary/sign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ folder }),
  })
  if (!signRes.ok) throw new Error('No se pudo autorizar la subida')
  const { signature, timestamp, cloudName, apiKey, folder: signedFolder } = await signRes.json()

  const form = new FormData()
  form.append('file', file)
  form.append('api_key', apiKey)
  form.append('timestamp', String(timestamp))
  form.append('folder', signedFolder)
  form.append('signature', signature)

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`)
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100))
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve(JSON.parse(xhr.responseText).secure_url)
      else reject(new Error('Error al subir la imagen'))
    }
    xhr.onerror = () => reject(new Error('Error de red al subir'))
    xhr.send(form)
  })
}
