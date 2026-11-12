import { normalizeResumeContent, sanitizeFilename } from "@/lib/resume/defaults"
import type { ResumeContent, ResumeTemplateId } from "@/types/database"

type PdfFontKey = "F1" | "F2" | "F3" | "F4" | "F5" | "F6"

const PAGE_WIDTH = 612
const PAGE_HEIGHT = 792
const MARGIN_X = 46
const TOP_Y = 746
const BOTTOM_Y = 48
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2

function sanitizeWinAnsi(raw: string): string {
  return raw
    .replace(/\r\n/g, "\n")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2013/g, "-")
    .replace(/\u2014/g, "--")
    .replace(/\u2022/g, "*")
    .replace(/\u2026/g, "...")
    .replace(/[^\x20-\x7E\n]/g, "")
}

function escapePdfLiteral(text: string): string {
  return sanitizeWinAnsi(text)
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
}

function approximateCharWidth(ch: string, isBold: boolean, isSerif: boolean): number {
  const narrow = "iIl1!|.,:;'` "
  const wide = "mwMW@#%&"
  const upperNarrow = "IJT"
  let factor = isSerif ? 0.49 : 0.51
  if (narrow.includes(ch)) factor = 0.27
  else if (upperNarrow.includes(ch)) factor = 0.36
  else if (wide.includes(ch)) factor = 0.78
  else if (ch >= "A" && ch <= "Z") factor = isSerif ? 0.62 : 0.65
  if (isBold) factor *= 1.05
  return factor
}

function measureTextWidth(
  text: string,
  fontSize: number,
  font: PdfFontKey
): number {
  const clean = sanitizeWinAnsi(text)
  const isBold = font === "F2" || font === "F5"
  const isSerif = font === "F4" || font === "F5" || font === "F6"
  let units = 0
  for (let i = 0; i < clean.length; i += 1) {
    units += approximateCharWidth(clean[i], isBold, isSerif)
  }
  return units * fontSize
}

function wrapText(
  text: string,
  maxWidth: number,
  fontSize: number,
  font: PdfFontKey
): string[] {
  const clean = sanitizeWinAnsi(text).trim()
  if (!clean) return []

  const paragraphs = clean.split("\n")
  const lines: string[] = []

  for (const para of paragraphs) {
    const trimmed = para.trim()
    if (!trimmed) continue
    const words = trimmed.split(/\s+/)
    let current = ""

    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word
      if (measureTextWidth(candidate, fontSize, font) <= maxWidth) {
        current = candidate
      } else {
        if (current) lines.push(current)
        if (measureTextWidth(word, fontSize, font) <= maxWidth) {
          current = word
        } else {
          // Break unusually long URLs/tokens safely
          let slice = ""
          for (const ch of word) {
            if (measureTextWidth(slice + ch, fontSize, font) > maxWidth && slice) {
              lines.push(slice)
              slice = ch
            } else {
              slice += ch
            }
          }
          current = slice
        }
      }
    }
    if (current) lines.push(current)
  }

  return lines
}

function formatDateRange(
  startDate: string,
  endDate: string,
  currentlyWorking?: boolean
): string {
  const start = startDate.trim()
  const end = currentlyWorking ? "Present" : endDate.trim()
  if (!start && !end) return ""
  if (start && end) return `${start} - ${end}`
  return start || end
}

interface PdfPageBuilder {
  commands: string[]
  y: number
}

class AtsPdfLayoutEngine {
  private pages: PdfPageBuilder[] = []
  private currentPage: PdfPageBuilder
  private template: ResumeTemplateId
  private bodyFont: PdfFontKey
  private boldFont: PdfFontKey
  private italicFont: PdfFontKey
  private accentRgb: [number, number, number]

  constructor(template: ResumeTemplateId) {
    this.template = template
    const isSerif = template === "classic-professional"
    this.bodyFont = isSerif ? "F4" : "F1"
    this.boldFont = isSerif ? "F5" : "F2"
    this.italicFont = isSerif ? "F6" : "F3"
    this.accentRgb =
      template === "modern-professional"
        ? [0.12, 0.24, 0.44]
        : [0.08, 0.08, 0.08]

    this.currentPage = { commands: [], y: TOP_Y }
    this.pages.push(this.currentPage)
  }

  private newPage() {
    this.currentPage = { commands: [], y: TOP_Y }
    this.pages.push(this.currentPage)
  }

  private ensureSpace(neededHeight: number) {
    if (this.currentPage.y - neededHeight < BOTTOM_Y) {
      this.newPage()
    }
  }

