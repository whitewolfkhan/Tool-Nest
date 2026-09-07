'use client'

import * as React from 'react'
import { Link2, Eraser } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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

const STOPWORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'if', 'of', 'at', 'by', 'for',
  'with', 'about', 'to', 'from', 'in', 'on', 'is', 'are', 'was', 'were',
  'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
  'this', 'that', 'these', 'those', 'it', 'its', 'as', 'so', 'than',
  'too', 'very', 'just', 'also', 'i', 'me', 'my', 'we', 'our', 'you',
  'your', 'he', 'she', 'they', 'them', 'what', 'which', 'who', 'when',
  'where', 'why', 'how',
])

interface Options {
  separator: '-' | '_'
  lowercase: boolean
  stripStopwords: boolean
  maxLength: number
}

function generateSlug(text: string, opts: Options): string {
  if (!text) return ''
  let words = text
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s-_]/g, ' ')
    .trim()
    .split(/\s+|[-_]+/)
    .filter(Boolean)

  if (opts.stripStopwords) {
    words = words.filter((w) => !STOPWORDS.has(w.toLowerCase()))
  }
  if (opts.lowercase) {
    words = words.map((w) => w.toLowerCase())
  }
  let slug = words.join(opts.separator)
  if (opts.maxLength > 0 && slug.length > opts.maxLength) {
    slug = slug.slice(0, opts.maxLength)
    // trim trailing partial word
    const lastSep = Math.max(
      slug.lastIndexOf(opts.separator),
      slug.lastIndexOf('-'),
      slug.lastIndexOf('_')
    )
    if (lastSep > 0 && slug.length - lastSep < 6) {
      slug = slug.slice(0, lastSep)
    }
  }
  return slug
}

export default function SlugUrlGenerator() {
  const [text, setText] = React.useState('')
  const [opts, setOpts] = React.useState<Options>({
    separator: '-',
    lowercase: true,
    stripStopwords: true,
    maxLength: 0,
  })

  const slug = React.useMemo(() => generateSlug(text, opts), [text, opts])

  return (
    <div className="space-y-4">
      <ToolCardWrapper>
        <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
          <FieldLabel className="mb-0">Source text / title</FieldLabel>
          <Button
            variant="ghost"
            size="sm"
            disabled={!text}
            onClick={() => setText('')}
            className="gap-1.5"
          >
            <Eraser className="h-4 w-4" /> Clear
          </Button>
        </div>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="e.g. The 10 Best SEO Strategies for 2024 — A Complete Guide"
          className="min-h-[100px] resize-y"
        />
      </ToolCardWrapper>

      <ToolCardWrapper>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <FieldLabel>Separator</FieldLabel>
            <Select
              value={opts.separator}
              onValueChange={(v: '-' | '_') => setOpts({ ...opts, separator: v })}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="-">Hyphen ( - )</SelectItem>
                <SelectItem value="_">Underscore ( _ )</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <FieldLabel>Max length (0 = unlimited)</FieldLabel>
            <Input
              type="number"
              min={0}
              max={200}
              value={opts.maxLength}
              onChange={(e) =>
                setOpts({ ...opts, maxLength: Number(e.target.value) })
              }
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <Label htmlFor="lc2" className="text-sm">Lowercase</Label>
              <p className="text-xs text-muted-foreground">All letters lowercase</p>
            </div>
            <Switch
              id="lc2"
              checked={opts.lowercase}
              onCheckedChange={(v) => setOpts({ ...opts, lowercase: v })}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <Label htmlFor="sw2" className="text-sm">Strip stopwords</Label>
              <p className="text-xs text-muted-foreground">Remove “the”, “a”, “an”, “is”, etc.</p>
            </div>
            <Switch
              id="sw2"
              checked={opts.stripStopwords}
              onCheckedChange={(v) => setOpts({ ...opts, stripStopwords: v })}
            />
          </div>
        </div>
      </ToolCardWrapper>

      <ToolCardWrapper>
        <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
          <FieldLabel className="mb-0">SEO-friendly URL slug</FieldLabel>
          <div className="flex gap-2 items-center">
            {slug && (
              <Badge variant="secondary">
                <Link2 className="h-3 w-3 mr-1" /> {slug.length} chars
              </Badge>
            )}
            <CopyButton text={slug} />
          </div>
        </div>
        <Input
          value={slug}
          readOnly
          placeholder="seo-friendly-url-slug"
          className="font-mono text-base h-11 bg-muted/40"
        />
        <p className="text-xs text-muted-foreground mt-2">
          Lowercase, hyphenated, diacritics removed, special chars stripped.
        </p>
      </ToolCardWrapper>
    </div>
  )
}
