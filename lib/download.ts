"use client"

import { renderPdfPagesToImages } from "@/lib/pdf-image-tools"

const PRINT_CLEANUP_DELAY_MS = 1000
const PRINT_FALLBACK_CLEANUP_MS = 120000
const MOBILE_PRINT_RENDER_SCALE = 2.2

export interface PrintBlobOptions {
  preferImagePrint?: boolean
  printWindow?: Window | null
}

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

export function openPrintWindow() {
  const printWindow = window.open("", "_blank")

  if (!printWindow) {
    return null
  }

  writePrintWindowDocument(
    printWindow,
    `<div class="screen-only preparing">
      <strong>Preparation de l'impression...</strong>
      <span>Gardez cet onglet ouvert, l'etiquette va s'afficher ici.</span>
    </div>`,
  )

  return printWindow
}

export function closePrintWindow(printWindow?: Window | null) {
  if (!printWindow || printWindow.closed) {
    return
  }

  try {
    printWindow.close()
  } catch {
    // Mobile browsers may refuse scripted closing in some situations.
  }
}

function createPrintFrame() {
  const frame = document.createElement("iframe")
  frame.style.position = "fixed"
  frame.style.inset = "0"
  frame.style.width = "100vw"
  frame.style.height = "100vh"
  frame.style.border = "0"
  frame.style.opacity = "0"
  frame.style.pointerEvents = "none"
  frame.style.zIndex = "-1"
  return frame
}

function cleanupPrintFrame(frame: HTMLIFrameElement, urls: string[] = []) {
  window.setTimeout(() => {
    frame.remove()
    urls.forEach((url) => URL.revokeObjectURL(url))
  }, PRINT_CLEANUP_DELAY_MS)
}

function attachPrintCleanup(frame: HTMLIFrameElement, urls: string[] = []) {
  const targetWindow = frame.contentWindow
  let cleaned = false

  const cleanup = () => {
    if (cleaned) {
      return
    }

    cleaned = true
    cleanupPrintFrame(frame, urls)
  }

  targetWindow?.addEventListener("afterprint", cleanup, { once: true })
  window.setTimeout(cleanup, PRINT_FALLBACK_CLEANUP_MS)

  return cleanup
}

function printFrame(frame: HTMLIFrameElement, urls: string[] = []) {
  const targetWindow = frame.contentWindow

  if (!targetWindow) {
    throw new Error("Impossible d'ouvrir la fenetre d'impression.")
  }

  attachPrintCleanup(frame, urls)
  targetWindow.focus()
  targetWindow.print()
}

function printPdfBlobInFrame(blob: Blob) {
  return new Promise<void>((resolve, reject) => {
    const url = URL.createObjectURL(blob)
    const frame = createPrintFrame()
    let settled = false

    const fail = (error: Error) => {
      if (settled) {
        return
      }

      settled = true
      cleanupPrintFrame(frame, [url])
      reject(error)
    }

    const loadTimeout = window.setTimeout(() => {
      fail(new Error("Le PDF n'a pas pu etre charge pour l'impression."))
    }, 15000)

    frame.onload = () => {
      if (settled) {
        return
      }

      window.clearTimeout(loadTimeout)

      window.setTimeout(() => {
        try {
          printFrame(frame, [url])
          settled = true
          resolve()
        } catch (error) {
          fail(error instanceof Error ? error : new Error("Impossible de lancer l'impression."))
        }
      }, 250)
    }

    frame.onerror = () => fail(new Error("Le PDF n'a pas pu etre charge pour l'impression."))
    frame.src = url
    document.body.appendChild(frame)
  })
}

function escapeAttribute(value: string) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;")
}

function getPrintStyles() {
  return `
    @page {
      size: A4 portrait;
      margin: 0;
    }

    html,
    body {
      margin: 0;
      padding: 0;
      background: #ffffff;
      color: #0f172a;
      font-family: Arial, sans-serif;
    }

    .screen-only {
      display: none;
    }

    .print-page {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 210mm;
      height: 297mm;
      margin: 0;
      overflow: hidden;
      break-after: page;
      page-break-after: always;
      background: #ffffff;
    }

    .print-page:last-child {
      break-after: auto;
      page-break-after: auto;
    }

    .print-page img {
      display: block;
      width: 210mm;
      height: 297mm;
      object-fit: contain;
    }

    @media screen {
      html,
      body {
        min-height: 100%;
        background: #e8f0f6;
      }

      .screen-only {
        display: flex;
      }

      .print-toolbar,
      .preparing {
        position: sticky;
        top: 0;
        z-index: 2;
        flex-direction: column;
        gap: 10px;
        margin: 0;
        padding: 16px;
        background: #0f172a;
        color: #ffffff;
        box-shadow: 0 16px 40px rgba(15, 23, 42, 0.25);
      }

      .print-toolbar p,
      .preparing span {
        margin: 0;
        color: rgba(255, 255, 255, 0.78);
        font-size: 14px;
        line-height: 1.45;
      }

      .print-toolbar-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }

      .print-toolbar button {
        border: 0;
        border-radius: 999px;
        padding: 11px 16px;
        font: inherit;
        font-weight: 700;
      }

      .print-toolbar button:first-child {
        background: #38bdf8;
        color: #082f49;
      }

      .print-toolbar button:last-child {
        background: rgba(255, 255, 255, 0.12);
        color: #ffffff;
      }

      .print-page {
        margin: 16px auto;
        box-shadow: 0 24px 70px rgba(15, 23, 42, 0.24);
      }
    }

    @media print {
      html,
      body {
        width: 210mm;
        background: #ffffff;
      }

      .screen-only {
        display: none !important;
      }
    }
  `
}

