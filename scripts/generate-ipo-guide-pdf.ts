/**
 * Generates the IPO subscription guide PDF — a practical investor document.
 * Run: bun run ipo:guide-pdf
 */
import { mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PDFDocument, type PDFPage, rgb, StandardFonts, type PDFFont } from 'pdf-lib'

import {
  IPO_GUIDE_META,
  IPO_GUIDE_SECTIONS,
  IPO_GUIDE_TOC,
} from '#/lib/ipo-guide-content'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, 'public/campaign/guide-souscription-ipo-bridge-bank.pdf')

const PAGE_W = 595.28
const PAGE_H = 841.89
const MARGIN = 50
const CONTENT_W = PAGE_W - MARGIN * 2
const FOOTER_Y = 32

const GREEN = rgb(1 / 255, 45 / 255, 42 / 255)
const GOLD = rgb(203 / 255, 152 / 255, 36 / 255)
const INK = rgb(10 / 255, 10 / 255, 10 / 255)
const MUTED = rgb(87 / 255, 87 / 255, 87 / 255)
const IVORY = rgb(250 / 255, 248 / 255, 244 / 255)
const LINE = rgb(0.88, 0.88, 0.86)

type Fonts = { regular: PDFFont; bold: PDFFont }

class GuidePdf {
  doc: PDFDocument
  fonts: Fonts
  page!: PDFPage
  y = 0
  pageNum = 0

  constructor(doc: PDFDocument, fonts: Fonts) {
    this.doc = doc
    this.fonts = fonts
  }

