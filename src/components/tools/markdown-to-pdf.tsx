'use client'

import * as React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { FileText, Download, Eye, Printer, Sparkles, Trash2 } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ToolCardWrapper,
  FieldLabel,
  EmptyState,
} from '@/components/tool-page-shell'
import { toast } from 'sonner'

/* ------------------------------------------------------------------ */
/*  Sample markdown for first load                                      */
/* ------------------------------------------------------------------ */
const SAMPLE = `# My Document Title

A clean, print-ready document generated from Markdown.

## Introduction

This PDF was generated entirely in your browser. Type your **Markdown** on the left, click *Download PDF*, and you get a beautifully formatted document — no signup, no upload, no watermark.

> "The best documentation is written in Markdown." — every developer, eventually

## Features

- Headings (H1–H6) with proper hierarchy
- **Bold**, *italic*, ~~strikethrough~~, and \`inline code\`
- Ordered and unordered lists
- [Hyperlinks](https://example.com) rendered in brand color
- Block quotes with a left accent bar
- Tables with borders and zebra striping
- Fenced code blocks with monospace font
- Horizontal rules to separate sections

## Numbered Steps

1. Write your Markdown in the editor
2. Preview the rendered output
3. Choose page size and margins
4. Click **Download PDF**

## Code Example

\`\`\`javascript
function greet(name) {
  console.log(\`Hello, \${name}!\`)
  return true
}
\`\`\`

## Table Example

| Tool          | Category   | Client-side |
| ------------- | ---------- | ----------- |
| JSON Formatter | Developer  | ✅          |
| Word Counter   | Text       | ✅          |
| QR Generator   | Misc       | ✅          |
| AI Writer      | AI         | ❌          |

---

Made with Markdown → PDF by ToolNest.
`

/* ------------------------------------------------------------------ */
/*  Print CSS — controls how the PDF looks on paper                    */
/* ------------------------------------------------------------------ */
function buildPrintCss(opts: {
  pageSize: 'A4' | 'Letter'
  margin: number
  fontFamily: string
  fontSize: number
  lineHeight: number
}): string {
  const { pageSize, margin, fontFamily, fontSize, lineHeight } = opts
  const marginMm = `${margin}mm`

  return `
@page {
  size: ${pageSize};
  margin: ${marginMm};
}

* { box-sizing: border-box; }

html, body {
  margin: 0;
  padding: 0;
  font-family: ${fontFamily};
  font-size: ${fontSize}pt;
  line-height: ${lineHeight};
  color: #1a2b23;
  background: #ffffff;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

/* Headings */
h1, h2, h3, h4, h5, h6 {
  font-weight: 700;
  line-height: 1.25;
  margin-top: 1.6em;
  margin-bottom: 0.6em;
  color: #0f1f17;
  page-break-after: avoid;
  break-after: avoid;
}
h1 {
  font-size: 2em;
  margin-top: 0;
  padding-bottom: 0.3em;
  border-bottom: 2px solid #10b981;
  color: #0f1f17;
}
h2 {
  font-size: 1.5em;
  padding-bottom: 0.2em;
  border-bottom: 1px solid #e5e7eb;
}
h3 { font-size: 1.25em; }
h4 { font-size: 1.1em; }
h5 { font-size: 1em; }
h6 { font-size: 0.9em; color: #6b7280; }

/* Paragraphs */
p {
  margin: 0 0 0.85em 0;
  orphans: 3;
  widows: 3;
}

/* Links */
a {
  color: #0d9488;
  text-decoration: none;
  border-bottom: 1px solid transparent;
  word-break: break-word;
}
a:hover { border-bottom-color: #0d9488; }

/* Lists */
ul, ol {
  margin: 0 0 0.85em 0;
  padding-left: 1.6em;
}
li { margin: 0.2em 0; }
li > ul, li > ol { margin: 0.2em 0; }

/* Task lists (GFM) */
ul.contains-task-list { list-style: none; padding-left: 1.2em; }
li.task-list-item { list-style: none; }

/* Blockquote */
blockquote {
  margin: 0 0 0.85em 0;
  padding: 0.6em 1em;
  border-left: 4px solid #10b981;
  background: #f0fdf4;
  color: #14532d;
  border-radius: 0 4px 4px 0;
}
blockquote p:last-child { margin-bottom: 0; }

/* Inline code */
code {
  font-family: 'SF Mono', 'Fira Code', 'JetBrains Mono', 'Menlo', 'Consolas', monospace;
  font-size: 0.875em;
  background: #f3f4f6;
  color: #be123c;
  padding: 0.15em 0.35em;
  border-radius: 4px;
}

/* Fenced code blocks */
pre {
  margin: 0 0 0.85em 0;
  padding: 0.9em 1em;
  background: #0f172a;
  color: #e2e8f0;
  border-radius: 6px;
  overflow-x: auto;
  page-break-inside: avoid;
  break-inside: avoid;
  font-size: 0.82em;
  line-height: 1.5;
}
pre code {
  background: transparent;
  color: inherit;
  padding: 0;
  border-radius: 0;
  font-size: inherit;
}

/* Tables */
table {
  width: 100%;
  border-collapse: collapse;
  margin: 0 0 1em 0;
  font-size: 0.92em;
  page-break-inside: avoid;
  break-inside: avoid;
}
th, td {
  border: 1px solid #d1d5db;
  padding: 0.5em 0.75em;
  text-align: left;
  vertical-align: top;
}
th {
  background: #f9fafb;
  font-weight: 700;
  color: #111827;
}
tbody tr:nth-child(even) { background: #f9fafb; }

/* Horizontal rule */
hr {
  border: none;
  border-top: 1px solid #d1d5db;
  margin: 1.6em 0;
  page-break-after: avoid;
}

/* Images */
img {
  max-width: 100%;
  height: auto;
  page-break-inside: avoid;
}

/* Avoid breaking inside these elements */
table, pre, blockquote, img {
  page-break-inside: avoid;
}

/* Strong / em / strikethrough */
strong { font-weight: 700; }
em { font-style: italic; }
del { text-decoration: line-through; color: #6b7280; }
`
}