  private drawText(
    text: string,
    x: number,
    y: number,
    font: PdfFontKey,
    fontSize: number,
    rgb: [number, number, number] = [0.09, 0.09, 0.1]
  ) {
    const escaped = escapePdfLiteral(text)
    if (!escaped) return
    this.currentPage.commands.push(
      `BT /${font} ${fontSize} Tf ${rgb[0].toFixed(3)} ${rgb[1].toFixed(3)} ${rgb[2].toFixed(3)} rg 1 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)} Tm (${escaped}) Tj ET`
    )
  }

  private drawLine(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    width = 0.75,
    rgb: [number, number, number] = [0.75, 0.75, 0.78]
  ) {
    this.currentPage.commands.push(
      `q ${width.toFixed(2)} w ${rgb[0].toFixed(3)} ${rgb[1].toFixed(3)} ${rgb[2].toFixed(3)} RG ${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S Q`
    )
  }

  private drawRect(
    x: number,
    y: number,
    w: number,
    h: number,
    rgb: [number, number, number]
  ) {
    this.currentPage.commands.push(
      `q ${rgb[0].toFixed(3)} ${rgb[1].toFixed(3)} ${rgb[2].toFixed(3)} rg ${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re f Q`
    )
  }

  renderHeader(content: ResumeContent) {
    const p = content.personalInfo
    const name = p.fullName.trim() || "Untitled Resume"
    const centered = this.template === "classic-professional"

    if (this.template === "modern-professional") {
      this.drawRect(MARGIN_X, this.currentPage.y + 18, CONTENT_WIDTH, 3, this.accentRgb)
    }

    const nameSize = this.template === "classic-professional" ? 20 : 19
    const nameWidth = measureTextWidth(name, nameSize, this.boldFont)
    const nameX = centered
      ? Math.max(MARGIN_X, (PAGE_WIDTH - nameWidth) / 2)
      : MARGIN_X

    this.drawText(
      name,
      nameX,
      this.currentPage.y,
      this.boldFont,
      nameSize,
      this.template === "modern-professional" ? this.accentRgb : [0.06, 0.06, 0.07]
    )
    this.currentPage.y -= 17

    if (p.headline.trim()) {
      const headlineSize = 11
      const headlineLines = wrapText(
        p.headline,
        CONTENT_WIDTH,
        headlineSize,
        this.italicFont
      )
      for (const line of headlineLines) {
        const lineW = measureTextWidth(line, headlineSize, this.italicFont)
        const lineX = centered
          ? Math.max(MARGIN_X, (PAGE_WIDTH - lineW) / 2)
          : MARGIN_X
        this.drawText(
          line,
          lineX,
          this.currentPage.y,
          this.italicFont,
          headlineSize,
          [0.28, 0.31, 0.36]
        )
        this.currentPage.y -= 14
      }
    }

    const contactParts = [
      p.email.trim(),
      p.phone.trim(),
      p.location.trim(),
      p.linkedinUrl.trim(),
      p.githubUrl.trim(),
      p.portfolioUrl.trim(),
    ].filter(Boolean)

    if (contactParts.length > 0) {
      const contactLine = contactParts.join("  |  ")
      const contactLines = wrapText(contactLine, CONTENT_WIDTH, 9.2, this.bodyFont)
      for (const line of contactLines) {
        const lineW = measureTextWidth(line, 9.2, this.bodyFont)
        const lineX = centered
          ? Math.max(MARGIN_X, (PAGE_WIDTH - lineW) / 2)
          : MARGIN_X
        this.drawText(
          line,
          lineX,
          this.currentPage.y,
          this.bodyFont,
          9.2,
          [0.24, 0.24, 0.28]
        )
        this.currentPage.y -= 12.5
      }
    }

    this.currentPage.y -= 4
    this.drawLine(
      MARGIN_X,
      this.currentPage.y,
      PAGE_WIDTH - MARGIN_X,
      this.currentPage.y,
      this.template === "modern-professional" ? 1.1 : 0.7,
      this.template === "modern-professional" ? this.accentRgb : [0.55, 0.55, 0.58]
    )
    this.currentPage.y -= 15
  }

  renderSectionTitle(title: string) {
    this.ensureSpace(44)
    const label = title.toUpperCase()
    this.drawText(
      label,
      MARGIN_X,
      this.currentPage.y,
      this.boldFont,
      10.5,
      this.template === "modern-professional" ? this.accentRgb : [0.06, 0.06, 0.07]
    )
    this.currentPage.y -= 5
    this.drawLine(
      MARGIN_X,
      this.currentPage.y,
      PAGE_WIDTH - MARGIN_X,
      this.currentPage.y,
      0.65,
      this.template === "modern-professional" ? [0.78, 0.82, 0.88] : [0.7, 0.7, 0.72]
    )
    this.currentPage.y -= 13
  }

