'use client'

import * as React from 'react'
import {
  Plus,
  Trash2,
  Copy,
  Download,
  ArrowLeft,
  ArrowRight,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Table as TableIcon,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  ToolCardWrapper,
  FieldLabel,
  CopyButton,
} from '@/components/tool-page-shell'
import { toast } from 'sonner'

type Alignment = 'left' | 'center' | 'right'

const ALIGN_ICONS: Record<Alignment, React.ElementType> = {
  left: AlignLeft,
  center: AlignCenter,
  right: AlignRight,
}

function buildMarkdown(headers: string[], rows: string[][], aligns: Alignment[], hasHeader: boolean): string {
  if (headers.length === 0) return ''
  const cols = headers.length
  const pad = (s: string, align: Alignment, width: number) => {
    const trimmed = s.replace(/\|/g, '\\|')
    if (align === 'center') {
      const total = Math.max(width - trimmed.length, 0)
      const left = Math.floor(total / 2)
      const right = total - left
      return ' '.repeat(left) + trimmed + ' '.repeat(right)
    }
    if (align === 'right') return trimmed.padStart(width)
    return trimmed.padEnd(width)
  }
  const widths = Array.from({ length: cols }, (_, ci) => {
    const headerLen = (hasHeader ? headers[ci]?.length ?? 0 : 0)
    const rowMax = Math.max(3, ...rows.map((r) => (r[ci] ?? '').length))
    return Math.max(headerLen, rowMax) + 2
  })
  const sepChar = (a: Alignment) => (a === 'left' ? ':' : a === 'right' ? ':' : '')
  const dashLine = aligns.map((a, i) => `${sepChar(a)}${'-'.repeat(Math.max(widths[i] - (a === 'center' ? 2 : a === 'left' || a === 'right' ? 1 : 0), 1))}${a === 'center' ? ':' : a === 'left' || a === 'right' ? ':' : ''}`).join('|')
  const headerLine = headers.map((h, i) => pad(h || '', aligns[i], widths[i])).join('|')

  if (hasHeader) {
    const lines = [`| ${headerLine} |`, `|${dashLine}|`]
    for (const r of rows) {
      lines.push('| ' + r.map((c, i) => pad(c ?? '', aligns[i] ?? 'left', widths[i])).join('|') + ' |')
    }
    return lines.join('\n')
  } else {
    // Without header: use empty header row.
    const lines = [`| ${headers.map((h, i) => pad('', aligns[i], widths[i])).join('|')} |`, `|${dashLine}|`]
    for (const r of rows) {
      lines.push('| ' + r.map((c, i) => pad(c ?? '', aligns[i] ?? 'left', widths[i])).join('|') + ' |')
    }
    return lines.join('\n')
  }
}

