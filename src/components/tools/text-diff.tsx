'use client'

import * as React from 'react'
import { Plus, Minus, Eraser, ArrowLeftRight } from 'lucide-react'
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

type DiffOp = 'equal' | 'add' | 'remove'

interface DiffLine {
  type: DiffOp
  text: string
  leftNum?: number
  rightNum?: number
}

interface LCSOptions {
  ignoreCase: boolean
  ignoreWhitespace: boolean
  trimLines: boolean
}

function normalize(line: string, opts: LCSOptions): string {
  let s = line
  if (opts.trimLines) s = s.trim()
  if (opts.ignoreWhitespace) s = s.replace(/\s+/g, ' ')
  if (opts.ignoreCase) s = s.toLowerCase()
  return s
}

function diffLines(a: string[], b: string[], opts: LCSOptions): DiffLine[] {
  const na = a.map((l) => normalize(l, opts))
  const nb = b.map((l) => normalize(l, opts))
  const m = na.length
  const n = nb.length
  // LCS DP table
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0))
  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      if (na[i] === nb[j]) dp[i][j] = dp[i + 1][j + 1] + 1
      else dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1])
    }
  }
  // Backtrack
  const result: DiffLine[] = []
  let i = 0
  let j = 0
  while (i < m && j < n) {
    if (na[i] === nb[j]) {
      result.push({ type: 'equal', text: a[i], leftNum: i + 1, rightNum: j + 1 })
      i++
      j++
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      result.push({ type: 'remove', text: a[i], leftNum: i + 1 })
      i++
    } else {
      result.push({ type: 'add', text: b[j], rightNum: j + 1 })
      j++
    }
  }
  while (i < m) {
    result.push({ type: 'remove', text: a[i], leftNum: i + 1 })
    i++
  }
  while (j < n) {
    result.push({ type: 'add', text: b[j], rightNum: j + 1 })
    j++
  }
  return result
}

export default function TextDiff() {
  const [left, setLeft] = React.useState('')
  const [right, setRight] = React.useState('')
  const [opts, setOpts] = React.useState<LCSOptions>({
    ignoreCase: false,
    ignoreWhitespace: false,
    trimLines: false,
  })

  const diff = React.useMemo(() => {
    const a = left ? left.split('\n') : []
    const b = right ? right.split('\n') : []
    return diffLines(a, b, opts)
  }, [left, right, opts])

  const added = diff.filter((d) => d.type === 'add').length
  const removed = diff.filter((d) => d.type === 'remove').length
  const unchanged = diff.filter((d) => d.type === 'equal').length

  const swap = () => {
    const t = left
    setLeft(right)
    setRight(t)
  }

  return (
    <div className="space-y-4">
      <ToolCardWrapper>
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <Label htmlFor="ic" className="text-sm">Ignore case</Label>
              <p className="text-xs text-muted-foreground">Treat A and a as same</p>
            </div>
            <Switch
              id="ic"
              checked={opts.ignoreCase}
              onCheckedChange={(v) => setOpts({ ...opts, ignoreCase: v })}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <Label htmlFor="iw" className="text-sm">Ignore whitespace</Label>
              <p className="text-xs text-muted-foreground">Collapse runs of spaces</p>
            </div>
            <Switch
              id="iw"
              checked={opts.ignoreWhitespace}
              onCheckedChange={(v) => setOpts({ ...opts, ignoreWhitespace: v })}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <Label htmlFor="tl" className="text-sm">Trim lines</Label>
              <p className="text-xs text-muted-foreground">Strip leading/trailing</p>
            </div>
            <Switch
              id="tl"
              checked={opts.trimLines}
              onCheckedChange={(v) => setOpts({ ...opts, trimLines: v })}
            />
          </div>
        </div>
      </ToolCardWrapper>

      <div className="grid gap-4 lg:grid-cols-2">
        <ToolCardWrapper>
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <FieldLabel className="mb-0">Original text</FieldLabel>
            <Button
              variant="ghost"
              size="sm"
              disabled={!left}
              onClick={() => setLeft('')}
              className="gap-1.5"
            >
              <Eraser className="h-4 w-4" /> Clear
            </Button>
          </div>
          <Textarea
            value={left}
            onChange={(e) => setLeft(e.target.value)}
            placeholder="Paste original text..."
            className="min-h-[200px] resize-y font-mono text-sm"
          />
        </ToolCardWrapper>

        <ToolCardWrapper>
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <FieldLabel className="mb-0">Modified text</FieldLabel>
            <Button
              variant="ghost"
              size="sm"
              disabled={!right}
              onClick={() => setRight('')}
              className="gap-1.5"
            >
              <Eraser className="h-4 w-4" /> Clear
            </Button>
          </div>
          <Textarea
            value={right}
            onChange={(e) => setRight(e.target.value)}
            placeholder="Paste modified text..."
            className="min-h-[200px] resize-y font-mono text-sm"
          />
        </ToolCardWrapper>
      </div>

      <ToolCardWrapper>
        <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
          <FieldLabel className="mb-0">Diff</FieldLabel>
          <div className="flex gap-2 items-center flex-wrap">
            <Badge variant="secondary">{unchanged} unchanged</Badge>
            <Badge variant="default" className="gap-1 bg-emerald-600 hover:bg-emerald-600">
              <Plus className="h-3 w-3" /> {added} added
            </Badge>
            <Badge variant="default" className="gap-1 bg-rose-600 hover:bg-rose-600">
              <Minus className="h-3 w-3" /> {removed} removed
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={swap}
              disabled={!left && !right}
              className="gap-1.5"
            >
              <ArrowLeftRight className="h-4 w-4" /> Swap
            </Button>
          </div>
        </div>
        <div className="rounded-md border border-border overflow-hidden">
          <div className="max-h-[480px] overflow-auto">
            <table className="w-full font-mono text-xs">
              <tbody>
                {diff.length === 0 && (
                  <tr>
                    <td className="p-6 text-center text-muted-foreground">
                      Differences will appear here.
                    </td>
                  </tr>
                )}
                {diff.map((d, idx) => {
                  const bg =
                    d.type === 'add'
                      ? 'bg-emerald-500/10'
                      : d.type === 'remove'
                        ? 'bg-rose-500/10'
                        : ''
                  const fg =
                    d.type === 'add'
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : d.type === 'remove'
                        ? 'text-rose-700 dark:text-rose-400'
                        : 'text-foreground'
                  const sym = d.type === 'add' ? '+' : d.type === 'remove' ? '-' : ' '
                  return (
                    <tr key={idx} className={bg}>
                      <td className="w-10 text-right pr-2 py-0.5 text-muted-foreground/60 select-none align-top border-r border-border/50">
                        {d.leftNum ?? ''}
                      </td>
                      <td className="w-10 text-right pr-2 py-0.5 text-muted-foreground/60 select-none align-top border-r border-border/50">
                        {d.rightNum ?? ''}
                      </td>
                      <td className={`w-6 text-center py-0.5 select-none ${fg}`}>
                        {sym}
                      </td>
                      <td className={`px-2 py-0.5 whitespace-pre-wrap break-words ${fg}`}>
                        {d.text || '\u00A0'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
        <div className="flex justify-end mt-2">
          <CopyButton
            text={diff
              .map((d) => {
                const s = d.type === 'add' ? '+ ' : d.type === 'remove' ? '- ' : '  '
                return s + d.text
              })
              .join('\n')}
            label="Copy diff"
          />
        </div>
      </ToolCardWrapper>
    </div>
  )
}
