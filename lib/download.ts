export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function printBlob(blob: Blob) {
  const url = URL.createObjectURL(blob)
  const frame = document.createElement("iframe")
  frame.style.position = "fixed"
  frame.style.right = "0"
  frame.style.bottom = "0"
  frame.style.width = "0"
  frame.style.height = "0"
  frame.style.border = "0"

  const cleanup = () => {
    window.setTimeout(() => {
      frame.remove()
      URL.revokeObjectURL(url)
    }, 1000)
  }

  frame.onload = () => {
    const targetWindow = frame.contentWindow

    if (!targetWindow) {
      cleanup()
      return
    }

    targetWindow.addEventListener("afterprint", cleanup, { once: true })
    window.setTimeout(cleanup, 30000)
    targetWindow.focus()
    targetWindow.print()
  }

  frame.src = url
  document.body.appendChild(frame)
}
