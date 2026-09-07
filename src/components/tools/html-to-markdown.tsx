'use client'

import * as React from 'react'
import {
  Code2,
  FileText,
  Trash2,
  Copy,
  Download,
  ArrowRight,
  Eye,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  ToolCardWrapper,
  FieldLabel,
  CopyButton,
  EmptyState,
} from '@/components/tool-page-shell'
import { toast } from 'sonner'

const SAMPLE_HTML = `<h1>Hello World</h1>
<p>This is a <strong>demo</strong> of an <em>HTML to Markdown</em> converter.</p>
<h2>Features</h2>
<ul>
  <li>Supports <a href="https://example.com">links</a></li>
  <li>Renders <code>inline code</code></li>
  <li>Handles <strong>bold</strong> and <em>italic</em></li>
</ul>
<blockquote>This is a quoted block of text.</blockquote>
<pre><code>const x = 42;
console.log(x);</code></pre>
<hr>
<p>That's it!</p>`

/** Walk a DOM tree converting nodes to Markdown. */
function convertNode(node: Node, listDepth = 0, orderedStack: boolean[] = []): string {
  // Element
  if (node.nodeType === Node.ELEMENT_NODE) {
    const el = node as Element
    const tag = el.tagName.toLowerCase()
    const inline = (children: string) => children
    switch (tag) {
      case 'h1': return `\n# ${el.textContent?.trim()}\n\n`
      case 'h2': return `\n## ${el.textContent?.trim()}\n\n`
      case 'h3': return `\n### ${el.textContent?.trim()}\n\n`
      case 'h4': return `\n#### ${el.textContent?.trim()}\n\n`
      case 'h5': return `\n##### ${el.textContent?.trim()}\n\n`
      case 'h6': return `\n###### ${el.textContent?.trim()}\n\n`
      case 'p': return `${childrenToMd(el, listDepth, orderedStack).trim()}\n\n`
      case 'br': return '  \n'
      case 'hr': return `\n---\n\n`
      case 'strong':
      case 'b':
        return `**${childrenToMd(el, listDepth, orderedStack).trim()}**`
      case 'em':
      case 'i':
        return `*${childrenToMd(el, listDepth, orderedStack).trim()}*`
      case 'del':
      case 's':
      case 'strike':
        return `~~${childrenToMd(el, listDepth, orderedStack).trim()}~~`
      case 'code':
        return `\`${el.textContent ?? ''}\``
      case 'pre': {
        const code = el.querySelector('code')?.textContent ?? el.textContent ?? ''
        // Detect language from class="language-xxx"
        const codeEl = el.querySelector('code')
        const langMatch = codeEl?.className.match(/language-(\w+)/)
        const lang = langMatch ? langMatch[1] : ''
        return `\n\`\`\`${lang}\n${code.trim()}\n\`\`\`\n\n`
      }
      case 'blockquote': {
        const inner = childrenToMd(el, listDepth, orderedStack).trim()
        return inner.split('\n').map((l) => `> ${l}`).join('\n') + '\n\n'
      }
      case 'a': {
        const href = el.getAttribute('href') ?? ''
        const text = childrenToMd(el, listDepth, orderedStack).trim() || href
        return `[${text}](${href})`
      }
      case 'img': {
        const src = el.getAttribute('src') ?? ''
        const alt = el.getAttribute('alt') ?? ''
        return `![${alt}](${src})`
      }
      case 'ul':
      case 'ol': {
        const isOrdered = tag === 'ol'
        const items = Array.from(el.children).filter((c) => c.tagName.toLowerCase() === 'li')
        const newStack = [...orderedStack, isOrdered]
        const lines = items.map((li, i) => {
          const indent = '  '.repeat(listDepth)
          const marker = isOrdered ? `${i + 1}.` : '-'
          // Content may itself contain nested lists — recurse on direct text + child lists.
          const nested = convertLi(li, listDepth, newStack)
          return `${indent}${marker} ${nested}`
        })
        return `${lines.join('\n')}\n${listDepth === 0 ? '\n' : ''}`
      }
      case 'li':
        return convertLi(el, listDepth, orderedStack)
      case 'table':
        return convertTable(el) + '\n\n'
      case 'thead':
      case 'tbody':
      case 'tfoot':
      case 'tr':
      case 'th':
      case 'td':
        // Bare table elements outside a <table> — skip gracefully.
        return childrenToMd(el, listDepth, orderedStack)
      case 'input': {
        const type = (el as HTMLInputElement).type
        if (type === 'checkbox' || type === 'radio') {
          return (el as HTMLInputElement).checked ? '[x] ' : '[ ] '
        }
        return ''
      }
      case 'span':
      case 'div':
      case 'section':
      case 'article':
      case 'main':
      case 'header':
      case 'footer':
      case 'nav':
      case 'figure':
      case 'figcaption':
        return childrenToMd(el, listDepth, orderedStack)
      default:
        return childrenToMd(el, listDepth, orderedStack)
    }
  }
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent ?? ''
  }
  return ''
}

