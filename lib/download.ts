"use client"

import { renderPdfPagesToImages } from "@/lib/pdf-image-tools"

const PRINT_CLEANUP_DELAY_MS = 1000
const PRINT_FALLBACK_CLEANUP_MS = 120000
const MOBILE_PRINT_RENDER_SCALE = 2.2

export interface PrintBlobOptions {
  preferImagePrint?: boolean
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

async function printPdfBlobAsImages(blob: Blob) {
  const renderedPages = await renderPdfPagesToImages(blob, undefined, MOBILE_PRINT_RENDER_SCALE)

  if (renderedPages.length === 0) {
    throw new Error("Le PDF ne contient aucune page a imprimer.")
  }

  const imageUrls = renderedPages.map((page) => URL.createObjectURL(page.blob))
  const frame = createPrintFrame()
  document.body.appendChild(frame)

  try {
    const frameDocument = frame.contentDocument
    const targetWindow = frame.contentWindow

    if (!frameDocument || !targetWindow) {
      throw new Error("Impossible de preparer l'impression.")
    }

    const pagesHtml = imageUrls
      .map(
        (url, index) => `
          <section class="print-page">
            <img src="${escapeAttribute(url)}" alt="Page A4 ${index + 1}" />
          </section>
        `,
      )
      .join("")

    frameDocument.open()
    frameDocument.write(`<!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Impression PDF A4</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 0;
            }

            html,
            body {
              width: 210mm;
              margin: 0;
              padding: 0;
              background: #ffffff;
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
          </style>
        </head>
        <body>${pagesHtml}</body>
      </html>`)
    frameDocument.close()

    await waitForImages(frameDocument)
    await waitForNextPaint(targetWindow)
    attachPrintCleanup(frame, imageUrls)
    targetWindow.focus()
    targetWindow.print()
  } catch (error) {
    cleanupPrintFrame(frame, imageUrls)
    throw error
  }
}

export async function printBlob(blob: Blob, options: PrintBlobOptions = {}) {
  if (options.preferImagePrint) {
    try {
      await printPdfBlobAsImages(blob)
      return
    } catch {
      await printPdfBlobInFrame(blob)
      return
    }
  }

  await printPdfBlobInFrame(blob)
}
