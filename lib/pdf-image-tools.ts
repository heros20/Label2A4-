"use client"

import { getPdfJs } from "@/lib/pdfjs-client"

export interface RenderedPdfImage {
  blob: Blob
  width: number
  height: number
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function normalizeRotation(rotation: number) {
  return ((Math.round(rotation / 90) * 90) % 360 + 360) % 360
}

function canvasToBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Impossible de generer l'apercu."))
        return
      }

      resolve(blob)
    }, "image/png")
  })
}

export async function renderPdfPageToImage(
  source: Blob,
  pageNumber = 1,
  scale = 1.4,
  rotation = 0,
): Promise<RenderedPdfImage> {
  const [pageImage] = await renderPdfPagesToImages(source, [pageNumber], scale, rotation)

  if (!pageImage) {
    throw new Error(`La page ${pageNumber} est hors limites.`)
  }

  return pageImage
}

export async function renderPdfPagesToImages(
  source: Blob,
  pageNumbers?: number[],
  scale = 1.4,
  rotation = 0,
): Promise<RenderedPdfImage[]> {
  const pdfjs = await getPdfJs()
  const inputBytes = new Uint8Array(await source.arrayBuffer())
  const loadingTask = pdfjs.getDocument({
    data: inputBytes,
    verbosity: pdfjs.VerbosityLevel.ERRORS,
  })
  const pdfDocument = await loadingTask.promise

  try {
    const pagesToRender =
      pageNumbers ?? Array.from({ length: pdfDocument.numPages }, (_, index) => index + 1)
    const renderedPages: RenderedPdfImage[] = []

    for (const pageNumber of pagesToRender) {
      if (!Number.isInteger(pageNumber) || pageNumber < 1 || pageNumber > pdfDocument.numPages) {
        throw new Error(`La page ${pageNumber} est hors limites.`)
      }

      const page = await pdfDocument.getPage(pageNumber)
      const viewport = page.getViewport({
        scale: clamp(scale, 0.75, 3),
        rotation: normalizeRotation((page.rotate ?? 0) + rotation),
      })
      const canvas = document.createElement("canvas")
      canvas.width = Math.max(1, Math.round(viewport.width))
      canvas.height = Math.max(1, Math.round(viewport.height))

      const context = canvas.getContext("2d", { alpha: false })
      if (!context) {
        throw new Error("Impossible d'initialiser le canvas d'apercu.")
      }

      context.fillStyle = "#ffffff"
      context.fillRect(0, 0, canvas.width, canvas.height)

      await page.render({
        canvas,
        canvasContext: context,
        viewport,
      }).promise

      renderedPages.push({
        blob: await canvasToBlob(canvas),
        width: canvas.width,
        height: canvas.height,
      })
    }

    return renderedPages
  } finally {
    await loadingTask.destroy()
  }
}