function convertLi(li: Element, depth: number, orderedStack: boolean[]): string {
  // Separate direct content from nested lists.
  const childLists: Element[] = []
  const otherNodes: Node[] = []
  for (const child of Array.from(li.childNodes)) {
    if (child.nodeType === Node.ELEMENT_NODE) {
      const tag = (child as Element).tagName.toLowerCase()
      if (tag === 'ul' || tag === 'ol') {
        childLists.push(child as Element)
        continue
      }
    }
    otherNodes.push(child)
  }
  let text = otherNodes.map((n) => convertNode(n, depth, orderedStack)).join('').trim()
  for (const list of childLists) {
    const sub = convertNode(list, depth + 1, orderedStack)
    text += '\n' + sub.trimEnd()
  }
  return text
}

function childrenToMd(el: Element, depth: number, orderedStack: boolean[]): string {
  return Array.from(el.childNodes).map((n) => convertNode(n, depth, orderedStack)).join('')
}

function convertTable(table: Element): string {
  const rows = Array.from(table.querySelectorAll('tr'))
  if (rows.length === 0) return ''
  const headerCells = Array.from(rows[0].querySelectorAll('th,td')).map((c) => (c.textContent ?? '').trim())
  const bodyRows = rows.slice(headerCells.length > 0 ? 1 : 0)
  const colCount = headerCells.length || (bodyRows[0]?.querySelectorAll('td').length ?? 0)
  if (colCount === 0) return ''
  const header = headerCells.length > 0 ? headerCells : Array.from({ length: colCount }, (_, i) => `Col ${i + 1}`)
  const separator = Array.from({ length: colCount }, () => '---')
  const lines = [
    `| ${header.join(' | ')} |`,
    `| ${separator.join(' | ')} |`,
  ]
  for (const row of bodyRows) {
    const cells = Array.from(row.querySelectorAll('td,th')).map((c) => (c.textContent ?? '').trim().replace(/\|/g, '\\|').replace(/\n/g, ' '))
    while (cells.length < colCount) cells.push('')
    lines.push(`| ${cells.join(' | ')} |`)
  }
  return lines.join('\n')
}

function htmlToMarkdown(html: string): string {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  let out = ''
  for (const child of Array.from(doc.body.childNodes)) {
    out += convertNode(child)
  }
  // Collapse 3+ newlines to 2, trim trailing whitespace per line.
  return out.replace(/\n{3,}/g, '\n\n').replace(/[ \t]+\n/g, '\n').trim() + '\n'
}

