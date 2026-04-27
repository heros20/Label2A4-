import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { NextRequest, NextResponse } from "next/server"
import { PDFDocument, StandardFonts, rgb } from "pdf-lib"

const A4 = { width: 595.28, height: 841.89 }
const logoPath = join(process.cwd(), "public", "images", "logo", "label2a4.png")
const qrCodePath = join(process.cwd(), "public", "images", "qr-code", "qrcodelabel.png")

export const dynamic = "force-dynamic"

function drawWrappedText({
  font,
  fontSize,
  lineHeight,
  maxWidth,
  page,
  text,
  x,
  y,
  color = rgb(0.2, 0.25, 0.34),
}: {
  font: Awaited<ReturnType<PDFDocument["embedFont"]>>
  fontSize: number
  lineHeight: number
  maxWidth: number
  page: ReturnType<PDFDocument["addPage"]>
  text: string
  x: number
  y: number
  color?: ReturnType<typeof rgb>
}) {
  const words = text.split(" ")
  const lines: string[] = []
  let currentLine = ""

  for (const word of words) {
    const nextLine = currentLine ? `${currentLine} ${word}` : word
    if (font.widthOfTextAtSize(nextLine, fontSize) <= maxWidth) {
      currentLine = nextLine
    } else {
      if (currentLine) {
        lines.push(currentLine)
      }
      currentLine = word
    }
  }

  if (currentLine) {
    lines.push(currentLine)
  }

  lines.forEach((line, index) => {
    page.drawText(line, {
      x,
      y: y - index * lineHeight,
      size: fontSize,
      font,
      color,
    })
  })

  return y - Math.max(lines.length - 1, 0) * lineHeight
}

