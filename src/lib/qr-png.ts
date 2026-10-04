// ---------------------------------------------------------------------------
// Client-side QR PNG export. Fetches the branded SVG from /api/qr/[code],
// rasterizes it onto an offscreen canvas at print resolution (1024×1024) and
// triggers a PNG download. Print shops often can't take SVG — this produces
// a real raster file without adding a server dependency.
// ---------------------------------------------------------------------------

export async function downloadQrPng(code: string, size = 1024): Promise<void> {
  const res = await fetch(`/api/qr/${encodeURIComponent(code)}`)
  if (!res.ok) throw new Error(`QR fetch failed (${res.status})`)
  const svg = await res.text()

  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" })
  const url = URL.createObjectURL(blob)

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image()
      el.onload = () => resolve(el)
      el.onerror = () => reject(new Error("SVG decode failed"))
      el.src = url
    })

    const canvas = document.createElement("canvas")
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("Canvas unsupported")

    // White background so scanners get max contrast.
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, size, size)
    ctx.drawImage(img, 0, 0, size, size)

    const pngBlob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/png"),
    )
    if (!pngBlob) throw new Error("PNG encoding failed")

    const a = document.createElement("a")
    a.href = URL.createObjectURL(pngBlob)
    a.download = `nxtwave-qr-${code}.png`
    document.body.appendChild(a)
    a.click()
    a.remove()
    // Release the object URL after the download kicks off.
    setTimeout(() => URL.revokeObjectURL(a.href), 4000)
  } finally {
    URL.revokeObjectURL(url)
  }
}
