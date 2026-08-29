'use client'

import * as React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Eye, Code2, Copy, Download, FileText, FileCode2 } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  ToolCardWrapper,
  FieldLabel,
  CopyButton,
  EmptyState,
} from '@/components/tool-page-shell'
import { toast } from 'sonner'

const SAMPLE = `# Markdown to HTML

Convert **Markdown** into a standalone HTML document you can save and open anywhere.

## Features

- Headings (H1–H6)
- **Bold**, *italic*, ~~strikethrough~~
- [Links](https://example.com)
- Inline \`code\` and fenced code blocks
- Ordered & unordered lists
- > Blockquotes
- Tables (GFM)
- Horizontal rules

## Table example

| Tool | Type | Free |
| ---- | ---- | ---- |
| JSON Formatter | Developer | ✅ |
| QR Generator | Misc | ✅ |

## Code block

\`\`\`js
function greet(name) {
  return \`Hello, \${name}!\`;
}
\`\`\`

---

Made with [ToolNest](https://example.com).
`

// Inline stylesheet embedded into the downloaded .html document.
const HTML_DOC_STYLES = `
body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; color: #1f2328; max-width: 760px; margin: 2rem auto; padding: 0 1rem; }
h1, h2, h3, h4, h5, h6 { line-height: 1.25; margin: 1.5rem 0 0.75rem; font-weight: 600; }
h1 { font-size: 1.9rem; border-bottom: 1px solid #d0d7de; padding-bottom: 0.3rem; }
h2 { font-size: 1.5rem; border-bottom: 1px solid #d0d7de; padding-bottom: 0.3rem; }
h3 { font-size: 1.25rem; }
p { margin: 0.75rem 0; }
a { color: #0969da; text-decoration: none; }
a:hover { text-decoration: underline; }
code { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; background: #f6f8fa; padding: 0.15em 0.35em; border-radius: 4px; font-size: 0.9em; }
pre { background: #f6f8fa; padding: 1rem; border-radius: 6px; overflow-x: auto; }
pre code { background: none; padding: 0; }
blockquote { border-left: 4px solid #d0d7de; padding: 0 1rem; color: #57606a; margin: 1rem 0; }
ul, ol { padding-left: 2rem; }
li { margin: 0.25rem 0; }
table { border-collapse: collapse; margin: 1rem 0; width: 100%; }
th, td { border: 1px solid #d0d7de; padding: 0.4rem 0.75rem; text-align: left; }
th { background: #f6f8fa; font-weight: 600; }
tr:nth-child(even) { background: #fbfcfd; }
hr { border: none; border-top: 2px solid #d0d7de; margin: 1.5rem 0; }
img { max-width: 100%; height: auto; }
`.trim()

function wrapHtmlDocument(bodyHtml: string, title = 'Markdown'): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
${HTML_DOC_STYLES}
  </style>
