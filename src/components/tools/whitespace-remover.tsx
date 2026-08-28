'use client'

import * as React from 'react'
import { Eraser, Scissors, Gauge } from 'lucide-react'
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
  trim: boolean
  collapse: boolean
  removeBlanks: boolean
  removeAll: boolean
}

function applyWhitespace(text: string, opts: Options): string {
  if (!text) return ''
  let out = text
  if (opts.removeAll) {
    return out.replace(/\s+/g, '')
  }
  if (opts.removeBlanks) {
    // Remove blank lines, preserving other line breaks
    out = out
      .split('\n')
      .filter((line) => line.trim().length > 0)
      .join('\n')
  }
  if (opts.collapse) {
    // Collapse runs of spaces/tabs into one, preserve line breaks
    out = out.replace(/[^\S\n]+/g, ' ')
  }
  if (opts.trim) {
    out = out
      .split('\n')
      .map((line) => line.trim())
      .join('\n')
    out = out.replace(/^\s+|\s+$/g, '')
  }
  return out
}

function byteSize(s: string): number {
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(s).length
  }
  return s.length
}

export default function WhitespaceRemover() {
  const [text, setText] = React.useState('')
  const [opts, setOpts] = React.useState<Options>({
    trim: true,
    collapse: true,
    removeBlanks: false,
    removeAll: false,
  })

  const handleToggle = (key: keyof Options, value: boolean) => {
    if (key === 'removeAll' && value) {
      // removeAll overrides others
      setOpts({ trim: false, collapse: false, removeBlanks: false, removeAll: true })
    } else if (key === 'removeAll' && !value) {
      setOpts({ ...opts, removeAll: false })
    } else {
      setOpts({ ...opts, [key]: value, removeAll: false })
    }
  }

  const output = React.useMemo(() => applyWhitespace(text, opts), [text, opts])

  const beforeBytes = byteSize(text)
  const afterBytes = byteSize(output)
  const saved = beforeBytes - afterBytes
  const savedPct = beforeBytes > 0 ? Math.round((saved / beforeBytes) * 100) : 0

  return (
    <div className="space-y-4">
      <ToolCardWrapper>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <Label htmlFor="tr" className="text-sm">Trim edges</Label>
              <p className="text-xs text-muted-foreground">Remove leading/trailing</p>
            </div>
            <Switch
              id="tr"
              checked={opts.trim}
              disabled={opts.removeAll}
              onCheckedChange={(v) => handleToggle('trim', v)}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <Label htmlFor="cl" className="text-sm">Collapse spaces</Label>
              <p className="text-xs text-muted-foreground">Multiple → single</p>
            </div>
            <Switch
              id="cl"
              checked={opts.collapse}
              disabled={opts.removeAll}
              onCheckedChange={(v) => handleToggle('collapse', v)}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <Label htmlFor="rb" className="text-sm">Remove blank lines</Label>
              <p className="text-xs text-muted-foreground">Drop empty lines</p>
            </div>
            <Switch
              id="rb"
              checked={opts.removeBlanks}
              disabled={opts.removeAll}
              onCheckedChange={(v) => handleToggle('removeBlanks', v)}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/5 p-3">
            <div>
              <Label htmlFor="ra" className="text-sm">Remove ALL whitespace</Label>
              <p className="text-xs text-muted-foreground">Strip everything</p>
            </div>
            <Switch
              id="ra"
              checked={opts.removeAll}
              onCheckedChange={(v) => handleToggle('removeAll', v)}
            />
          </div>
        </div>
        {opts.removeAll && (
          <p className="text-xs text-destructive mt-3">
            <Scissors className="inline h-3 w-3 mr-1" />
            All whitespace will be removed — this overrides other options.
          </p>
        )}
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
            placeholder="Paste text with messy whitespace..."
            className="min-h-[280px] resize-y font-mono text-sm"
          />
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="secondary">{beforeBytes} bytes</Badge>
            <Badge variant="outline">{text.length} chars</Badge>
          </div>
        </ToolCardWrapper>

        <ToolCardWrapper>
          <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
            <FieldLabel className="mb-0">Output</FieldLabel>
            <div className="flex gap-2 items-center">
              <Badge variant="secondary">
                <Gauge className="h-3 w-3 mr-1" /> {afterBytes} bytes
              </Badge>
              {saved > 0 && (
                <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-600 gap-1">
                  −{saved} bytes ({savedPct}%)
                </Badge>
              )}
              <CopyButton text={output} />
            </div>
          </div>
          <Textarea
            value={output}
            readOnly
            placeholder="Cleaned text will appear here..."
            className="min-h-[280px] resize-y font-mono text-sm bg-muted/40"
          />
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline">{output.length} chars</Badge>
          </div>
        </ToolCardWrapper>
      </div>
    </div>
  )
}
