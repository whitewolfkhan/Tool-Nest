'use client'

import * as React from 'react'
import { FileCode2, Map, Plus, Eraser } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
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
  DownloadButton,
  ToolCardWrapper,
  FieldLabel,
} from '@/components/tool-page-shell'

interface Options {
  changefreq:
    | 'always'
    | 'hourly'
    | 'daily'
    | 'weekly'
    | 'monthly'
    | 'yearly'
    | 'never'
  priority: string
  lastmod: string
}

function buildSitemap(urlsText: string, opts: Options): string {
  const urls = urlsText
    .split('\n')
    .map((u) => u.trim())
    .filter(Boolean)
  if (urls.length === 0) return ''
  const lines: string[] = []
  lines.push('<?xml version="1.0" encoding="UTF-8"?>')
  lines.push(
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
  )
  for (const url of urls) {
    lines.push('  <url>')
    lines.push(`    <loc>${url.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</loc>`)
    if (opts.lastmod) {
      lines.push(`    <lastmod>${opts.lastmod}</lastmod>`)
    }
    lines.push(`    <changefreq>${opts.changefreq}</changefreq>`)
    lines.push(`    <priority>${opts.priority}</priority>`)
    lines.push('  </url>')
  }
  lines.push('</urlset>')
  return lines.join('\n')
}

const SAMPLE = `https://example.com/
https://example.com/about
https://example.com/blog
https://example.com/contact`

export default function SitemapGenerator() {
  const [urls, setUrls] = React.useState(SAMPLE)
  const [opts, setOpts] = React.useState<Options>({
    changefreq: 'weekly',
    priority: '0.8',
    lastmod: '',
  })

  const output = React.useMemo(() => buildSitemap(urls, opts), [urls, opts])

  const urlCount = urls
    .split('\n')
    .map((u) => u.trim())
    .filter(Boolean).length

  const downloadSitemap = () => {
    const blob = new Blob([output], { type: 'application/xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'sitemap.xml'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      <ToolCardWrapper>
        <div className="flex items-center gap-2 mb-4">
          <FileCode2 className="h-5 w-5 text-primary" />
          <h2 className="text-base font-semibold">URLs</h2>
        </div>
        <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
          <FieldLabel className="mb-0">One URL per line</FieldLabel>
          <div className="flex gap-2 items-center">
            <Badge variant="secondary">{urlCount} URLs</Badge>
            <Button
              variant="ghost"
              size="sm"
              disabled={!urls}
              onClick={() => setUrls('')}
              className="gap-1.5"
            >
              <Eraser className="h-4 w-4" /> Clear
            </Button>
          </div>
        </div>
        <Textarea
          value={urls}
          onChange={(e) => setUrls(e.target.value)}
          placeholder="https://example.com/page-1&#10;https://example.com/page-2"
          className="min-h-[180px] resize-y font-mono text-sm"
        />
      </ToolCardWrapper>

      <ToolCardWrapper>
        <div className="flex items-center gap-2 mb-4">
          <Map className="h-5 w-5 text-primary" />
          <h2 className="text-base font-semibold">Options</h2>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <FieldLabel>Change Frequency</FieldLabel>
            <Select
              value={opts.changefreq}
              onValueChange={(v: Options['changefreq']) =>
                setOpts({ ...opts, changefreq: v })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="always">always</SelectItem>
                <SelectItem value="hourly">hourly</SelectItem>
                <SelectItem value="daily">daily</SelectItem>
                <SelectItem value="weekly">weekly</SelectItem>
                <SelectItem value="monthly">monthly</SelectItem>
                <SelectItem value="yearly">yearly</SelectItem>
                <SelectItem value="never">never</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <FieldLabel>Priority (0.0–1.0)</FieldLabel>
            <Input
              type="number"
              min={0}
              max={1}
              step={0.1}
              value={opts.priority}
              onChange={(e) => setOpts({ ...opts, priority: e.target.value })}
            />
          </div>
          <div>
            <FieldLabel>Last Modified (date)</FieldLabel>
            <Input
              type="date"
              value={opts.lastmod}
              onChange={(e) => setOpts({ ...opts, lastmod: e.target.value })}
            />
          </div>
        </div>
      </ToolCardWrapper>

      <ToolCardWrapper>
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <FieldLabel className="mb-0">Generated sitemap.xml</FieldLabel>
          <div className="flex gap-2">
            <CopyButton text={output} />
            <DownloadButton
              onClick={downloadSitemap}
              disabled={!output}
              label="Download XML"
            />
          </div>
        </div>
        <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-xs leading-relaxed font-mono whitespace-pre max-h-[420px] overflow-y-auto">
          <code>{output || '<!-- Enter URLs above to generate -->'}</code>
        </pre>
        <p className="text-xs text-muted-foreground mt-3">
          Upload this file to your website root as <code>sitemap.xml</code> and
          reference it in <code>robots.txt</code> and Google Search Console.
        </p>
      </ToolCardWrapper>
    </div>
  )
}