export default function HtmlToMarkdown() {
  const [html, setHtml] = React.useState('')
  const [markdown, setMarkdown] = React.useState('')

  function convert() {
    if (!html.trim()) {
      setMarkdown('')
      toast.info('Paste some HTML first')
      return
    }
    try {
      const md = htmlToMarkdown(html)
      setMarkdown(md)
      toast.success('Converted to Markdown')
    } catch (e) {
      toast.error(`Conversion failed: ${(e as Error).message}`)
    }
  }

  function copyHtml() {
    navigator.clipboard.writeText(html).then(() => toast.success('HTML copied')).catch(() => toast.error('Copy failed'))
  }

  function downloadMd() {
    if (!markdown) {
      toast.info('Nothing to download')
      return
    }
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'document.md'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    toast.success('Downloaded document.md')
  }

  return (
    <div className="space-y-6">
      <ToolCardWrapper>
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Input */}
          <div className="space-y-2">
            <FieldLabel className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Code2 className="h-4 w-4 text-primary" /> HTML input
              </span>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => { setHtml(SAMPLE_HTML); toast.info('Sample HTML loaded') }}>
                  Sample
                </Button>
                {html && (
                  <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5" onClick={() => { setHtml(''); setMarkdown('') }}>
                    <Trash2 className="h-3.5 w-3.5" /> Clear
                  </Button>
                )}
              </div>
            </FieldLabel>
            <Textarea
              value={html}
              onChange={(e) => setHtml(e.target.value)}
              placeholder={'<h1>Title</h1>\n<p>Hello <strong>world</strong></p>'}
              className="min-h-[260px] font-mono text-xs"
              spellCheck={false}
            />
            <Button onClick={convert} disabled={!html.trim()} className="gap-1.5 w-full">
              <ArrowRight className="h-4 w-4" /> Convert to Markdown
            </Button>
          </div>

          {/* Output */}
          <div className="space-y-2">
            <FieldLabel className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" /> Markdown output
              </span>
              <div className="flex items-center gap-2">
                <CopyButton text={markdown} label="Copy" />
                <Button variant="outline" size="sm" className="gap-1.5" onClick={downloadMd} disabled={!markdown}>
                  <Download className="h-4 w-4" /> .md
                </Button>
              </div>
            </FieldLabel>
            <Textarea
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
              placeholder="Markdown will appear here…"
              className="min-h-[260px] font-mono text-xs"
              spellCheck={false}
            />
            {markdown && (
              <Badge variant="secondary" className="font-mono text-[10px]">{markdown.length} chars · {markdown.split('\n').length} lines</Badge>
            )}
          </div>
        </div>
      </ToolCardWrapper>

      {/* Live preview */}
      <ToolCardWrapper>
        <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
          <FieldLabel className="mb-0 flex items-center gap-2">
            <Eye className="h-4 w-4 text-primary" /> Rendered preview
          </FieldLabel>
          <Button variant="ghost" size="sm" onClick={() => navigator.clipboard.writeText(markdown).then(() => toast.success('Markdown copied')).catch(() => toast.error('Copy failed'))} disabled={!markdown}>
            <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy markdown
          </Button>
        </div>
        {markdown ? (
          <div className="prose prose-sm dark:prose-invert max-w-none overflow-x-auto">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
          </div>
        ) : (
          <EmptyState message="Convert HTML to see a rendered Markdown preview." />
        )}
      </ToolCardWrapper>

      <ToolCardWrapper>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Supported conversions</h3>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 text-xs font-mono">
          {[
            ['h1–h6', '# ## ###'],
            ['p', 'paragraph'],
            ['strong / b', '**bold**'],
            ['em / i', '*italic*'],
            ['del / s', '~~strike~~'],
            ['a', '[text](href)'],
            ['img', '![alt](src)'],
            ['code', '`code`'],
            ['pre > code', '```block```'],
            ['ul / li', '- item'],
            ['ol / li', '1. item'],
            ['blockquote', '> quote'],
            ['hr', '---'],
            ['table', 'markdown table'],
            ['input checkbox', '[x] / [ ]'],
          ].map(([from, to]) => (
            <div key={from} className="flex items-center justify-between gap-2 rounded border border-border/60 px-2 py-1.5">
              <span className="text-muted-foreground">{from}</span>
              <ArrowRight className="h-3 w-3 text-primary" />
              <span className="text-foreground">{to}</span>
            </div>
          ))}
        </div>
      </ToolCardWrapper>
    </div>
  )
}