async function buildFlyerPdf() {
  const pdf = await PDFDocument.create()
  const page = pdf.addPage([A4.width, A4.height])
  const font = await pdf.embedFont(StandardFonts.Helvetica)
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)
  const logo = await pdf.embedPng(await readFile(logoPath))
  const qrCode = await pdf.embedPng(await readFile(qrCodePath))

  page.drawRectangle({
    x: 0,
    y: 0,
    width: A4.width,
    height: A4.height,
    color: rgb(1, 1, 1),
  })

  page.drawRectangle({
    x: 0,
    y: A4.height - 240,
    width: A4.width,
    height: 240,
    color: rgb(0.94, 0.98, 1),
  })

  const margin = 52
  const logoWidth = 160
  const logoHeight = logoWidth * (logo.height / logo.width)
  page.drawImage(logo, {
    x: margin,
    y: A4.height - margin - logoHeight,
    width: logoWidth,
    height: logoHeight,
  })

  page.drawRectangle({
    x: A4.width - margin - 160,
    y: A4.height - margin - 32,
    width: 160,
    height: 32,
    color: rgb(0.94, 0.98, 1),
    borderColor: rgb(0.73, 0.9, 0.99),
    borderWidth: 1,
  })
  page.drawText("Étiquette optimisée sur A4", {
    x: A4.width - margin - 145,
    y: A4.height - margin - 21,
    size: 11,
    font: bold,
    color: rgb(0.03, 0.35, 0.52),
  })

  page.drawRectangle({
    x: margin,
    y: 405,
    width: A4.width - margin * 2,
    height: 275,
    color: rgb(1, 1, 1),
    borderColor: rgb(0.86, 0.93, 1),
    borderWidth: 1,
  })

  page.drawText("Petite info colis", {
    x: margin + 28,
    y: 640,
    size: 13,
    font: bold,
    color: rgb(0.01, 0.41, 0.63),
  })

  drawWrappedText({
    page,
    font: bold,
    text: "L'étiquette de ce colis a été imprimée avec Label2A4.",
    x: margin + 28,
    y: 598,
    maxWidth: 430,
    fontSize: 31,
    lineHeight: 36,
    color: rgb(0.06, 0.09, 0.16),
  })

  drawWrappedText({
    page,
    font,
    text:
      "Label2A4 regroupe plusieurs étiquettes colis sur une seule feuille A4 pour imprimer plus proprement.",
    x: margin + 28,
    y: 512,
    maxWidth: 430,
    fontSize: 13,
    lineHeight: 18,
    color: rgb(0.2, 0.25, 0.34),
  })

  const proofY = 410
  const proofGap = 12
  const proofStartX = margin + 28
  const proofAvailableWidth = A4.width - margin * 2 - 56
  const proofWidth = (proofAvailableWidth - proofGap * 2) / 3
  const proofs = [
    ["Jusqu'à 4 étiquettes", "sur une seule feuille A4 selon les formats compatibles."],
    ["Moins de gaspillage", "moins de feuilles utilisées pour préparer les envois."],
    ["Simple à utiliser", "importez vos PDF, choisissez le transporteur, imprimez."],
  ] as const

  proofs.forEach(([title, description], index) => {
    const x = proofStartX + index * (proofWidth + proofGap)
    page.drawRectangle({
      x,
      y: proofY,
      width: proofWidth,
      height: 66,
      color: rgb(0.97, 0.98, 0.99),
      borderColor: rgb(0.89, 0.91, 0.94),
      borderWidth: 1,
    })
    page.drawText(title, {
      x: x + 12,
      y: proofY + 36,
      size: 12,
      font: bold,
      color: rgb(0.06, 0.09, 0.16),
    })
    drawWrappedText({
      page,
      font,
      text: description,
      x: x + 12,
      y: proofY + 22,
      maxWidth: proofWidth - 24,
      fontSize: 8.5,
      lineHeight: 10,
      color: rgb(0.28, 0.33, 0.41),
    })
  })

  page.drawRectangle({
    x: margin,
    y: 160,
    width: 4,
    height: 135,
    color: rgb(0.01, 0.52, 0.78),
  })
  page.drawText("Vous envoyez aussi des colis ?", {
    x: margin + 20,
    y: 268,
    size: 21,
    font: bold,
    color: rgb(0.06, 0.09, 0.16),
  })
  drawWrappedText({
    page,
    font,
    text: "Essayez Label2A4 pour vos étiquettes Colissimo, Mondial Relay, Chronopost et bien d'autres.",
    x: margin + 20,
    y: 232,
    maxWidth: 270,
    fontSize: 12,
    lineHeight: 16,
    color: rgb(0.2, 0.25, 0.34),
  })
  page.drawRectangle({
    x: margin + 20,
    y: 150,
    width: 172,
    height: 34,
    borderColor: rgb(0.06, 0.09, 0.16),
    borderWidth: 1,
  })
  page.drawText("label2a4.com", {
    x: margin + 40,
    y: 160,
    size: 18,
    font: bold,
    color: rgb(0.06, 0.09, 0.16),
  })

  page.drawRectangle({
    x: A4.width - margin - 132,
    y: 160,
    width: 132,
    height: 150,
    color: rgb(1, 1, 1),
    borderColor: rgb(0.8, 0.84, 0.89),
    borderWidth: 1,
  })
  page.drawImage(qrCode, {
    x: A4.width - margin - 114,
    y: 196,
    width: 96,
    height: 96,
  })
  page.drawText("Scannez pour découvrir l'outil", {
    x: A4.width - margin - 123,
    y: 176,
    size: 9,
    font,
    color: rgb(0.28, 0.33, 0.41),
  })

  page.drawLine({
    start: { x: margin, y: 90 },
    end: { x: A4.width - margin, y: 90 },
    thickness: 1,
    color: rgb(0.89, 0.91, 0.94),
  })
  page.drawText("Label2A4 - préparez vos étiquettes colis plus simplement.", {
    x: margin,
    y: 64,
    size: 10,
    font: bold,
    color: rgb(0.28, 0.33, 0.41),
  })
  page.drawText("https://label2a4.com", {
    x: A4.width - margin - 105,
    y: 64,
    size: 10,
    font,
    color: rgb(0.28, 0.33, 0.41),
  })

  return pdf.save()
}

export async function GET(request: NextRequest) {
  const shouldDownload = request.nextUrl.searchParams.get("download") === "1"
  const pdfBytes = await buildFlyerPdf()
  const pdfBody = new ArrayBuffer(pdfBytes.byteLength)
  new Uint8Array(pdfBody).set(pdfBytes)

  return new NextResponse(pdfBody, {
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Disposition": shouldDownload
        ? 'attachment; filename="flyer-label2a4-a4.pdf"'
        : 'inline; filename="flyer-label2a4-a4.pdf"',
      "Content-Type": "application/pdf",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
    },
  })
}
