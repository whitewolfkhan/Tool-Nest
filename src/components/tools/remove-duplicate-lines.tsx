'use client'

import * as React from 'react'
import { Copy, Eraser, Layers } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  CopyButton,
  ToolCardWrapper,
  FieldLabel,
} from '@/components/tool-page-shell'

interface Options {
  caseSensitive: boolean
  trim: boolean
  keepEmpty: boolean
}

function dedupe(text: string, opts: Options) {
  const lines = text.split('\n')
  const seen = new Set<string>()
  const result: string[] = []
  let removed = 0
  for (const line of lines) {
    let key = line
    if (opts.trim) key = key.trim()
    if (!opts.caseSensitive) key = key.toLowerCase()
    if (line === '' || (opts.trim && line.trim() === '')) {
      if (opts.keepEmpty) result.push(line)
      continue
    }
    if (seen.has(key)) {
      removed++
      continue
    }
    seen.add(key)
    result.push(line)
  }
  return { output: result.join('\n'), removed, total: lines.length, unique: result.length }
}

export default function RemoveDuplicateLines() {
  const [text, setText] = React.useState('')
  const [opts, setOpts] = React.useState<Options>({
    caseSensitive: true,
    trim: true,
    keepEmpty: false,
  })

  const { output, removed, total, unique } = React.useMemo(
    () => dedupe(text, opts),
    [text, opts]
  )

  return (
    <div className="space-y-4">
      <ToolCardWrapper>
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <Label htmlFor="cs" className="text-sm">Case sensitive</Label>
              <p className="text-xs text-muted-foreground">Treat "A" and "a" as different</p>
            </div>
            <Switch
              id="cs"
              checked={opts.caseSensitive}
              onCheckedChange={(v) => setOpts({ ...opts, caseSensitive: v })}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <Label htmlFor="tr" className="text-sm">Trim whitespace</Label>
              <p className="text-xs text-muted-foreground">Strip before comparing</p>
            </div>
            <Switch
              id="tr"
              checked={opts.trim}
              onCheckedChange={(v) => setOpts({ ...opts, trim: v })}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <Label htmlFor="ke" className="text-sm">Keep empty lines</Label>
              <p className="text-xs text-muted-foreground">Preserve blank lines</p>
            </div>
            <Switch
              id="ke"
              checked={opts.keepEmpty}
              onCheckedChange={(v) => setOpts({ ...opts, keepEmpty: v })}
            />
          </div>
        </div>
      </ToolCardWrapper>

      <div className="grid gap-4 lg:grid-cols-2">
        <ToolCardWrapper>
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <FieldLabel className="mb-0">Input</FieldLabel>
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
            placeholder="Paste your lines here..."
            className="min-h-[280px] resize-y font-mono text-sm"
          />
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="secondary">{total} lines</Badge>
            {removed > 0 && (
              <Badge variant="destructive">{removed} duplicates removed</Badge>
            )}
            <Badge variant="outline" className="ml-auto">
              <Layers className="h-3 w-3 mr-1" /> {unique} unique
            </Badge>
          </div>
        </ToolCardWrapper>

        <ToolCardWrapper>
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <FieldLabel className="mb-0">Output</FieldLabel>
            <CopyButton text={output} />
          </div>
          <Textarea
            value={output}
            readOnly
            placeholder="Unique lines will appear here..."
            className="min-h-[280px] resize-y font-mono text-sm bg-muted/40"
          />
        </ToolCardWrapper>
      </div>
    </div>
  )
}