function writePrintWindowDocument(targetWindow: Window, bodyHtml: string) {
  const targetDocument = targetWindow.document

  targetDocument.open()
  targetDocument.write(`<!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Impression etiquette A4</title>
        <style>${getPrintStyles()}</style>
      </head>
      <body>${bodyHtml}</body>
    </html>`)
  targetDocument.close()

  return targetDocument
}

function getPrintPagesHtml(imageUrls: string[]) {
  return imageUrls
    .map(
      (url, index) => `
        <section class="print-page">
          <img src="${escapeAttribute(url)}" alt="Page A4 ${index + 1}" />
        </section>
      `,
    )
    .join("")
}

function getPrintToolbarHtml() {
  return `
    <div class="screen-only print-toolbar">
      <strong>Etiquette prete a imprimer</strong>
      <p>Si la fenetre d'impression ne s'ouvre pas automatiquement, utilisez le bouton ci-dessous. Seules les pages A4 ci-dessous seront imprimees.</p>
      <div class="print-toolbar-actions">
        <button type="button" onclick="window.print()">Imprimer l'etiquette</button>
        <button type="button" onclick="window.close()">Fermer</button>
      </div>
    </div>
  `
}

async function waitForImages(document: Document) {
  const images = Array.from(document.images)

  await Promise.all(
    images.map(
      (image) =>
        new Promise<void>((resolve, reject) => {
          if (image.complete) {
            if (image.naturalWidth > 0) {
              resolve()
            } else {
              reject(new Error("Une page du PDF n'a pas pu etre preparee pour l'impression."))
            }
            return
          }

          image.onload = () => resolve()
          image.onerror = () => reject(new Error("Une page du PDF n'a pas pu etre preparee pour l'impression."))
        }),
    ),
  )

  await Promise.all(images.map((image) => image.decode?.().catch(() => undefined)))
}

function waitForNextPaint(window: Window) {
  return new Promise<void>((resolve) => {
    let resolved = false
    let timeout = 0
    const done = () => {
      if (resolved) {
        return
      }

      resolved = true
      window.clearTimeout(timeout)
      resolve()
    }
    timeout = window.setTimeout(done, 250)

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(done)
    })
  })
}

function attachTopLevelPrintCleanup(targetWindow: Window, urls: string[]) {
  const cleanup = () => {
    urls.forEach((url) => URL.revokeObjectURL(url))
    closePrintWindow(targetWindow)
  }

  targetWindow.addEventListener("afterprint", cleanup, { once: true })
}

async function printPdfBlobAsImages(blob: Blob, targetPrintWindow?: Window | null) {
  const renderedPages = await renderPdfPagesToImages(blob, undefined, MOBILE_PRINT_RENDER_SCALE)

  if (renderedPages.length === 0) {
    throw new Error("Le PDF ne contient aucune page a imprimer.")
  }

  const imageUrls = renderedPages.map((page) => URL.createObjectURL(page.blob))
  const frame = targetPrintWindow ? null : createPrintFrame()

  if (frame) {
    document.body.appendChild(frame)
  }

  try {
    const targetWindow = targetPrintWindow ?? frame?.contentWindow ?? null

    if (!targetWindow) {
      throw new Error("Impossible de preparer l'impression.")
    }

    const frameDocument = writePrintWindowDocument(
      targetWindow,
      `${targetPrintWindow ? getPrintToolbarHtml() : ""}${getPrintPagesHtml(imageUrls)}`,
    )

    await waitForImages(frameDocument)
    await waitForNextPaint(targetWindow)

    if (frame) {
      attachPrintCleanup(frame, imageUrls)
    } else {
      attachTopLevelPrintCleanup(targetWindow, imageUrls)
    }

    targetWindow.focus()
    targetWindow.print()
  } catch (error) {
    if (frame) {
      cleanupPrintFrame(frame, imageUrls)
    } else {
      imageUrls.forEach((url) => URL.revokeObjectURL(url))
    }

    throw error
  }
}

export async function printBlob(blob: Blob, options: PrintBlobOptions = {}) {
  if (options.preferImagePrint) {
    await printPdfBlobAsImages(blob, options.printWindow)
    return
  }

  await printPdfBlobInFrame(blob)
}
