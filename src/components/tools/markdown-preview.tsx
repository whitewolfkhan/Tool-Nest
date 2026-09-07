'use client'

import * as React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Eye, Code2, Copy } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { CopyButton, ToolCardWrapper, FieldLabel } from '@/components/tool-page-shell'
import { toast } from 'sonner'

const SAMPLE = `# Markdown Preview

Type **Markdown** on the left and see the rendered *HTML* here on the right.

## Features supported

- Headings (H1–H6)
- **Bold**, *italic*, ~~strikethrough~~
- [Links](https://example.com)
- Inline \`code\` and code blocks
- Lists (ordered / unordered)
- > Blockquotes
- Tables (via GFM)

| Tool | Category | Free |
| ---- | -------- | ---- |
| JSON Formatter | Developer | ✅ |
| UUID Generator | Developer | ✅ |

\`\`\`js
function hello(name) {
  return \`Hello, \${name}!\`;
}
\`\`\`
`

export default function MarkdownPreview() {
  const [input, setInput] = React.useState(SAMPLE)
  const [view, setView] = React.useState<'preview' | 'html'>('preview')
  const [html, setHtml] = React.useState('')

  const previewRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (previewRef.current) {
      setHtml(previewRef.current.innerHTML)
    }
  }, [input])

  const copyHtml = async () => {
    if (!html) return
    try {
      await navigator.clipboard.writeText(html)
      toast.success('HTML copied to clipboard')
    } catch {
      toast.error('Failed to copy')
    }
  }

  return (
    <ToolCardWrapper>
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Editor */}
        <div>
          <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
            <FieldLabel className="mb-0">Markdown</FieldLabel>
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
            placeholder="# Type markdown here..."
            className="min-h-[280px] sm:min-h-[420px] resize-y font-mono text-sm"
            spellCheck={false}
          />
        </div>

        {/* Preview / HTML */}
        <div>
          <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
            <FieldLabel className="mb-0">Output</FieldLabel>
            <div className="flex items-center gap-2">
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
              <Button variant="outline" size="sm" onClick={copyHtml} className="gap-1.5" disabled={!html}>
                <Copy className="h-3.5 w-3.5" /> Copy HTML
              </Button>
            </div>
          </div>

          <div className="min-h-[280px] sm:min-h-[420px] rounded-md border border-border bg-background overflow-auto">
            {view === 'preview' ? (
              <div
                ref={previewRef}
                className="prose prose-sm dark:prose-invert max-w-none p-4 prose-headings:font-semibold prose-a:text-primary prose-code:before:hidden prose-code:after:hidden prose-code:rounded prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:text-xs"
              >
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    // Force safe rendering — react-markdown already sanitizes by default.
                    a: ({ node: _node, ...props }) => (
                      <a {...props} target="_blank" rel="noopener noreferrer" />
                    ),
                  }}
                >
                  {input}
                </ReactMarkdown>
              </div>
            ) : (
              <pre className="m-0 p-3 font-mono text-xs overflow-auto h-full max-h-[420px]">
                <code>{html}</code>
              </pre>
            )}
          </div>
        </div>
      </div>
    </ToolCardWrapper>
  )
}
