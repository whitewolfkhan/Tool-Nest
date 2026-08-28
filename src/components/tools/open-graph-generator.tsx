'use client'

import * as React from 'react'
import { Share2, ExternalLink } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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

interface OGForm {
  title: string
  description: string
  image: string
  url: string
  type: 'website' | 'article'
  siteName: string
  twitterCard: 'summary' | 'summary_large_image' | 'player' | 'app'
}

const DEFAULT: OGForm = {
  title: 'My Awesome Page',
  description: 'A short, compelling description of what this page is about.',
  image: 'https://example.com/og-image.png',
  url: 'https://example.com',
  type: 'website',
  siteName: 'My Site',
  twitterCard: 'summary_large_image',
}

function htmlEscape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function buildTags(f: OGForm): string {
  const lines: string[] = []
  lines.push('<!-- Open Graph / Facebook -->')
  lines.push(`<meta property="og:type" content="${f.type}" />`)
  if (f.title) lines.push(`<meta property="og:title" content="${htmlEscape(f.title)}" />`)
  if (f.description) {
    lines.push(
      `<meta property="og:description" content="${htmlEscape(f.description)}" />`
    )
  }
  if (f.image) {
    lines.push(`<meta property="og:image" content="${htmlEscape(f.image)}" />`)
  }
  if (f.url) lines.push(`<meta property="og:url" content="${htmlEscape(f.url)}" />`)
  if (f.siteName) {
    lines.push(
      `<meta property="og:site_name" content="${htmlEscape(f.siteName)}" />`
    )
  }
  lines.push('')
  lines.push('<!-- Twitter Card -->')
  lines.push(
    `<meta name="twitter:card" content="${f.twitterCard}" />`
  )
  if (f.title) lines.push(`<meta name="twitter:title" content="${htmlEscape(f.title)}" />`)
  if (f.description) {
    lines.push(
      `<meta name="twitter:description" content="${htmlEscape(f.description)}" />`
    )
  }
  if (f.image) {
    lines.push(`<meta name="twitter:image" content="${htmlEscape(f.image)}" />`)
  }
  return lines.join('\n')
}

export default function OpenGraphGenerator() {
  const [form, setForm] = React.useState<OGForm>(DEFAULT)
  const output = React.useMemo(() => buildTags(form), [form])

  const isLargeCard = form.twitterCard === 'summary_large_image'

  return (
    <div className="space-y-4">
      <ToolCardWrapper>
        <div className="flex items-center gap-2 mb-4">
          <Share2 className="h-5 w-5 text-primary" />
          <h2 className="text-base font-semibold">Open Graph & Twitter Card</h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <FieldLabel>og:title</FieldLabel>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <FieldLabel>og:description</FieldLabel>
            <Textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              className="min-h-[70px] resize-y"
            />
          </div>
          <div className="sm:col-span-2">
            <FieldLabel>og:image URL</FieldLabel>
            <Input
              value={form.image}
              onChange={(e) => setForm({ ...form, image: e.target.value })}
              placeholder="https://example.com/og-image.png"
            />
          </div>
          <div>
            <FieldLabel>og:url</FieldLabel>
            <Input
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
            />
          </div>
          <div>
            <FieldLabel>og:site_name</FieldLabel>
            <Input
              value={form.siteName}
              onChange={(e) => setForm({ ...form, siteName: e.target.value })}
            />
          </div>
          <div>
            <FieldLabel>og:type</FieldLabel>
            <Select
              value={form.type}
              onValueChange={(v: 'website' | 'article') =>
                setForm({ ...form, type: v })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="website">website</SelectItem>
                <SelectItem value="article">article</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <FieldLabel>twitter:card</FieldLabel>
            <Select
              value={form.twitterCard}
              onValueChange={(v: OGForm['twitterCard']) =>
                setForm({ ...form, twitterCard: v })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="summary">summary</SelectItem>
                <SelectItem value="summary_large_image">
                  summary_large_image
                </SelectItem>
                <SelectItem value="player">player</SelectItem>
                <SelectItem value="app">app</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </ToolCardWrapper>

      <ToolCardWrapper>
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <FieldLabel className="mb-0">Live Preview</FieldLabel>
          <Badge variant="secondary">
            {isLargeCard ? 'Large image card' : 'Summary card'}
          </Badge>
        </div>
        <div className="rounded-xl border border-border overflow-hidden bg-background max-w-xl mx-auto">
          {isLargeCard ? (
            <div>
              <div className="aspect-[1.91/1] bg-muted flex items-center justify-center overflow-hidden">
                {form.image ? (
                  <img
                    src={form.image}
                    alt="OG preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                ) : (
                  <span className="text-xs text-muted-foreground">
                    No image
                  </span>
                )}
              </div>
              <div className="p-3 space-y-1">
                <p className="text-xs text-muted-foreground truncate">
                  {form.url || 'https://example.com'}
                </p>
                <p className="text-sm font-semibold text-foreground line-clamp-2">
                  {form.title || 'Title goes here'}
                </p>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {form.description || 'Description preview'}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex gap-3 p-3">
              <div className="h-20 w-20 shrink-0 rounded bg-muted flex items-center justify-center overflow-hidden">
                {form.image ? (
                  <img
                    src={form.image}
                    alt="OG preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                ) : (
                  <span className="text-[10px] text-muted-foreground">
                    No img
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <p className="text-xs text-muted-foreground truncate">
                  {form.url || 'https://example.com'}
                </p>
                <p className="text-sm font-semibold text-foreground line-clamp-2">
                  {form.title || 'Title goes here'}
                </p>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {form.description || 'Description preview'}
                </p>
              </div>
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
          <ExternalLink className="h-3 w-3" /> This is an approximation of how
          your link will appear on social platforms.
        </p>
      </ToolCardWrapper>

      <ToolCardWrapper>
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <FieldLabel className="mb-0">Generated Meta Tags</FieldLabel>
          <CopyButton text={output} />
        </div>
        <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-xs leading-relaxed font-mono whitespace-pre">
          <code>{output}</code>
        </pre>
      </ToolCardWrapper>
    </div>
  )
}