export default function MarkdownTableGenerator() {
  const [headers, setHeaders] = React.useState<string[]>(['Name', 'Age', 'City'])
  const [rows, setRows] = React.useState<string[][]>([
    ['Alice', '30', 'London'],
    ['Bob', '25', 'Paris'],
  ])
  const [aligns, setAligns] = React.useState<Alignment[]>(['left', 'right', 'center'])
  const [hasHeader, setHasHeader] = React.useState(true)

  const markdown = React.useMemo(
    () => buildMarkdown(headers, rows, aligns, hasHeader),
    [headers, rows, aligns, hasHeader],
  )

  function addRow() {
    setRows((prev) => [...prev, Array.from({ length: headers.length }, () => '')])
  }
  function removeRow(idx: number) {
    setRows((prev) => prev.filter((_, i) => i !== idx))
  }
  function addCol() {
    setHeaders((prev) => [...prev, 'New'])
    setAligns((prev) => [...prev, 'left'])
    setRows((prev) => prev.map((r) => [...r, '']))
  }
  function removeCol(idx: number) {
    if (headers.length <= 1) return
    setHeaders((prev) => prev.filter((_, i) => i !== idx))
    setAligns((prev) => prev.filter((_, i) => i !== idx))
    setRows((prev) => prev.map((r) => r.filter((_, i) => i !== idx)))
  }
  function setHeader(ci: number, v: string) {
    setHeaders((prev) => prev.map((h, i) => (i === ci ? v : h)))
  }
  function setCell(ri: number, ci: number, v: string) {
    setRows((prev) => prev.map((r, i) => (i === ri ? r.map((c, j) => (j === ci ? v : c)) : r)))
  }
  function cycleAlign(ci: number) {
    setAligns((prev) => prev.map((a, i) => (i === ci ? (a === 'left' ? 'center' : a === 'center' ? 'right' : 'left') : a)))
  }
  function moveRow(idx: number, dir: -1 | 1) {
    const target = idx + dir
    if (target < 0 || target >= rows.length) return
    setRows((prev) => {
      const next = [...prev]
      ;[next[idx], next[target]] = [next[target], next[idx]]
      return next
    })
  }
  function moveCol(ci: number, dir: -1 | 1) {
    const target = ci + dir
    if (target < 0 || target >= headers.length) return
    const swap = <T,>(arr: T[]) => {
      const next = [...arr]
      ;[next[ci], next[target]] = [next[target], next[ci]]
      return next
    }
    setHeaders(swap)
    setAligns(swap)
    setRows((prev) => prev.map(swap))
  }

  function download() {
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'table.md'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    toast.success('Downloaded table.md')
  }

  return (
    <div className="space-y-6">
      <ToolCardWrapper>
        <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
          <FieldLabel className="mb-0 flex items-center gap-2">
            <TableIcon className="h-4 w-4 text-primary" />
            Table editor
          </FieldLabel>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={addCol}>
              <Plus className="h-3.5 w-3.5" /> Column
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={addRow}>
              <Plus className="h-3.5 w-3.5" /> Row
            </Button>
            <label className="flex items-center gap-2 text-xs cursor-pointer select-none ml-1">
              <Switch checked={hasHeader} onCheckedChange={setHasHeader} />
              Header row
            </label>
          </div>
        </div>

        {/* Headers */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="w-10 p-1"></th>
                {headers.map((h, ci) => {
                  const AlignIcon = ALIGN_ICONS[aligns[ci] ?? 'left']
                  return (
                    <th key={ci} className="p-1 min-w-[120px]">
                      <div className="flex items-center gap-1">
                        <Input
                          value={h}
                          onChange={(e) => setHeader(ci, e.target.value)}
                          className="font-medium text-sm h-8"
                          placeholder={`Column ${ci + 1}`}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={() => cycleAlign(ci)}
                          title={`Align: ${aligns[ci]}`}
                        >
                          <AlignIcon className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <div className="flex items-center justify-between gap-1 mt-1">
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveCol(ci, -1)} disabled={ci === 0}>
                          <ArrowLeft className="h-3 w-3" />
                        </Button>
                        <span className="text-[10px] text-muted-foreground uppercase">{aligns[ci]}</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveCol(ci, 1)} disabled={ci === headers.length - 1}>
                          <ArrowRight className="h-3 w-3" />
                        </Button>
                      </div>
                    </th>
                  )
                })}
                <th className="w-10 p-1"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, ri) => (
                <tr key={ri}>
                  <td className="p-1 text-center">
                    <div className="flex flex-col">
                      <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => moveRow(ri, -1)} disabled={ri === 0}>
                        <ArrowLeft className="h-3 w-3 rotate-90" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => moveRow(ri, 1)} disabled={ri === rows.length - 1}>
                        <ArrowLeft className="h-3 w-3 -rotate-90" />
                      </Button>
                    </div>
                  </td>
                  {headers.map((_, ci) => (
                    <td key={ci} className="p-1">
                      <Input
                        value={r[ci] ?? ''}
                        onChange={(e) => setCell(ri, ci, e.target.value)}
                        className="h-8 text-sm"
                      />
                    </td>
                  ))}
                  <td className="p-1 text-center">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-500 hover:text-rose-600" onClick={() => removeRow(ri)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={headers.length + 2} className="p-1 text-center">
                  <Button variant="ghost" size="sm" className="gap-1.5" onClick={removeCol} disabled={headers.length <= 1}>
                    <Trash2 className="h-3 w-3" /> Remove last column
                  </Button>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
        <Separator className="mt-4" />
        <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
          <Badge variant="secondary">{headers.length} columns</Badge>
          <Badge variant="secondary">{rows.length} rows</Badge>
          <span>· Click the alignment icon to cycle left → center → right.</span>
        </div>
      </ToolCardWrapper>

      {/* Markdown output */}
      <ToolCardWrapper>
        <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
          <FieldLabel className="mb-0">Markdown output</FieldLabel>
          <div className="flex items-center gap-2">
            <CopyButton text={markdown} label="Copy" />
            <Button size="sm" className="gap-1.5" onClick={download}>
              <Download className="h-4 w-4" /> Download .md
            </Button>
          </div>
        </div>
        <Textarea
          value={markdown}
          onChange={() => {}}
          readOnly
          className="min-h-[160px] font-mono text-xs"
          spellCheck={false}
        />
      </ToolCardWrapper>

      {/* Rendered preview */}
      <ToolCardWrapper>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Rendered preview</h3>
        </div>
        <div className="prose prose-sm dark:prose-invert max-w-none overflow-x-auto">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
        </div>
      </ToolCardWrapper>

      <ToolCardWrapper>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Tips</h3>
        </div>
        <ul className="text-sm text-muted-foreground space-y-1.5 list-disc pl-5">
          <li>Pipe characters (<code className="font-mono">|</code>) inside cells are auto-escaped as <code className="font-mono">\|</code>.</li>
          <li>Columns auto-pad to align pipes vertically — easier on the eye in source view.</li>
          <li>Alignment uses the standard <code className="font-mono">:---</code>, <code className="font-mono">:--:</code>, <code className="font-mono">---:</code> separators.</li>
          <li>Use the move arrows to reorder rows or columns.</li>
        </ul>
      </ToolCardWrapper>
    </div>
  )
}