  renderParagraph(text: string, fontSize = 9.8, indent = 0) {
    const lines = wrapText(text, CONTENT_WIDTH - indent, fontSize, this.bodyFont)
    for (const line of lines) {
      this.ensureSpace(14)
      this.drawText(
        line,
        MARGIN_X + indent,
        this.currentPage.y,
        this.bodyFont,
        fontSize,
        [0.14, 0.14, 0.16]
      )
      this.currentPage.y -= 13.5
    }
  }

  renderBullets(description: string) {
    const rawLines = sanitizeWinAnsi(description)
      .split("\n")
      .map((line) => line.trim().replace(/^[-*•]\s*/, ""))
      .filter(Boolean)

    for (const item of rawLines) {
      const wrapped = wrapText(item, CONTENT_WIDTH - 14, 9.6, this.bodyFont)
      wrapped.forEach((line, idx) => {
        this.ensureSpace(14)
        if (idx === 0) {
          this.drawText(
            "-",
            MARGIN_X + 3,
            this.currentPage.y,
            this.boldFont,
            9.6,
            [0.2, 0.2, 0.22]
          )
        }
        this.drawText(
          line,
          MARGIN_X + 13,
          this.currentPage.y,
          this.bodyFont,
          9.6,
          [0.14, 0.14, 0.16]
        )
        this.currentPage.y -= 13
      })
    }
  }

  renderEntryHeader(leftPrimary: string, leftSecondary: string, rightText: string) {
    this.ensureSpace(30)
    const rightWidth = rightText
      ? measureTextWidth(rightText, 9.3, this.bodyFont)
      : 0
    const leftMaxWidth = rightText
      ? Math.max(180, CONTENT_WIDTH - rightWidth - 16)
      : CONTENT_WIDTH

    const primaryLines = wrapText(leftPrimary, leftMaxWidth, 10.3, this.boldFont)
    if (primaryLines.length > 0) {
      this.drawText(
        primaryLines[0],
        MARGIN_X,
        this.currentPage.y,
        this.boldFont,
        10.3,
        [0.06, 0.06, 0.08]
      )
      if (rightText) {
        this.drawText(
          rightText,
          PAGE_WIDTH - MARGIN_X - rightWidth,
          this.currentPage.y,
          this.bodyFont,
          9.3,
          [0.32, 0.34, 0.38]
        )
      }
      this.currentPage.y -= 13
      for (let i = 1; i < primaryLines.length; i += 1) {
        this.ensureSpace(14)
        this.drawText(
          primaryLines[i],
          MARGIN_X,
          this.currentPage.y,
          this.boldFont,
          10.3,
          [0.06, 0.06, 0.08]
        )
        this.currentPage.y -= 13
      }
    }

    if (leftSecondary.trim()) {
      const secLines = wrapText(leftSecondary, CONTENT_WIDTH, 9.5, this.italicFont)
      for (const line of secLines) {
        this.ensureSpace(13)
        this.drawText(
          line,
          MARGIN_X,
          this.currentPage.y,
          this.italicFont,
          9.5,
          [0.28, 0.3, 0.34]
        )
        this.currentPage.y -= 12.5
      }
    }
  }

  addGap(points: number) {
    this.currentPage.y -= points
  }

  buildBytes(): Uint8Array {
    const encoder = new TextEncoder()
    const objects: string[] = []

    const addObject = (body: string): number => {
      objects.push(body)
      return objects.length
    }

    const f1Id = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>")
    const f2Id = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>")
    const f3Id = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique /Encoding /WinAnsiEncoding >>")
    const f4Id = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Times-Roman /Encoding /WinAnsiEncoding >>")
    const f5Id = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Times-Bold /Encoding /WinAnsiEncoding >>")
    const f6Id = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Times-Italic /Encoding /WinAnsiEncoding >>")

    const fontResource = `<< /F1 ${f1Id} 0 R /F2 ${f2Id} 0 R /F3 ${f3Id} 0 R /F4 ${f4Id} 0 R /F5 ${f5Id} 0 R /F6 ${f6Id} 0 R >>`

    const pagesObjId = objects.length + 1 + this.pages.length * 2
    const pageIds: number[] = []

    for (const page of this.pages) {
      const streamText = page.commands.join("\n")
      const streamByteLength = encoder.encode(streamText).length
      const contentObjId = addObject(
        `<< /Length ${streamByteLength} >>\nstream\n${streamText}\nendstream`
      )
      const pageObjId = addObject(
        `<< /Type /Page /Parent ${pagesObjId} 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font ${fontResource} >> /Contents ${contentObjId} 0 R >>`
      )
      pageIds.push(pageObjId)
    }

    const actualPagesId = addObject(
      `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`
    )
    const catalogId = addObject(`<< /Type /Catalog /Pages ${actualPagesId} 0 R >>`)

    const chunks: Uint8Array[] = []
    const offsets: number[] = [0]
    let cursor = 0

    const pushString = (str: string) => {
      const bytes = encoder.encode(str)
      chunks.push(bytes)
      cursor += bytes.length
    }

    pushString("%PDF-1.4\n")

    objects.forEach((body, idx) => {
      offsets.push(cursor)
      pushString(`${idx + 1} 0 obj\n${body}\nendobj\n`)
    })

    const xrefOffset = cursor
    pushString(`xref\n0 ${objects.length + 1}\n`)
    pushString("0000000000 65535 f \n")
    for (let i = 1; i < offsets.length; i += 1) {
      pushString(`${String(offsets[i]).padStart(10, "0")} 00000 n \n`)
    }
    pushString(
      `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`
    )

    const output = new Uint8Array(cursor)
    let pos = 0
    for (const chunk of chunks) {
      output.set(chunk, pos)
      pos += chunk.length
    }
    return output
  }
}