/* ------------------------------------------------------------------ */
/*  Full HTML document wrapper                                         */
/* ------------------------------------------------------------------ */
function buildHtmlDocument(bodyHtml: string, css: string, title: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>${css}</style>
</head>
<body>
${bodyHtml}
</body>
</html>`
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/* ------------------------------------------------------------------ */
/*  Inline CSS for the on-page preview (mirrors the print styles)      */
/* ------------------------------------------------------------------ */
const previewInlineCss = `
.md-preview {
  font-family: 'Georgia', 'Times New Roman', serif;
  font-size: 11pt;
  line-height: 1.6;
  color: #1a2b23;
}
.md-preview h1, .md-preview h2, .md-preview h3, .md-preview h4, .md-preview h5, .md-preview h6 { font-weight: 700; line-height: 1.25; margin: 1.4em 0 0.5em; color: #0f1f17; }
.md-preview h1 { font-size: 1.9em; margin-top: 0; padding-bottom: 0.3em; border-bottom: 2px solid var(--primary); }
.md-preview h2 { font-size: 1.45em; padding-bottom: 0.2em; border-bottom: 1px solid var(--border); }
.md-preview h3 { font-size: 1.2em; }
.md-preview h4 { font-size: 1.05em; }
.md-preview p { margin: 0 0 0.8em; }
.md-preview a { color: #0d9488; text-decoration: none; }
.md-preview ul, .md-preview ol { margin: 0 0 0.8em; padding-left: 1.6em; }
.md-preview li { margin: 0.2em 0; }
.md-preview blockquote { margin: 0 0 0.8em; padding: 0.6em 1em; border-left: 4px solid var(--primary); background: color-mix(in oklch, var(--primary) 8%, transparent); color: #14532d; border-radius: 0 4px 4px 0; }
.md-preview blockquote p:last-child { margin-bottom: 0; }
.md-preview code { font-family: var(--font-mono); font-size: 0.875em; background: var(--muted); color: #be123c; padding: 0.15em 0.35em; border-radius: 4px; }
.md-preview pre { margin: 0 0 0.8em; padding: 0.9em 1em; background: #0f172a; color: #e2e8f0; border-radius: 6px; overflow-x: auto; font-size: 0.82em; line-height: 1.5; }
.md-preview pre code { background: transparent; color: inherit; padding: 0; }
.md-preview table { width: 100%; border-collapse: collapse; margin: 0 0 1em; font-size: 0.92em; }
.md-preview th, .md-preview td { border: 1px solid var(--border); padding: 0.5em 0.75em; text-align: left; }
.md-preview th { background: var(--muted); font-weight: 700; }
.md-preview tbody tr:nth-child(even) { background: color-mix(in oklch, var(--muted) 50%, transparent); }
.md-preview hr { border: none; border-top: 1px solid var(--border); margin: 1.4em 0; }
.md-preview img { max-width: 100%; height: auto; }
.md-preview strong { font-weight: 700; }
.md-preview em { font-style: italic; }
.md-preview del { text-decoration: line-through; color: var(--muted-foreground); }
`

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */
type FontFamily = 'Georgia, serif' | 'Helvetica, Arial, sans-serif' | "'Times New Roman', Times, serif" | 'Courier, monospace'
const FONT_OPTIONS: { value: FontFamily; label: string }[] = [
  { value: 'Georgia, serif', label: 'Georgia (serif)' },
  { value: 'Helvetica, Arial, sans-serif', label: 'Helvetica (sans-serif)' },
  { value: "'Times New Roman', Times, serif", label: 'Times New Roman (serif)' },
  { value: 'Courier, monospace', label: 'Courier (monospace)' },
]

export default function MarkdownToPdf() {
  const [markdown, setMarkdown] = React.useState(SAMPLE)
  const [pageSize, setPageSize] = React.useState<'A4' | 'Letter'>('A4')
  const [margin, setMargin] = React.useState(20)
  const [fontFamily, setFontFamily] = React.useState<FontFamily>('Georgia, serif')
  const [fontSize, setFontSize] = React.useState(11)
  const [lineHeight, setLineHeight] = React.useState(1.6)
  const [activeTab, setActiveTab] = React.useState<'write' | 'preview'>('write')
  // Hidden ref that always renders the markdown so we can grab its HTML for PDF/HTML export.
  // (renderToStaticMarkup from react-dom/server doesn't work in client components.)
  const hiddenRenderRef = React.useRef<HTMLDivElement>(null)

  function getRenderedHtml(): string {
    return hiddenRenderRef.current?.innerHTML ?? ''
  }

  // Download as PDF using a hidden iframe + browser print dialog
  // This produces the highest-quality PDF because it uses the browser's
  // native print engine (Chrome's PDF renderer is excellent).
  function downloadPdf() {
    if (!markdown.trim()) {
      toast.error('Please enter some markdown first')
      return
    }

    const css = buildPrintCss({ pageSize, margin, fontFamily, fontSize, lineHeight })
    const title = extractTitle(markdown) || 'Document'
    const bodyHtml = getRenderedHtml()
    if (!bodyHtml.trim()) {
      toast.error('Nothing to export yet')
      return
    }
    const fullHtml = buildHtmlDocument(bodyHtml, css, title)

    // Create a hidden iframe so we don't disturb the current page
    const iframe = document.createElement('iframe')
    iframe.style.position = 'fixed'
    iframe.style.right = '0'
    iframe.style.bottom = '0'
    iframe.style.width = '0'
    iframe.style.height = '0'
    iframe.style.border = '0'
    iframe.setAttribute('aria-hidden', 'true')
    iframe.setAttribute('title', 'PDF print frame')

    document.body.appendChild(iframe)

    const doc = iframe.contentWindow?.document
    if (!doc) {
      toast.error('Could not create print frame')
      document.body.removeChild(iframe)
      return
    }

    doc.open()
    doc.write(fullHtml)
    doc.close()

    // Wait for the iframe content to render, then trigger print
    const contentWindow = iframe.contentWindow
    if (!contentWindow) {
      toast.error('Print frame not ready')
      document.body.removeChild(iframe)
      return
    }

    const triggerPrint = () => {
      try {
        contentWindow.focus()
        contentWindow.print()
        toast.success('Print dialog opened — choose "Save as PDF"')
      } catch {
        toast.error('Failed to open print dialog')
      }
      // Clean up the iframe after a delay (give the dialog time)
      setTimeout(() => {
        if (iframe.parentNode) iframe.parentNode.removeChild(iframe)
      }, 1500)
    }

    // Give the iframe a moment to layout before printing
    setTimeout(triggerPrint, 400)
  }

  function downloadHtml() {
    if (!markdown.trim()) {
      toast.error('Please enter some markdown first')
      return
    }
    const css = buildPrintCss({ pageSize, margin, fontFamily, fontSize, lineHeight })
    const title = extractTitle(markdown) || 'Document'
    const bodyHtml = getRenderedHtml()
    if (!bodyHtml.trim()) {
      toast.error('Nothing to export yet')
      return
    }
    const fullHtml = buildHtmlDocument(bodyHtml, css, title)
    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${slugify(title)}.html`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    toast.success('HTML file downloaded')
  }

  function clearText() {
    setMarkdown('')
    toast.success('Editor cleared')
  }

  const wordCount = markdown.trim() ? markdown.trim().split(/\s+/).length : 0
  const charCount = markdown.length
  const headingCount = (markdown.match(/^#{1,6}\s/gm) || []).length
  const title = extractTitle(markdown) || 'Untitled Document'

  return (
    <div className="space-y-4">
      {/* Editor + Preview */}
      <ToolCardWrapper>
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <div>
              <h3 className="text-sm font-semibold">{title}</h3>
              <p className="text-xs text-muted-foreground">
                {wordCount} words · {charCount} chars · {headingCount} headings
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={clearText} className="gap-1.5 text-muted-foreground">
              <Trash2 className="h-4 w-4" />
              Clear
            </Button>
            <Button variant="outline" size="sm" onClick={downloadHtml} className="gap-1.5">
              <Download className="h-4 w-4" />
              HTML
            </Button>
            <Button size="sm" onClick={downloadPdf} className="gap-1.5">
              <Printer className="h-4 w-4" />
              Download PDF
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'write' | 'preview')}>
          <TabsList className="mb-3">
            <TabsTrigger value="write" className="gap-1.5">
              <FileText className="h-4 w-4" />
              Write
            </TabsTrigger>
            <TabsTrigger value="preview" className="gap-1.5">
              <Eye className="h-4 w-4" />
              Preview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="write">
            <Textarea
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
              placeholder="Type your Markdown here... # Heading, **bold**, *italic*, lists, tables, code blocks..."
              className="font-mono min-h-[280px] sm:min-h-[500px] text-sm leading-relaxed"
              spellCheck={false}
            />
          </TabsContent>

          <TabsContent value="preview">
            <div className="md-preview min-h-[280px] sm:min-h-[500px] rounded-md border border-border bg-white p-6 overflow-y-auto max-h-[600px] scrollbar-thin">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {markdown}
              </ReactMarkdown>
            </div>
          </TabsContent>
        </Tabs>
      </ToolCardWrapper>

      {/* PDF Settings */}
      <ToolCardWrapper>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">PDF settings</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Page size */}
          <div>
            <FieldLabel>Page size</FieldLabel>
            <Select value={pageSize} onValueChange={(v) => setPageSize(v as 'A4' | 'Letter')}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A4">A4 (210 × 297 mm)</SelectItem>
                <SelectItem value="Letter">US Letter (8.5 × 11 in)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Font family */}
          <div>
            <FieldLabel>Font family</FieldLabel>
            <Select value={fontFamily} onValueChange={(v) => setFontFamily(v as FontFamily)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FONT_OPTIONS.map((f) => (
                  <SelectItem key={f.value} value={f.value}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Margin */}
          <div>
            <FieldLabel>Page margin: {margin}mm</FieldLabel>
            <Slider
              value={[margin]}
              onValueChange={([v]) => setMargin(v)}
              min={5}
              max={40}
              step={1}
              className="mt-2"
            />
          </div>

          {/* Font size */}
          <div>
            <FieldLabel>Font size: {fontSize}pt</FieldLabel>
            <Slider
              value={[fontSize]}
              onValueChange={([v]) => setFontSize(v)}
              min={8}
              max={16}
              step={0.5}
              className="mt-2"
            />
          </div>

          {/* Line height */}
          <div className="sm:col-span-2">
            <FieldLabel>Line height: {lineHeight.toFixed(2)}</FieldLabel>
            <Slider
              value={[lineHeight * 100]}
              onValueChange={([v]) => setLineHeight(v / 100)}
              min={100}
              max={220}
              step={5}
              className="mt-2"
            />
          </div>
        </div>

        <Separator className="my-4" />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{pageSize}</Badge>
            <Badge variant="secondary">{margin}mm margins</Badge>
            <Badge variant="secondary">{fontSize}pt</Badge>
            <Badge variant="secondary">{lineHeight.toFixed(2)} line height</Badge>
          </div>
          <Button onClick={downloadPdf} className="gap-1.5">
            <Printer className="h-4 w-4" />
            Generate PDF
          </Button>
        </div>
      </ToolCardWrapper>

      {/* Tips */}
      <ToolCardWrapper>
        <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Tips for a great-looking PDF
        </h3>
        <ul className="text-sm text-muted-foreground space-y-1.5 list-disc pl-5">
          <li>Start your document with a single <code className="text-xs bg-muted px-1.5 py-0.5 rounded"># H1 heading</code> — it becomes the document title and gets an accent underline.</li>
          <li>Use <code className="text-xs bg-muted px-1.5 py-0.5 rounded">## H2</code> for major sections — they get a subtle divider line.</li>
          <li>Tables and code blocks are kept together (no awkward page breaks).</li>
          <li>In the print dialog, choose <strong>“Save as PDF”</strong> as the destination to download the file.</li>
          <li>For best print quality, enable <strong>“Background graphics”</strong> in the print dialog so blockquotes and table headers keep their colors.</li>
          <li>Use <code className="text-xs bg-muted px-1.5 py-0.5 rounded">---</code> on its own line to insert a horizontal rule between sections.</li>
        </ul>
      </ToolCardWrapper>

      {!markdown.trim() && (
        <EmptyState message="Your markdown preview will appear here. Start typing in the editor above." />
      )}

      {/* Hidden always-rendered copy of the markdown for HTML/PDF export */}
      <div
        ref={hiddenRenderRef}
        aria-hidden="true"
        style={{ position: 'absolute', left: '-9999px', top: 0, width: '800px' }}
      >
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {markdown}
        </ReactMarkdown>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
function extractTitle(md: string): string | null {
  const m = md.match(/^#\s+(.+)$/m)
  return m ? m[1].trim() : null
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'document'
}
