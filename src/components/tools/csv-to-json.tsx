'use client'

import * as React from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import {
  ArrowRight,
  Upload,
  Download,
  Trash2,
  Rows3,
  Columns3,
  Slash,
  Braces,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ToolCardWrapper,
  FieldLabel,
  CopyButton,
  EmptyState,
} from '@/components/tool-page-shell'
import { toast } from 'sonner'

type Delimiter = 'auto' | ',' | ';' | '\t' | '|'

const SAMPLE_CSV = `name,email,role,active,joined
Alice Lee,alice@example.com,admin,true,2021-03-15
Bob Smith,bob@example.com,user,false,2022-07-04
"Carol, J.",carol@example.com,editor,true,2020-11-22
Dave,dave@example.com,user,true,2023-01-09
Eve,eve@example.com,admin,true,2019-05-30`

/** Parse CSV text honoring RFC-4180-style quoted values for any delimiter. */
function parseCsv(text: string, delimiter: string): string[][] {
  const rows: string[][] = []
  let cur: string[] = []
  let field = ''
  let inQuotes = false
  const normalized = text.replace(/\r\n|\r|\n/g, '\r\n')
  for (let i = 0; i < normalized.length; i++) {
    const ch = normalized[i]
    if (inQuotes) {
      if (ch === '"') {
        if (normalized[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += ch
      }
      continue
    }
    if (ch === '"') {
      inQuotes = true
      continue
    }
    if (ch === delimiter) {
      cur.push(field)
      field = ''
      continue
    }
    if (ch === '\r' && normalized[i + 1] === '\n') {
      cur.push(field)
      rows.push(cur)
      cur = []
      field = ''
      i++
      continue
    }
    field += ch
  }
  if (field.length > 0 || cur.length > 0) {
    cur.push(field)
    rows.push(cur)
  }
  return rows.filter((r) => !(r.length === 1 && r[0] === ''))
}

/** Auto-detect the most likely delimiter from a CSV snippet. */
function detectDelimiter(text: string): string {
  const firstLine = text.split(/\r\n|\r|\n/)[0] ?? ''
  const candidates: { delim: string; count: number }[] = [
    { delim: ',', count: (firstLine.match(/,/g) ?? []).length },
    { delim: ';', count: (firstLine.match(/;/g) ?? []).length },
    { delim: '\t', count: (firstLine.match(/\t/g) ?? []).length },
    { delim: '|', count: (firstLine.match(/\|/g) ?? []).length },
  ]
  candidates.sort((a, b) => b.count - a.count)
  return candidates[0] && candidates[0].count > 0 ? candidates[0].delim : ','
}

function autoType(val: string): string | number | boolean | null {
  const v = val.trim()
  if (v === '') return null
  if (v === 'true') return true
  if (v === 'false') return false
  // Number? avoid stripping leading zeros incorrectly
  if (/^-?\d+$/.test(v)) {
    const n = parseInt(v, 10)
    if (Number.isSafeInteger(n)) return n
  }
  if (/^-?\d*\.\d+$/.test(v)) {
    const n = parseFloat(v)
    if (!Number.isNaN(n)) return n
  }
  return v
}

export default function CsvToJson() {
  const [csv, setCsv] = React.useState('')
  const [delim, setDelim] = React.useState<Delimiter>('auto')
  const [hasHeader, setHasHeader] = React.useState(true)
  const [trim, setTrim] = React.useState(true)
  const [inferTypes, setInferTypes] = React.useState(true)
  const fileRef = React.useRef<HTMLInputElement>(null)

  const detectedDelim = React.useMemo(
    () => (delim === 'auto' ? detectDelimiter(csv) : delim),
    [csv, delim],
  )

  const { json, rowCount, colCount } = React.useMemo(() => {
    if (!csv.trim()) return { json: '', rowCount: 0, colCount: 0 }
    const rows = parseCsv(csv, detectedDelim)
    if (rows.length === 0) return { json: '', rowCount: 0, colCount: 0 }
    let headers: string[]
    let body: string[][]
    if (hasHeader) {
      headers = rows[0]
      body = rows.slice(1)
    } else {
      headers = rows[0].map((_, i) => `column_${i + 1}`)
      body = rows
    }
    const norm = (s: string) => (trim ? s.trim() : s)
    const objArr = body.map((row) => {
      const obj: Record<string, string | number | boolean | null> = {}
      headers.forEach((h, i) => {
        const raw = norm(row[i] ?? '')
        obj[norm(h)] = inferTypes ? autoType(raw) : raw
      })
      return obj
    })
    return {
      json: JSON.stringify(objArr, null, 2),
      rowCount: body.length,
      colCount: headers.length,
    }
  }, [csv, detectedDelim, hasHeader, trim, inferTypes])

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    if (f.size > 5 * 1024 * 1024) {
      toast.error('File too large (max 5 MB)')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setCsv(String(reader.result ?? ''))
      toast.success(`Loaded ${f.name}`)
    }
    reader.onerror = () => toast.error('Failed to read file')
    reader.readAsText(f)
    e.target.value = ''
  }

  function download() {
    if (!json) {
      toast.info('Nothing to download')
      return
    }
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'data.json'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    toast.success('Downloaded data.json')
  }

  const delimLabel = detectedDelim === '\t' ? 'Tab' : detectedDelim === ' ' ? 'Space' : detectedDelim

  return (
    <div className="space-y-6">
      <ToolCardWrapper>
        <div className="grid gap-5 lg:grid-cols-2">
          {/* Input */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <FieldLabel className="mb-0 flex items-center gap-2">
                <Braces className="h-4 w-4 text-primary" />
                CSV input
              </FieldLabel>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5" onClick={() => fileRef.current?.click()}>
                  <Upload className="h-3.5 w-3.5" /> Upload
                </Button>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv,.txt,text/csv,text/plain"
                  className="hidden"
                  onChange={handleUpload}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => {
                    setCsv(SAMPLE_CSV)
                    toast.info('Sample CSV loaded')
                  }}
                >
                  Sample
                </Button>
                {csv && (
                  <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5" onClick={() => setCsv('')}>
                    <Trash2 className="h-3.5 w-3.5" /> Clear
                  </Button>
                )}
              </div>
            </div>
            <Textarea
              value={csv}
              onChange={(e) => setCsv(e.target.value)}
              placeholder={'name,age,city\nAlice,30,London\nBob,25,Paris'}
              className="min-h-[260px] font-mono text-xs"
              spellCheck={false}
            />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>Delimiter</FieldLabel>
                <Select value={delim} onValueChange={(v) => setDelim(v as Delimiter)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto-detect</SelectItem>
                    <SelectItem value=",">Comma ( , )</SelectItem>
                    <SelectItem value=";">Semicolon ( ; )</SelectItem>
                    <SelectItem value="|">Pipe ( | )</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <FieldLabel>Detected</FieldLabel>
                <Input value={delimLabel} readOnly className="font-mono" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <ToggleRow label="Header row" checked={hasHeader} onChange={setHasHeader} />
              <ToggleRow label="Trim values" checked={trim} onChange={setTrim} />
              <ToggleRow label="Infer types" checked={inferTypes} onChange={setInferTypes} />
            </div>
          </div>

          {/* Output */}
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <StatTile icon={<Rows3 className="h-4 w-4" />} label="Rows" value={rowCount} />
              <StatTile icon={<Columns3 className="h-4 w-4" />} label="Columns" value={colCount} />
              <StatTile icon={<Slash className="h-4 w-4" />} label="Delimiter" valueStr={delimLabel} />
            </div>

            <FieldLabel>JSON output</FieldLabel>
            {json ? (
              <div className="rounded-lg overflow-hidden border border-border">
                <SyntaxHighlighter
                  language="json"
                  style={oneDark}
                  customStyle={{
                    margin: 0,
                    padding: '1rem',
                    fontSize: '12px',
                    maxHeight: '320px',
                    overflow: 'auto',
                  }}
                  wrapLongLines
                >
                  {json}
                </SyntaxHighlighter>
              </div>
            ) : (
              <EmptyState message="Paste CSV on the left, drop a .csv file, or click Sample." />
            )}

            <div className="flex flex-wrap gap-2">
              <CopyButton text={json} label="Copy JSON" />
              <Button size="sm" className="gap-1.5" onClick={download} disabled={!json}>
                <Download className="h-4 w-4" /> Download JSON
              </Button>
            </div>
          </div>
        </div>
      </ToolCardWrapper>

      <ToolCardWrapper>
        <div className="flex items-center gap-2 mb-3">
          <ArrowRight className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">How it works</h3>
        </div>
        <ul className="text-sm text-muted-foreground space-y-1.5 list-disc pl-5">
          <li>CSV is parsed using a RFC-4180 compliant parser that handles quoted fields and embedded delimiters.</li>
          <li>Auto-detect picks the delimiter with the highest count in the first line (comma, semicolon, tab, or pipe).</li>
          <li>With <Badge variant="secondary" className="font-mono text-[10px]">Infer types</Badge> enabled, values are converted to numbers and booleans automatically. Disable it to keep everything as strings.</li>
          <li>If <Badge variant="secondary" className="font-mono text-[10px]">Header row</Badge> is off, columns are named <code className="font-mono">column_1, column_2, …</code></li>
        </ul>
      </ToolCardWrapper>
    </div>
  )
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-md border border-border/60 px-3 py-2">
      <span className="text-xs font-medium">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  )
}

function StatTile({
  icon,
  label,
  value,
  valueStr,
}: {
  icon: React.ReactNode
  label: string
  value?: number
  valueStr?: string
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-card/50 p-3">
      <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
        {icon}
        {label}
      </div>
      <div className="text-xl font-semibold tabular-nums mt-0.5 font-mono">
        {valueStr ?? value}
      </div>
    </div>
  )
}
