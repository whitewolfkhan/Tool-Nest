'use client'

import * as React from 'react'
import { Tags, RotateCcw } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  CopyButton,
  ToolCardWrapper,
  FieldLabel,
} from '@/components/tool-page-shell'

interface MetaForm {
  title: string
  description: string
  keywords: string
  author: string
  robotsIndex: 'index' | 'noindex'
  robotsFollow: 'follow' | 'nofollow'
  canonical: string
  viewport: string
}

const DEFAULT_FORM: MetaForm = {
  title: '',
  description: '',
  keywords: '',
  author: '',
  robotsIndex: 'index',
  robotsFollow: 'follow',
  canonical: '',
  viewport: 'width=device-width, initial-scale=1.0',
}

function htmlEscape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function buildMetaTags(f: MetaForm): string {
  const lines: string[] = []
  if (f.title) lines.push(`<title>${htmlEscape(f.title)}</title>`)
  if (f.description) {
    lines.push(
      `<meta name="description" content="${htmlEscape(f.description)}" />`
    )
  }
  if (f.keywords) {
    lines.push(`<meta name="keywords" content="${htmlEscape(f.keywords)}" />`)
  }
  if (f.author) {
    lines.push(`<meta name="author" content="${htmlEscape(f.author)}" />`)
  }
  lines.push(
    `<meta name="robots" content="${f.robotsIndex}, ${f.robotsFollow}" />`
  )
  if (f.canonical) {
    lines.push(`<link rel="canonical" href="${htmlEscape(f.canonical)}" />`)
  }
  if (f.viewport) {
    lines.push(`<meta name="viewport" content="${htmlEscape(f.viewport)}" />`)
  }
  lines.push(`<meta charset="utf-8" />`)
  lines.push(`<meta http-equiv="X-UA-Compatible" content="IE=edge" />`)
  return lines.join('\n')
}

export default function MetaTagGenerator() {
  const [form, setForm] = React.useState<MetaForm>(DEFAULT_FORM)

  const output = React.useMemo(() => buildMetaTags(form), [form])

  const titleLen = form.title.length
  const descLen = form.description.length

  return (
    <div className="space-y-4">
      <ToolCardWrapper>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Tags className="h-5 w-5 text-primary" />
            <h2 className="text-base font-semibold">Meta Tag Form</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setForm(DEFAULT_FORM)}
            className="gap-1.5"
          >
            <RotateCcw className="h-4 w-4" /> Reset
          </Button>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <div className="flex items-center justify-between mb-1.5">
              <FieldLabel className="mb-0">Page Title</FieldLabel>
              <Badge
                variant={titleLen > 60 ? 'destructive' : 'secondary'}
                className="text-xs"
              >
                {titleLen}/60
              </Badge>
            </div>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="My Awesome Page — Brand"
            />
          </div>

          <div className="sm:col-span-2">
            <div className="flex items-center justify-between mb-1.5">
              <FieldLabel className="mb-0">Description</FieldLabel>
              <Badge
                variant={descLen > 160 ? 'destructive' : 'secondary'}
                className="text-xs"
              >
                {descLen}/160
              </Badge>
            </div>
            <Textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="Short summary that appears in search results…"
              className="min-h-[80px] resize-y"
            />
          </div>

          <div>
            <FieldLabel>Keywords (comma-separated)</FieldLabel>
            <Input
              value={form.keywords}
              onChange={(e) => setForm({ ...form, keywords: e.target.value })}
              placeholder="seo, meta tags, generator"
            />
          </div>

          <div>
            <FieldLabel>Author</FieldLabel>
            <Input
              value={form.author}
              onChange={(e) => setForm({ ...form, author: e.target.value })}
              placeholder="Jane Doe"
            />
          </div>

          <div>
            <FieldLabel>Robots — Indexing</FieldLabel>
            <Select
              value={form.robotsIndex}
              onValueChange={(v: 'index' | 'noindex') =>
                setForm({ ...form, robotsIndex: v })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="index">index</SelectItem>
                <SelectItem value="noindex">noindex</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <FieldLabel>Robots — Following</FieldLabel>
            <Select
              value={form.robotsFollow}
              onValueChange={(v: 'follow' | 'nofollow') =>
                setForm({ ...form, robotsFollow: v })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="follow">follow</SelectItem>
                <SelectItem value="nofollow">nofollow</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <FieldLabel>Canonical URL</FieldLabel>
            <Input
              value={form.canonical}
              onChange={(e) => setForm({ ...form, canonical: e.target.value })}
              placeholder="https://example.com/page"
            />
          </div>

          <div>
            <FieldLabel>Viewport</FieldLabel>
            <Input
              value={form.viewport}
              onChange={(e) => setForm({ ...form, viewport: e.target.value })}
            />
          </div>
        </div>
      </ToolCardWrapper>

      <ToolCardWrapper>
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <FieldLabel className="mb-0">Generated HTML</FieldLabel>
          <CopyButton text={output} />
        </div>
        <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-xs leading-relaxed font-mono whitespace-pre">
          <code>{output || '<!-- Fill in the form to generate meta tags -->'}</code>
        </pre>
        <p className="text-xs text-muted-foreground mt-3">
          Paste this code inside the <code>&lt;head&gt;</code> section of your
          HTML document.
        </p>
      </ToolCardWrapper>
    </div>
  )
}
