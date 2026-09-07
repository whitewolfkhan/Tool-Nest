'use client'

import * as React from 'react'
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  Upload,
  Copy,
  Download,
  Table as TableIcon,
  Columns3,
  Rows3,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'
import {
  ToolCardWrapper,
  FieldLabel,
  EmptyState,
} from '@/components/tool-page-shell'
import { toast } from 'sonner'

// ---------- RFC-4180 CSV parser (handles quoted values, embedded commas/newlines) ----------

function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let cur: string[] = []
  let field = ''
  let inQuotes = false
  const normalized = text.replace(/\r\n|\r|\n/g, '\r\n')
  let i = 0
  while (i < normalized.length) {
    const ch = normalized[i]
    if (inQuotes) {
      if (ch === '"') {
        if (normalized[i + 1] === '"') {
          field += '"'
          i += 2
          continue
        }
        inQuotes = false
        i++
        continue
      }
      field += ch
      i++
      continue
    }
    if (ch === '"') {
      inQuotes = true
      i++
      continue
    }
    if (ch === ',') {
      cur.push(field)
      field = ''
      i++
      continue
    }
    if (ch === '\r' && normalized[i + 1] === '\n') {
      cur.push(field)
      field = ''
      rows.push(cur)
      cur = []
      i += 2
      continue
    }
    field += ch
    i++
  }
  if (field.length > 0 || cur.length > 0) {
    cur.push(field)
    rows.push(cur)
  }
  return rows
}

type SortDir = 'asc' | 'desc' | null

const SAMPLE_CSV = `name,email,role,active,joined
Alice Lee,alice@example.com,admin,true,2021-03-15
Bob Smith,bob@example.com,user,false,2022-07-04
"Carol, J.",carol@example.com,editor,true,2020-11-22
Dave,dave@example.com,user,true,2023-01-09
Eve,eve@example.com,admin,true,2019-05-30`

function copyText(text: string) {
  return navigator.clipboard.writeText(text)
}

