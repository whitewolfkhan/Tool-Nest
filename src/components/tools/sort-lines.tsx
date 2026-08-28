'use client'

import * as React from 'react'
import { ArrowDownUp, Eraser } from 'lucide-react'
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

type Direction = 'asc' | 'desc'
type SortMode = 'lexical' | 'natural' | 'length'

interface Options {
  direction: Direction
  caseInsensitive: boolean
  mode: SortMode
  removeDuplicates: boolean
}

function naturalCompare(a: string, b: string, caseInsensitive: boolean) {
  const ax: string[] = []
  const bx: string[] = []
  const re = /(\d+)|(\D+)/g
  const an = (a || '').toString()
  const bn = (b || '').toString()
  const aNN = caseInsensitive ? an.toLowerCase() : an
  const bNN = caseInsensitive ? bn.toLowerCase() : bn
  aNN.replace(re, (_, $1, $2) => {
    ax.push($2 ? $2 : $1)
    return ''
  })
  bNN.replace(re, (_, $1, $2) => {
    bx.push($2 ? $2 : $1)
    return ''
  })
  while (ax.length && bx.length) {
    const an1 = ax.shift() || ''
    const bn1 = bx.shift() || ''
    const nn = Number(an1) - Number(bn1)
    if (!isNaN(nn) && an1.match(/^\d+$/) && bn1.match(/^\d+$/)) {
      if (nn !== 0) return nn
    } else {
      const cmp = an1.localeCompare(bn1)
      if (cmp !== 0) return cmp
    }
  }
  return ax.length - bx.length
}

function sortLines(text: string, opts: Options) {
  let lines = text.split('\n')
  let removed = 0
  if (opts.removeDuplicates) {
    const seen = new Set<string>()
    const filtered: string[] = []
    for (const line of lines) {
      const key = opts.caseInsensitive ? line.toLowerCase() : line
      if (seen.has(key)) {
        removed++
        continue
      }
      seen.add(key)
      filtered.push(line)
    }
    lines = filtered
  }
  const original = [...lines]
  const cmp = (a: string, b: string) => {
    let av = a
    let bv = b
    if (opts.caseInsensitive) {
      av = av.toLowerCase()
      bv = bv.toLowerCase()
    }
    let r = 0
    if (opts.mode === 'length') {
      r = a.length - b.length
    } else if (opts.mode === 'natural') {
      r = naturalCompare(a, b, opts.caseInsensitive)
    } else {
      r = av.localeCompare(bv)
    }
    return opts.direction === 'desc' ? -r : r
  }
  lines.sort(cmp)
  return {
    output: lines.join('\n'),
    removed,
    count: original.length,
    sorted: lines.length,
  }
}

export default function SortLines() {
  const [text, setText] = React.useState('')
  const [opts, setOpts] = React.useState<Options>({
    direction: 'asc',
    caseInsensitive: false,
    mode: 'lexical',
    removeDuplicates: false,
  })

  const result = React.useMemo(() => sortLines(text, opts), [text, opts])

  return (
    <div className="space-y-4">
      <ToolCardWrapper>
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <FieldLabel>Direction</FieldLabel>
            <Select
              value={opts.direction}
              onValueChange={(v: Direction) => setOpts({ ...opts, direction: v })}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">Ascending (A → Z)</SelectItem>
                <SelectItem value="desc">Descending (Z → A)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <FieldLabel>Sort mode</FieldLabel>
            <Select
              value={opts.mode}
              onValueChange={(v: SortMode) => setOpts({ ...opts, mode: v })}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lexical">Lexical</SelectItem>
                <SelectItem value="natural">Natural (file2 &lt; file10)</SelectItem>
                <SelectItem value="length">By length</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <Label htmlFor="ci" className="text-sm">Case insensitive</Label>
              <p className="text-xs text-muted-foreground">Ignore case when sorting</p>
            </div>
            <Switch
              id="ci"
              checked={opts.caseInsensitive}
              onCheckedChange={(v) => setOpts({ ...opts, caseInsensitive: v })}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <Label htmlFor="rd" className="text-sm">Remove duplicates</Label>
              <p className="text-xs text-muted-foreground">Drop dupes after sort</p>
            </div>
            <Switch
              id="rd"
              checked={opts.removeDuplicates}
              onCheckedChange={(v) => setOpts({ ...opts, removeDuplicates: v })}
            />
          </div>
        </div>
        <div className="flex justify-end mt-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setOpts({ direction: 'asc', caseInsensitive: false, mode: 'lexical', removeDuplicates: false })
            }
            className="gap-1.5"
          >
            <ArrowDownUp className="h-4 w-4" /> Reset options
          </Button>
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
            placeholder="Paste lines to sort..."
            className="min-h-[280px] resize-y font-mono text-sm"
          />
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="secondary">{result.count} lines</Badge>
            {result.removed > 0 && (
              <Badge variant="destructive">{result.removed} duplicates removed</Badge>
            )}
          </div>
        </ToolCardWrapper>

        <ToolCardWrapper>
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <FieldLabel className="mb-0">Sorted output</FieldLabel>
            <CopyButton text={result.output} />
          </div>
          <Textarea
            value={result.output}
            readOnly
            placeholder="Sorted lines will appear here..."
            className="min-h-[280px] resize-y font-mono text-sm bg-muted/40"
          />
        </ToolCardWrapper>
      </div>
    </div>
  )
}