  addPage(content = true) {
    this.page = this.doc.addPage([PAGE_W, PAGE_H])
    this.pageNum += 1
    this.page.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: PAGE_H, color: IVORY })
    if (content) {
      this.drawContentHeader()
      this.y = PAGE_H - 100
      this.drawFooter()
    } else {
      this.y = PAGE_H - 80
    }
    return this
  }

  drawContentHeader() {
    this.page.drawRectangle({ x: 0, y: PAGE_H - 52, width: PAGE_W, height: 52, color: GREEN })
    this.page.drawText('EVEREST FINANCE', {
      x: MARGIN,
      y: PAGE_H - 28,
      size: 9,
      font: this.fonts.bold,
      color: rgb(1, 1, 1),
    })
    this.page.drawText('Guide de souscription IPO Bridge Bank', {
      x: MARGIN,
      y: PAGE_H - 42,
      size: 7.5,
      font: this.fonts.regular,
      color: GOLD,
    })
    this.page.drawLine({
      start: { x: MARGIN, y: PAGE_H - 58 },
      end: { x: PAGE_W - MARGIN, y: PAGE_H - 58 },
      thickness: 0.5,
      color: LINE,
    })
  }

  drawFooter() {
    this.page.drawLine({
      start: { x: MARGIN, y: FOOTER_Y + 14 },
      end: { x: PAGE_W - MARGIN, y: FOOTER_Y + 14 },
      thickness: 0.4,
      color: LINE,
    })
    this.page.drawText(`Everest Finance · ${IPO_GUIDE_META.version} · ${IPO_GUIDE_META.publishedAt}`, {
      x: MARGIN,
      y: FOOTER_Y,
      size: 7,
      font: this.fonts.regular,
      color: MUTED,
    })
    this.page.drawText(String(this.pageNum), {
      x: PAGE_W - MARGIN - 12,
      y: FOOTER_Y,
      size: 7,
      font: this.fonts.regular,
      color: MUTED,
    })
  }

  ensureSpace(needed: number) {
    if (this.y - needed < FOOTER_Y + 28) {
      this.addPage()
    }
  }

  sectionTitle(text: string) {
    this.ensureSpace(36)
    this.page.drawText(text, {
      x: MARGIN,
      y: this.y,
      size: 14,
      font: this.fonts.bold,
      color: GREEN,
    })
    this.y -= 22
  }

  paragraph(text: string, size = 10, gap = 14) {
    for (const line of wrapText(text, charWidth(size))) {
      this.ensureSpace(gap)
      this.page.drawText(line, {
        x: MARGIN,
        y: this.y,
        size,
        font: this.fonts.regular,
        color: MUTED,
      })
      this.y -= gap
    }
    this.y -= 4
  }

  bullet(text: string, indent = 0) {
    const lines = wrapText(text, charWidth(9.5) - 4)
    for (let i = 0; i < lines.length; i++) {
      this.ensureSpace(13)
      const line = lines[i]!
      this.page.drawText(i === 0 ? '•' : '', {
        x: MARGIN + indent,
        y: this.y,
        size: 9.5,
        font: this.fonts.regular,
        color: GOLD,
      })
      this.page.drawText(line, {
        x: MARGIN + indent + 14,
        y: this.y,
        size: 9.5,
        font: this.fonts.regular,
        color: MUTED,
      })
      this.y -= 13
    }
  }

  checkbox(label: string) {
    this.ensureSpace(16)
    this.page.drawRectangle({
      x: MARGIN,
      y: this.y - 3,
      width: 10,
      height: 10,
      borderColor: GREEN,
      borderWidth: 0.8,
      color: rgb(1, 1, 1),
    })
    this.page.drawText(label, {
      x: MARGIN + 18,
      y: this.y,
      size: 9.5,
      font: this.fonts.regular,
      color: INK,
    })
    this.y -= 16
  }

  drawCover() {
    this.page = this.doc.addPage([PAGE_W, PAGE_H])
    this.pageNum = 1
    this.page.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: PAGE_H, color: GREEN })
    this.page.drawRectangle({ x: 0, y: PAGE_H * 0.38, width: PAGE_W, height: 4, color: GOLD })

    this.page.drawText('EVEREST FINANCE', {
      x: MARGIN,
      y: PAGE_H - 72,
      size: 12,
      font: this.fonts.bold,
      color: rgb(1, 1, 1),
    })
    this.page.drawText(IPO_GUIDE_META.publisherRole, {
      x: MARGIN,
      y: PAGE_H - 90,
      size: 8,
      font: this.fonts.regular,
      color: rgb(0.75, 0.75, 0.75),
    })

    let y = PAGE_H * 0.52
    this.page.drawText(IPO_GUIDE_META.title.toUpperCase(), {
      x: MARGIN,
      y,
      size: 26,
      font: this.fonts.bold,
      color: rgb(1, 1, 1),
    })
    y -= 34
    for (const line of wrapText(IPO_GUIDE_META.subtitle, 42)) {
      this.page.drawText(line, {
        x: MARGIN,
        y,
        size: 14,
        font: this.fonts.regular,
        color: GOLD,
      })
      y -= 20
    }

    y -= 24
    this.page.drawRectangle({
      x: MARGIN,
      y: y - 72,
      width: CONTENT_W,
      height: 88,
      color: rgb(1, 1, 1),
      opacity: 0.08,
    })
    const metaRows = [
      ['Version', IPO_GUIDE_META.version],
      ['Date', IPO_GUIDE_META.publishedAt],
      ['Intermédiaire', IPO_GUIDE_META.publisher],
    ] as const
    let my = y - 18
    for (const [k, v] of metaRows) {
      this.page.drawText(k, { x: MARGIN + 16, y: my, size: 8, font: this.fonts.regular, color: rgb(0.7, 0.7, 0.7) })
      this.page.drawText(v, { x: MARGIN + 120, y: my, size: 9, font: this.fonts.bold, color: rgb(1, 1, 1) })
      my -= 18
    }

    y = 120
    for (const line of wrapText(IPO_GUIDE_META.disclaimerShort, 78)) {
      this.page.drawText(line, { x: MARGIN, y, size: 8, font: this.fonts.regular, color: rgb(0.65, 0.65, 0.65) })
      y -= 11
    }

    this.page.drawText('© Everest Finance · Document confidentiel investisseur', {
      x: MARGIN,
      y: 48,
      size: 7.5,
      font: this.fonts.regular,
      color: rgb(0.55, 0.55, 0.55),
    })
  }

  drawToc() {
    this.addPage()
    this.sectionTitle('Sommaire')
    this.y -= 8
    for (const item of IPO_GUIDE_TOC) {
      this.ensureSpace(20)
      this.page.drawText(item.id, {
        x: MARGIN,
        y: this.y,
        size: 11,
        font: this.fonts.bold,
        color: GOLD,
      })
      this.page.drawText(item.label, {
        x: MARGIN + 28,
        y: this.y,
        size: 11,
        font: this.fonts.regular,
        color: INK,
      })
      this.page.drawLine({
        start: { x: MARGIN + 200, y: this.y + 3 },
        end: { x: PAGE_W - MARGIN - 20, y: this.y + 3 },
        thickness: 0.3,
        color: LINE,
        dashArray: [2, 3],
      })
      this.y -= 22
    }
  }

  drawOfferTable() {
    this.addPage()
    this.sectionTitle(IPO_GUIDE_SECTIONS.offer.title)
    const col1 = 155
    const rowH = 22
    for (const [label, value] of IPO_GUIDE_SECTIONS.offer.rows) {
      this.ensureSpace(rowH + 4)
      this.page.drawRectangle({
        x: MARGIN,
        y: this.y - rowH + 6,
        width: CONTENT_W,
        height: rowH,
        color: rgb(1, 1, 1),
        borderColor: LINE,
        borderWidth: 0.5,
      })
      this.page.drawText(label, {
        x: MARGIN + 10,
        y: this.y - 10,
        size: 9,
        font: this.fonts.bold,
        color: INK,
      })
      for (let i = 0; i < wrapText(value, 48).length; i++) {
        const lines = wrapText(value, 48)
        this.page.drawText(lines[i]!, {
          x: MARGIN + col1,
          y: this.y - 10 - i * 11,
          size: 9,
          font: this.fonts.regular,
          color: MUTED,
        })
      }
      this.y -= rowH + 2
    }
  }

  drawTimeline() {
    this.addPage()
    this.sectionTitle(IPO_GUIDE_SECTIONS.timeline.title)
    this.y -= 6
    for (const event of IPO_GUIDE_SECTIONS.timeline.events) {
      this.ensureSpace(70)
      this.page.drawRectangle({
        x: MARGIN,
        y: this.y - 52,
        width: 4,
        height: 52,
        color: GOLD,
      })
      this.page.drawText(event.date, {
        x: MARGIN + 14,
        y: this.y,
        size: 8.5,
        font: this.fonts.bold,
        color: GREEN,
      })
      this.page.drawText(event.label, {
        x: MARGIN + 14,
        y: this.y - 14,
        size: 11,
        font: this.fonts.bold,
        color: INK,
      })
      let ly = this.y - 28
      for (const line of wrapText(event.detail, charWidth(9.5) - 6)) {
        this.page.drawText(line, {
          x: MARGIN + 14,
          y: ly,
          size: 9.5,
          font: this.fonts.regular,
          color: MUTED,
        })
        ly -= 12
      }
      this.y -= 62
    }
  }

  drawProcedure() {
    this.addPage()
    this.sectionTitle(IPO_GUIDE_SECTIONS.procedure.title)
    for (const step of IPO_GUIDE_SECTIONS.procedure.steps) {
      this.ensureSpace(50)
      this.page.drawText(step.step.toUpperCase(), {
        x: MARGIN,
        y: this.y,
        size: 8,
        font: this.fonts.bold,
        color: GOLD,
      })
      this.page.drawText(step.title, {
        x: MARGIN,
        y: this.y - 14,
        size: 12,
        font: this.fonts.bold,
        color: INK,
      })
      this.y -= 32
      for (const task of step.tasks) {
        this.bullet(task)
      }
      this.y -= 8
    }
  }

  drawDossier() {
    this.addPage()
    this.sectionTitle(IPO_GUIDE_SECTIONS.dossier.title)
    this.paragraph(IPO_GUIDE_SECTIONS.dossier.intro)
    this.y -= 4
    for (const item of IPO_GUIDE_SECTIONS.dossier.checklist) {
      this.checkbox(item)
    }
    this.y -= 8
    this.page.drawRectangle({
      x: MARGIN,
      y: this.y - 44,
      width: CONTENT_W,
      height: 52,
      color: rgb(1, 1, 1),
      borderColor: GOLD,
      borderWidth: 0.6,
    })
    let ny = this.y - 14
    for (const line of wrapText(IPO_GUIDE_SECTIONS.dossier.note, charWidth(8.5))) {
      this.page.drawText(line, {
        x: MARGIN + 12,
        y: ny,
        size: 8.5,
        font: this.fonts.regular,
        color: MUTED,
      })
      ny -= 11
    }
    this.y -= 60
  }

  drawAfter() {
    this.addPage()
    this.sectionTitle(IPO_GUIDE_SECTIONS.after.title)
    for (const p of IPO_GUIDE_SECTIONS.after.paragraphs) {
      this.paragraph(p)
    }
    this.y -= 6
    this.page.drawText('Canaux de contact', {
      x: MARGIN,
      y: this.y,
      size: 11,
      font: this.fonts.bold,
      color: INK,
    })
    this.y -= 18
    for (const [label, value] of IPO_GUIDE_SECTIONS.after.channels) {
      this.ensureSpace(16)
      this.page.drawText(`${label} :`, {
        x: MARGIN,
        y: this.y,
        size: 9,
        font: this.fonts.bold,
        color: INK,
      })
      this.page.drawText(value, {
        x: MARGIN + 130,
        y: this.y,
        size: 9,
        font: this.fonts.regular,
        color: MUTED,
      })
      this.y -= 16
    }
  }

  drawFaq() {
    this.addPage()
    this.sectionTitle(IPO_GUIDE_SECTIONS.faq.title)
    for (const item of IPO_GUIDE_SECTIONS.faq.items) {
      this.ensureSpace(40)
      this.page.drawText('Q', {
        x: MARGIN,
        y: this.y,
        size: 10,
        font: this.fonts.bold,
        color: GOLD,
      })
      for (const line of wrapText(item.q, charWidth(10) - 4)) {
        this.page.drawText(line, {
          x: MARGIN + 16,
          y: this.y,
          size: 10,
          font: this.fonts.bold,
          color: INK,
        })
        this.y -= 13
      }
      this.y -= 2
      this.page.drawText('R', {
        x: MARGIN,
        y: this.y,
        size: 9,
        font: this.fonts.bold,
        color: MUTED,
      })
      for (const line of wrapText(item.a, charWidth(9.5) - 4)) {
        this.page.drawText(line, {
          x: MARGIN + 16,
          y: this.y,
          size: 9.5,
          font: this.fonts.regular,
          color: MUTED,
        })
        this.y -= 12
      }
      this.y -= 10
    }
  }

  drawContact() {
    this.addPage()
    this.sectionTitle(IPO_GUIDE_SECTIONS.contact.title)
    for (const line of IPO_GUIDE_SECTIONS.contact.lines) {
      this.ensureSpace(16)
      this.page.drawText(line, {
        x: MARGIN,
        y: this.y,
        size: 10,
        font: this.fonts.regular,
        color: INK,
      })
      this.y -= 16
    }
    this.y -= 16
    this.page.drawRectangle({
      x: MARGIN,
      y: this.y - 72,
      width: CONTENT_W,
      height: 80,
      color: rgb(1, 1, 1),
      borderColor: LINE,
      borderWidth: 0.5,
    })
    let ly = this.y - 14
    for (const line of wrapText(IPO_GUIDE_SECTIONS.contact.legal, charWidth(8.5))) {
      this.page.drawText(line, {
        x: MARGIN + 12,
        y: ly,
        size: 8.5,
        font: this.fonts.regular,
        color: MUTED,
      })
      ly -= 11
    }
  }

  drawObjectSection() {
    this.addPage()
    this.sectionTitle(IPO_GUIDE_SECTIONS.object.title)
    for (const p of IPO_GUIDE_SECTIONS.object.paragraphs) {
      this.paragraph(p)
    }
  }
}

function charWidth(size: number): number {
  return Math.floor(CONTENT_W / (size * 0.48))
}

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/)
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    const next = current ? `${current} ${word}` : word
    if (next.length > maxChars) {
      if (current) lines.push(current)
      current = word
    } else {
      current = next
    }
  }
  if (current) lines.push(current)
  return lines
}

async function main() {
  const doc = await PDFDocument.create()
  const fonts: Fonts = {
    regular: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
  }

  const pdf = new GuidePdf(doc, fonts)
  pdf.drawCover()
  pdf.drawToc()
  pdf.drawObjectSection()
  pdf.drawOfferTable()
  pdf.drawTimeline()
  pdf.drawProcedure()
  pdf.drawDossier()
  pdf.drawAfter()
  pdf.drawFaq()
  pdf.drawContact()

  await mkdir(dirname(OUT), { recursive: true })
  const bytes = await doc.save()
  await Bun.write(OUT, bytes)
  console.log(`[ipo-guide] Wrote ${OUT} (${pdf.pageNum} pages)`)
}

await main()