</head>
<body>
${bodyHtml}
</body>
</html>`
}

function downloadText(text: string, filename: string, mime = 'text/plain') {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export default function MarkdownToHtml() {
  const [input, setInput] = React.useState(SAMPLE)
  const [view, setView] = React.useState<'preview' | 'html'>('preview')

  // Compute the inner HTML via react-markdown → static markup
  const bodyHtml = React.useMemo(() => {
    if (!input.trim()) return ''
    return renderToStaticMarkup(
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ node: _node, ...props }) => (
            <a {...props} target="_blank" rel="noopener noreferrer" />
          ),
        }}
      >
        {input}
      </ReactMarkdown>,
    )
  }, [input])

  const standaloneHtml = React.useMemo(
    () => (bodyHtml ? wrapHtmlDocument(bodyHtml) : ''),
    [bodyHtml],
  )

  const copyHtml = async () => {
    if (!bodyHtml) return
    try {
      await navigator.clipboard.writeText(standaloneHtml)
      toast.success('HTML document copied to clipboard')
    } catch {
      toast.error('Failed to copy')
    }
  }

  const handleDownload = () => {
    if (!standaloneHtml) return
    downloadText(standaloneHtml, 'markdown.html', 'text/html')
    toast.success('Downloaded markdown.html')
  }

  return (
    <div className="space-y-6">
      <ToolCardWrapper>
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Editor */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
              <FieldLabel className="mb-0 flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Markdown
              </FieldLabel>
              <div className="flex items-center gap-2">
                {input && (
                  <Badge variant="secondary" className="font-mono">
                    {input.length} chars
                  </Badge>
                )}
                <Button variant="ghost" size="sm" onClick={() => setInput('')} className="gap-1.5">
                  Clear
                </Button>
              </div>
            </div>
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="# Type Markdown here…"
              className="min-h-[460px] resize-y font-mono text-sm"
              spellCheck={false}
            />
          </div>

          {/* Output */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
              <FieldLabel className="mb-0 flex items-center gap-2">
                <FileCode2 className="h-4 w-4 text-primary" />
                Output
              </FieldLabel>
              <div className="flex items-center gap-2 flex-wrap">
                <Tabs value={view} onValueChange={(v) => setView(v as 'preview' | 'html')}>
                  <TabsList className="h-8">
                    <TabsTrigger value="preview" className="text-xs gap-1.5">
                      <Eye className="h-3.5 w-3.5" /> Preview
                    </TabsTrigger>
                    <TabsTrigger value="html" className="text-xs gap-1.5">
                      <Code2 className="h-3.5 w-3.5" /> HTML
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyHtml}
                  className="gap-1.5"
                  disabled={!standaloneHtml}
                >
                  <Copy className="h-3.5 w-3.5" /> Copy HTML
                </Button>
                <Button
                  size="sm"
                  onClick={handleDownload}
                  className="gap-1.5"
                  disabled={!standaloneHtml}
                >
                  <Download className="h-3.5 w-3.5" /> .html
                </Button>
              </div>
            </div>

            <div className="min-h-[460px] rounded-md border border-border bg-background overflow-hidden flex flex-col">
              {view === 'preview' ? (
                <div className="flex-1 overflow-auto">
                  <div className="prose prose-sm dark:prose-invert max-w-none p-4 prose-headings:font-semibold prose-a:text-primary prose-code:before:hidden prose-code:after:hidden prose-code:rounded prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:text-xs">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        a: ({ node: _node, ...props }) => (
                          <a {...props} target="_blank" rel="noopener noreferrer" />
                        ),
                      }}
                    >
                      {input}
                    </ReactMarkdown>
                  </div>
                </div>
              ) : (
                <pre className="m-0 flex-1 p-3 font-mono text-xs overflow-auto">
                  <code>{standaloneHtml}</code>
                </pre>
              )}
            </div>
          </div>
        </div>
      </ToolCardWrapper>

      <ToolCardWrapper>
        <h3 className="text-sm font-semibold mb-2">Supported Markdown features</h3>
        <Separator className="mb-3" />
        <div className="grid gap-2 sm:grid-cols-2 text-sm text-muted-foreground">
          <p>• Headings (H1–H6)</p>
          <p>• <strong>Bold</strong> and <em>italic</em></p>
          <p>• ~~Strikethrough~~ (GFM)</p>
          <p>• [Links](url) — open in new tab</p>
          <p>• Inline `code` &amp; fenced ``` blocks</p>
          <p>• Ordered and unordered lists</p>
          <p>• &gt; Blockquotes</p>
          <p>• Tables (GFM)</p>
          <p>• --- horizontal rules</p>
          <p>• ![images](url)</p>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          The downloaded <code className="font-mono">.html</code> file is a complete HTML5
          document with inline CSS — no external dependencies, opens in any browser.
        </p>
      </ToolCardWrapper>

      {!input && (
        <EmptyState message="Type Markdown on the left to instantly preview the rendered HTML, copy it, or download a self-contained .html file." />
      )}
    </div>
  )
}