function downloadText(text: string, filename: string, mime = 'text/plain') {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export default function CsvViewer() {
  const [csvText, setCsvText] = React.useState('')
  const [hasHeader, setHasHeader] = React.useState(true)
  const [search, setSearch] = React.useState('')
  const [sortCol, setSortCol] = React.useState<number | null>(null)
  const [sortDir, setSortDir] = React.useState<SortDir>(null)

  const fileRef = React.useRef<HTMLInputElement>(null)

  // Parse and compute table data
  const { headers, rows } = React.useMemo(() => {
    if (!csvText.trim()) return { headers: [] as string[], rows: [] as string[][] }
    const all = parseCsv(csvText)
    if (all.length === 0) return { headers: [], rows: [] }
    let h: string[]
    let r: string[][]
    if (hasHeader) {
      h = all[0]
      r = all.slice(1)
    } else {
      h = all[0].map((_, i) => `column_${i + 1}`)
      r = all
    }
    return { headers: h, rows: r }
  }, [csvText, hasHeader])

  // Filter rows by search query (case-insensitive, any cell match)
  const filteredRows = React.useMemo(() => {
    if (!search.trim()) return rows
    const q = search.toLowerCase()
    return rows.filter((r) => r.some((cell) => cell.toLowerCase().includes(q)))
  }, [rows, search])

  // Sort rows
  const sortedRows = React.useMemo(() => {
    if (sortCol === null || !sortDir) return filteredRows
    const arr = [...filteredRows]
    arr.sort((a, b) => {
      const av = a[sortCol] ?? ''
      const bv = b[sortCol] ?? ''
      // Try numeric sort first
      const an = parseFloat(av)
      const bn = parseFloat(bv)
      const numeric = !isNaN(an) && !isNaN(bn) && av.trim() !== '' && bv.trim() !== ''
      if (numeric) {
        return sortDir === 'asc' ? an - bn : bn - an
      }
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return arr
  }, [filteredRows, sortCol, sortDir])

  function toggleSort(colIdx: number) {
    if (sortCol !== colIdx) {
      setSortCol(colIdx)
      setSortDir('asc')
    } else if (sortDir === 'asc') {
      setSortDir('desc')
    } else if (sortDir === 'desc') {
      // Reset
      setSortCol(null)
      setSortDir(null)
    } else {
      setSortDir('asc')
    }
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 20 * 1024 * 1024) {
      toast.error('File too large (max 20 MB)')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setCsvText(String(reader.result ?? ''))
      toast.success(`Loaded ${file.name}`)
    }
    reader.onerror = () => toast.error('Failed to read file')
    reader.readAsText(file)
    // Reset input so the same file can be re-uploaded
    e.target.value = ''
  }

  function copyAsTsv() {
    if (sortedRows.length === 0) {
      toast.info('Nothing to copy')
      return
    }
    const tsv = [headers, ...sortedRows].map((r) => r.join('\t')).join('\n')
    copyText(tsv)
      .then(() => toast.success(`Copied ${sortedRows.length} rows as TSV`))
      .catch(() => toast.error('Failed to copy'))
  }

  function downloadCsv() {
    if (sortedRows.length === 0) {
      toast.info('Nothing to download')
      return
    }
    const out = [headers, ...sortedRows]
      .map((r) =>
        r
          .map((v) => {
            if (/[",\r\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`
            return v
          })
          .join(','),
      )
      .join('\r\n')
    downloadText(out, 'data.csv', 'text/csv')
    toast.success('Downloaded data.csv')
  }

  const colCount = headers.length
  const rowCount = rows.length
  const visibleCount = sortedRows.length

  return (
    <div className="space-y-6">
      <ToolCardWrapper>
        <div className="grid gap-4 lg:grid-cols-[1fr_1.5fr]">
          {/* Input panel */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <FieldLabel className="mb-0 flex items-center gap-2">
                <TableIcon className="h-4 w-4 text-primary" />
                CSV input
              </FieldLabel>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs gap-1.5"
                  onClick={() => fileRef.current?.click()}
                >
                  <Upload className="h-3.5 w-3.5" /> Upload
                </Button>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv,.txt,text/csv,text/plain"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => {
                    setCsvText(SAMPLE_CSV)
                    toast.info('Sample CSV loaded')
                  }}
                >
                  Sample
                </Button>
                {csvText && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs gap-1.5"
                    onClick={() => {
                      setCsvText('')
                      setSearch('')
                      setSortCol(null)
                      setSortDir(null)
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Clear
                  </Button>
                )}
              </div>
            </div>
            <Textarea
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder={'name,age,city\nAlice,30,London\nBob,25,Paris'}
              className="min-h-[260px] font-mono text-xs"
              spellCheck={false}
            />
            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
              <input
                type="checkbox"
                checked={hasHeader}
                onChange={(e) => setHasHeader(e.target.checked)}
                className="h-4 w-4 rounded border-border"
              />
              First row is header
            </label>
          </div>

          {/* Stats + search panel */}
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <StatTile icon={<Rows3 className="h-4 w-4" />} label="Rows" value={rowCount} />
              <StatTile icon={<Columns3 className="h-4 w-4" />} label="Columns" value={colCount} />
              <StatTile icon={<Search className="h-4 w-4" />} label="Visible" value={visibleCount} />
            </div>

            <FieldLabel className="flex items-center gap-2">
              <Search className="h-3.5 w-3.5 text-muted-foreground" />
              Filter rows
            </FieldLabel>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Type to filter across all columns…"
              className="font-mono text-sm"
            />

            {colCount > 0 && (
              <div>
                <FieldLabel>Column names ({colCount})</FieldLabel>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {headers.map((h, i) => (
                    <Badge key={i} variant="secondary" className="font-mono text-xs">
                      {h}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={copyAsTsv}
                disabled={sortedRows.length === 0}
              >
                <Copy className="h-4 w-4" /> Copy as TSV
              </Button>
              <Button
                size="sm"
                className="gap-1.5"
                onClick={downloadCsv}
                disabled={sortedRows.length === 0}
              >
                <Download className="h-4 w-4" /> Download CSV
              </Button>
              {(sortCol !== null || search) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => {
                    setSearch('')
                    setSortCol(null)
                    setSortDir(null)
                  }}
                >
                  Reset filters
                </Button>
              )}
            </div>
          </div>
        </div>
      </ToolCardWrapper>

      {/* Data table */}
      <ToolCardWrapper>
        <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
          <h3 className="text-sm font-semibold">Data preview</h3>
          <p className="text-xs text-muted-foreground">
            Click a column header to sort (asc → desc → off).
          </p>
        </div>
        <Separator className="mb-3" />

        {sortedRows.length === 0 ? (
          <EmptyState
            message={
              csvText
                ? 'No rows to display. Try clearing the filter.'
                : 'Paste CSV on the left, drop a .csv file, or click Sample to get started.'
            }
          />
        ) : (
          <div className="rounded-md border border-border overflow-hidden">
            <div className="max-h-[460px] overflow-auto scrollbar-thin">
              <Table className="min-w-max">
                <TableHeader className="sticky top-0 z-10 bg-muted/95 backdrop-blur">
                  <TableRow className="hover:bg-muted/95">
                    <TableHead className="w-12 text-right text-xs text-muted-foreground">#</TableHead>
                    {headers.map((h, i) => (
                      <TableHead
                        key={i}
                        className="cursor-pointer select-none whitespace-nowrap px-3"
                        onClick={() => toggleSort(i)}
                      >
                        <span className="inline-flex items-center gap-1.5">
                          {h}
                          {sortCol === i ? (
                            sortDir === 'asc' ? (
                              <ArrowUp className="h-3 w-3 text-primary" />
                            ) : sortDir === 'desc' ? (
                              <ArrowDown className="h-3 w-3 text-primary" />
                            ) : (
                              <ArrowUpDown className="h-3 w-3 text-muted-foreground/60" />
                            )
                          ) : (
                            <ArrowUpDown className="h-3 w-3 text-muted-foreground/40" />
                          )}
                        </span>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedRows.map((row, ri) => (
                    <TableRow key={ri}>
                      <TableCell className="text-xs text-muted-foreground text-right font-mono px-3">
                        {ri + 1}
                      </TableCell>
                      {headers.map((_, ci) => (
                        <TableCell
                          key={ci}
                          className="font-mono text-xs whitespace-nowrap px-3 py-2"
                        >
                          {row[ci] ?? ''}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </ToolCardWrapper>
    </div>
  )
}

function StatTile({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: number
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-card/50 p-3">
      <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
        {icon}
        {label}
      </div>
      <div className="text-2xl font-semibold tabular-nums mt-0.5">{value}</div>
    </div>
  )
}