export function generateResumePdfBytes(
  rawContent: ResumeContent,
  template: ResumeTemplateId
): Uint8Array {
  const content = normalizeResumeContent(rawContent)
  const engine = new AtsPdfLayoutEngine(template)

  engine.renderHeader(content)

  for (const sectionKey of content.sectionOrder) {
    if (sectionKey === "summary") {
      if (!content.personalInfo.summary.trim()) continue
      engine.renderSectionTitle("Professional Summary")
      engine.renderParagraph(content.personalInfo.summary)
      engine.addGap(8)
    } else if (sectionKey === "experience") {
      if (content.experience.length === 0) continue
      engine.renderSectionTitle("Work Experience")
      for (const item of content.experience) {
        const leftPrimary = [item.jobTitle, item.company]
          .filter(Boolean)
          .join(" - ")
        const leftSecondary = [item.employmentType, item.location]
          .filter(Boolean)
          .join(" | ")
        const rightText = formatDateRange(
          item.startDate,
          item.endDate,
          item.currentlyWorking
        )
        engine.renderEntryHeader(leftPrimary, leftSecondary, rightText)
        if (item.description.trim()) {
          engine.renderBullets(item.description)
        }
        engine.addGap(6)
      }
      engine.addGap(4)
    } else if (sectionKey === "education") {
      if (content.education.length === 0) continue
      engine.renderSectionTitle("Education")
      for (const item of content.education) {
        const degreeLine = [
          item.degree,
          item.fieldOfStudy ? `in ${item.fieldOfStudy}` : "",
        ]
          .filter(Boolean)
          .join(" ")
        const leftSecondary = [
          item.institution,
          item.grade ? `GPA/Grade: ${item.grade}` : "",
        ]
          .filter(Boolean)
          .join(" | ")
        const rightText = formatDateRange(item.startDate, item.endDate)
        engine.renderEntryHeader(
          degreeLine || item.institution,
          leftSecondary,
          rightText
        )
        if (item.description.trim()) {
          engine.renderBullets(item.description)
        }
        engine.addGap(6)
      }
      engine.addGap(4)
    } else if (sectionKey === "skills") {
      if (content.skills.length === 0) continue
      engine.renderSectionTitle("Skills")
      const grouped = content.skills
        .map((skill) =>
          skill.proficiency
            ? `${skill.skillName} (${skill.proficiency})`
            : skill.skillName
        )
        .filter(Boolean)
        .join(", ")
      engine.renderParagraph(grouped)
      engine.addGap(8)
    } else if (sectionKey === "projects") {
      if (content.projects.length === 0) continue
      engine.renderSectionTitle("Projects")
      for (const item of content.projects) {
        const links = [item.projectUrl, item.githubUrl]
          .filter(Boolean)
          .join(" | ")
        const tech =
          item.technologies.length > 0
            ? `Technologies: ${item.technologies.join(", ")}`
            : ""
        const leftSecondary = [tech, links].filter(Boolean).join("  |  ")
        const rightText = formatDateRange(item.startDate, item.endDate)
        engine.renderEntryHeader(item.projectName, leftSecondary, rightText)
        if (item.description.trim()) {
          engine.renderBullets(item.description)
        }
        engine.addGap(6)
      }
      engine.addGap(4)
    }
  }

  return engine.buildBytes()
}

export function downloadResumePdf({
  content,
  template,
  title,
}: {
  content: ResumeContent
  template: ResumeTemplateId
  title: string
}): void {
  const bytes = generateResumePdfBytes(content, template)
  const copy = new Uint8Array(bytes.byteLength)
  copy.set(bytes)
  const blob = new Blob([copy.buffer], { type: "application/pdf" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `${sanitizeFilename(title)}.pdf`
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

