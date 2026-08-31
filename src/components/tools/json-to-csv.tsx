'use client'

import * as React from 'react'
import { ArrowRight, ArrowLeft, FileJson, FileSpreadsheet, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  ToolCardWrapper,
  FieldLabel,
  CopyButton,
  EmptyState,
} from '@/components/tool-page-shell'
import { toast } from 'sonner'

// ---------- CSV utilities (RFC 4180 compliant) ----------

/** Escape a single CSV value: wrap in quotes if needed, double any internal quotes. */
function escapeCsvValue(val: unknown): string {
  if (val === null || val === undefined) return ''
  let str: string
  if (typeof val === 'object') {
    str = JSON.stringify(val)
  } else {
    str = String(val)
  }
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function jsonToCsv(jsonText: string): { csv: string; rows: number; cols: number } {
  const trimmed = jsonText.trim()
  if (!trimmed) return { csv: '', rows: 0, cols: 0 }
  let data: unknown
  try {
    data = JSON.parse(trimmed)
  } catch (e) {
    throw new Error(`Invalid JSON: ${(e as Error).message}`)
  }
  if (!Array.isArray(data)) {
    throw new Error('JSON must be an array of objects')
  }
  if (data.length === 0) {
    return { csv: '', rows: 0, cols: 0 }
  }
  // Collect all keys (preserve first-seen order)
  const keySet: string[] = []
  const seen = new Set<string>()
  for (const row of data) {
    if (row === null || typeof row !== 'object' || Array.isArray(row)) {
      throw new Error('Each item in the array must be a flat object')
    }
    for (const k of Object.keys(row as Record<string, unknown>)) {
      if (!seen.has(k)) {
        seen.add(k)
        keySet.push(k)
      }
    }
  }
  const lines: string[] = []
  lines.push(keySet.map((k) => escapeCsvValue(k)).join(','))
  for (const row of data) {
    const r = row as Record<string, unknown>
    lines.push(keySet.map((k) => escapeCsvValue(r[k])).join(','))
  }
  return { csv: lines.join('\r\n'), rows: data.length, cols: keySet.length }
}

/** Parse CSV text into rows of strings. Handles quoted values, escaped quotes, embedded newlines. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let cur: string[] = []
  let field = ''
  let inQuotes = false
  let i = 0
  // Normalize line endings to \r\n first so we can detect record end reliably
  const normalized = text.replace(/\r\n|\r|\n/g, '\r\n')
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
    // not in quotes
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
  // Push the last field/row if any content remains
  if (field.length > 0 || cur.length > 0) {
    cur.push(field)
    rows.push(cur)
  }
  return rows
}

function csvToJson(csvText: string, hasHeader: boolean): { json: string; rows: number; cols: number } {
  const trimmed = csvText.trim()
  if (!trimmed) return { json: '[]', rows: 0, cols: 0 }
  const rows = parseCsv(trimmed)
  if (rows.length === 0) return { json: '[]', rows: 0, cols: 0 }
  let headers: string[]
  let dataRows: string[][]
  if (hasHeader) {
    headers = rows[0]
    dataRows = rows.slice(1)
  } else {
    headers = rows[0].map((_, i) => `column_${i + 1}`)
    dataRows = rows
  }
  const maxCols = headers.length
  const obj: Record<string, unknown>[] = dataRows.map((r) => {
    const o: Record<string, unknown> = {}
    for (let i = 0; i < maxCols; i++) {
      const raw = r[i] ?? ''
      // Try to coerce numbers, booleans, null
      if (raw === '') o[headers[i]] = ''
      else if (raw === 'true') o[headers[i]] = true
      else if (raw === 'false') o[headers[i]] = false
      else if (raw === 'null') o[headers[i]] = null
      else if (/^-?\d+$/.test(raw) && !Number.isUnsafeInteger(parseInt(raw, 10))) {
        o[headers[i]] = parseInt(raw, 10)
      } else if (/^-?\d*\.\d+$/.test(raw)) {
        o[headers[i]] = parseFloat(raw)
      } else {
        o[headers[i]] = raw
      }
    }
    return o
  })
  return {
    json: JSON.stringify(obj, null, 2),
    rows: obj.length,
    cols: maxCols,
  }
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

const SAMPLE_JSON = `[
  { "name": "Ada Lovelace", "email": "ada@example.com", "age": 36, "active": true },
  { "name": "Alan Turing", "email": "alan@example.com", "age": 41, "active": false },
  { "name": "Grace Hopper, PhD", "email": "grace@example.com", "age": 85, "active": true }
]`

const SAMPLE_CSV = `name,email,note
Ada Lovelace,ada@example.com,"Hello, world"
"Alan ""Genius"" Turing",alan@example.com,"Contains
newline"
Grace Hopper,grace@example.com,No quotes needed`

export default function JsonToCsv() {
  const [tab, setTab] = React.useState<'j2c' | 'c2j'>('j2c')

  // JSON → CSV state
  const [jsonInput, setJsonInput] = React.useState<string>('')
  const [csvOutput, setCsvOutput] = React.useState<string>('')
  const [j2cRows, setJ2cRows] = React.useState<number>(0)
  const [j2cCols, setJ2cCols] = React.useState<number>(0)
  const [j2cError, setJ2cError] = React.useState<string | null>(null)

  // CSV → JSON state
  const [csvInput, setCsvInput] = React.useState<string>('')
  const [jsonOutput, setJsonOutput] = React.useState<string>('')
  const [c2jRows, setC2jRows] = React.useState<number>(0)
  const [c2jCols, setC2jCols] = React.useState<number>(0)
  const [c2jError, setC2jError] = React.useState<string | null>(null)
  const [hasHeader, setHasHeader] = React.useState<boolean>(true)

  function runJsonToCsv() {
    setJ2cError(null)
    try {
      const { csv, rows, cols } = jsonToCsv(jsonInput)
      setCsvOutput(csv)
      setJ2cRows(rows)
      setJ2cCols(cols)
      if (!csv) {
        toast.info('No data rows in JSON array')
      } else {
        toast.success(`Converted: ${rows} rows × ${cols} columns`)
      }
    } catch (e) {
      setJ2cError((e as Error).message)
      toast.error((e as Error).message)
    }
  }

  function runCsvToJson() {
    setC2jError(null)
    try {
      const { json, rows, cols } = csvToJson(csvInput, hasHeader)
      setJsonOutput(json)
      setC2jRows(rows)
      setC2jCols(cols)
      if (rows === 0) {
        toast.info('No data rows in CSV')
      } else {
        toast.success(`Converted: ${rows} rows × ${cols} columns`)
      }
    } catch (e) {
      setC2jError((e as Error).message)
      toast.error((e as Error).message)
    }
  }

  return (
    <div className="space-y-6">
      <ToolCardWrapper>
        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
          <TabsList className="mb-4">
            <TabsTrigger value="j2c" className="gap-1.5">
              <ArrowRight className="h-3.5 w-3.5" />
              JSON → CSV
            </TabsTrigger>
            <TabsTrigger value="c2j" className="gap-1.5">
              <ArrowLeft className="h-3.5 w-3.5" />
              CSV → JSON
            </TabsTrigger>
          </TabsList>

          {/* ===== JSON → CSV ===== */}
          <TabsContent value="j2c">
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <FieldLabel className="mb-0 flex items-center gap-2">
                    <FileJson className="h-4 w-4 text-primary" />
                    JSON input
                  </FieldLabel>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => {
                      setJsonInput(SAMPLE_JSON)
                      toast.info('Sample JSON loaded')
                    }}
                  >
                    Load sample
                  </Button>
                </div>
                <Textarea
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  placeholder='[ { "key": "value" }, ... ]'
                  className="min-h-72 font-mono text-sm"
                  spellCheck={false}
                />
                <Button onClick={runJsonToCsv} className="w-full gap-1.5">
                  <ArrowRight className="h-4 w-4" />
                  Convert to CSV
                </Button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <FieldLabel className="mb-0 flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4 text-primary" />
                    CSV output
                  </FieldLabel>
                  <div className="flex items-center gap-2">
                    {j2cRows > 0 && (
                      <>
                        <Badge variant="secondary">{j2cRows} rows</Badge>
                        <Badge variant="secondary">{j2cCols} cols</Badge>
                      </>
                    )}
                    <CopyButton text={csvOutput} label="" className="px-2.5" />
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      disabled={!csvOutput}
                      onClick={() => {
                        downloadText(csvOutput, 'data.csv', 'text/csv')
                        toast.success('Downloaded data.csv')
                      }}
                    >
                      <Download className="h-4 w-4" />
                      CSV
                    </Button>
                  </div>
                </div>
                <Textarea
                  value={csvOutput}
                  readOnly
                  placeholder="CSV output will appear here..."
                  className="min-h-72 font-mono text-sm"
                  spellCheck={false}
                />
                {j2cError && (
                  <p className="text-xs text-destructive">⚠ {j2cError}</p>
                )}
              </div>
            </div>
          </TabsContent>

          {/* ===== CSV → JSON ===== */}
          <TabsContent value="c2j">
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <FieldLabel className="mb-0 flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4 text-primary" />
                    CSV input
                  </FieldLabel>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => {
                      setCsvInput(SAMPLE_CSV)
                      toast.info('Sample CSV loaded')
                    }}
                  >
                    Load sample
                  </Button>
                </div>
                <Textarea
                  value={csvInput}
                  onChange={(e) => setCsvInput(e.target.value)}
                  placeholder={'name,age\nAda,36\nAlan,41'}
                  className="min-h-72 font-mono text-sm"
                  spellCheck={false}
                />
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasHeader}
                      onChange={(e) => setHasHeader(e.target.checked)}
                      className="h-4 w-4 rounded border-border"
                    />
                    First row is header
                  </label>
                  <Button onClick={runCsvToJson} className="gap-1.5">
                    <ArrowLeft className="h-4 w-4" />
                    Convert to JSON
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <FieldLabel className="mb-0 flex items-center gap-2">
                    <FileJson className="h-4 w-4 text-primary" />
                    JSON output
                  </FieldLabel>
                  <div className="flex items-center gap-2">
                    {c2jRows > 0 && (
                      <>
                        <Badge variant="secondary">{c2jRows} rows</Badge>
                        <Badge variant="secondary">{c2jCols} cols</Badge>
                      </>
                    )}
                    <CopyButton text={jsonOutput} label="" className="px-2.5" />
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      disabled={!jsonOutput}
                      onClick={() => {
                        downloadText(jsonOutput, 'data.json', 'application/json')
                        toast.success('Downloaded data.json')
                      }}
                    >
                      <Download className="h-4 w-4" />
                      JSON
                    </Button>
                  </div>
                </div>
                <Textarea
                  value={jsonOutput}
                  readOnly
                  placeholder="JSON output will appear here..."
                  className="min-h-72 font-mono text-sm"
                  spellCheck={false}
                />
                {c2jError && (
                  <p className="text-xs text-destructive">⚠ {c2jError}</p>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </ToolCardWrapper>

      <ToolCardWrapper>
        <h3 className="text-sm font-semibold mb-2">CSV escaping rules</h3>
        <Separator className="mb-3" />
        <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-5">
          <li>
            Values containing <code className="font-mono text-xs">,</code> (comma),{' '}
            <code className="font-mono text-xs">&quot;</code> (quote), or newlines
            are wrapped in double quotes automatically.
          </li>
          <li>
            Double quotes inside a value are escaped by doubling them:{' '}
            <code className="font-mono text-xs">&quot;&quot;</code>.
          </li>
          <li>
            CSV → JSON auto-detects numbers, booleans, and <code>null</code> when
            parsing back; everything else becomes a string.
          </li>
          <li>
            Toggle &ldquo;First row is header&rdquo; to control whether the first CSV row
            becomes object keys or generic <code>column_N</code> names.
          </li>
        </ul>
      </ToolCardWrapper>

      {tab === 'j2c' && !jsonInput && !csvOutput && (
        <EmptyState message="Paste a JSON array of objects and click Convert to get CSV. Click Load sample to try it instantly." />
      )}
      {tab === 'c2j' && !csvInput && !jsonOutput && (
        <EmptyState message="Paste CSV with a header row and click Convert to get JSON. Click Load sample to try it instantly." />
      )}
    </div>
  )
}
