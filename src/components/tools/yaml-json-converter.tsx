'use client'

import * as React from 'react'
import { ArrowRight, ArrowLeft, FileJson, FileCode2, Copy, Download, Braces } from 'lucide-react'
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

// ============================================================
//  Minimal YAML parser & serializer
//  Supports a practical subset of YAML 1.1:
//   - block maps (key: value)
//   - block sequences (- item)
//   - arbitrary nesting via 2-space indentation
//   - scalars: string, integer, float, boolean, null
//   - simple quoted strings ("..." and '...')
//   - empty values (null)
//   - sequence-of-maps pattern (- key: val, sub: val2)
//  Not supported: flow style [a, b] / {a: b}, anchors, aliases,
//  multi-line block scalars (|, >), tags, document markers (---).
// ============================================================

type YamlValue =
  | string
  | number
  | boolean
  | null
  | YamlValue[]
  | { [key: string]: YamlValue }

function getIndent(line: string): number {
  let i = 0
  while (i < line.length && line[i] === ' ') i++
  return i
}

/** Strip a trailing " # comment" — only when # is preceded by whitespace or at line start. */
function stripComment(s: string): string {
  let inQuote: '"' | "'" | null = null
  for (let i = 0; i < s.length; i++) {
    const c = s[i]
    if (inQuote) {
      if (c === inQuote) inQuote = null
      continue
    }
    if (c === '"' || c === "'") {
      inQuote = c
      continue
    }
    if (c === '#' && (i === 0 || /\s/.test(s[i - 1]))) {
      return s.slice(0, i).trimEnd()
    }
  }
  return s
}

function parseScalar(raw: string): YamlValue {
  const s = raw.trim()
  if (s === '') return null
  // Quoted strings — strip quotes (no escape handling beyond ""/'' doubling)
  if (s.length >= 2) {
    if (s[0] === '"' && s[s.length - 1] === '"') {
      return s.slice(1, -1).replace(/""/g, '"')
    }
    if (s[0] === "'" && s[s.length - 1] === "'") {
      return s.slice(1, -1).replace(/''/g, "'")
    }
  }
  // Null
  if (/^(null|Null|NULL|~)$/.test(s)) return null
  // Boolean
  if (/^(true|True|TRUE)$/.test(s)) return true
  if (/^(false|False|FALSE)$/.test(s)) return false
  // Integer
  if (/^[+-]?\d+$/.test(s)) {
    const n = parseInt(s, 10)
    if (Number.isSafeInteger(n)) return n
  }
  // Hex / octal
  if (/^0x[0-9a-fA-F]+$/.test(s)) {
    const n = parseInt(s, 10)
    if (Number.isSafeInteger(n)) return n
  }
  // Float
  if (/^[+-]?\d*\.\d+$/.test(s)) return parseFloat(s)
  // Scientific notation
  if (/^[+-]?\d+(\.\d+)?[eE][+-]?\d+$/.test(s)) return parseFloat(s)
  // Infinity / NaN (YAML 1.1)
  if (/^\.inf$/i.test(s)) return s.startsWith('-') ? -Infinity : Infinity
  if (/^\.nan$/i.test(s)) return NaN
  return s
}

/** Find first ": " or trailing ":" that isn't inside quotes. Returns -1 if not found. */
function findColon(s: string): number {
  let inQuote: '"' | "'" | null = null
  for (let i = 0; i < s.length; i++) {
    const c = s[i]
    if (inQuote) {
      if (c === inQuote) inQuote = null
      continue
    }
    if (c === '"' || c === "'") {
      inQuote = c
      continue
    }
    if (c === ':') {
      if (i === s.length - 1 || s[i + 1] === ' ' || s[i + 1] === '\t') {
        return i
      }
    }
  }
  return -1
}

function parseBlock(
  lines: string[],
  start: number,
  indent: number,
): { value: YamlValue; next: number } {
  let i = start
  while (i < lines.length && lines[i].trim() === '') i++
  if (i >= lines.length) return { value: null, next: i }
  const line = lines[i]
  const content = line.trim()
  if (content.startsWith('- ')) {
    return parseSequence(lines, i, indent)
  }
  return parseMap(lines, i, indent)
}

function parseMap(
  lines: string[],
  start: number,
  indent: number,
): { value: YamlValue; next: number } {
  const obj: { [key: string]: YamlValue } = {}
  let i = start
  while (i < lines.length) {
    const line = lines[i]
    const trimmed = line.trim()
    if (trimmed === '' || trimmed.startsWith('#')) {
      i++
      continue
    }
    const curIndent = getIndent(line)
    if (curIndent < indent) break
    if (curIndent > indent) {
      // Unexpected over-indentation — skip defensively
      i++
      continue
    }
    const content = stripComment(trimmed)
    if (content === '') {
      i++
      continue
    }
    const colonIdx = findColon(content)
    if (colonIdx === -1) {
      throw new Error(`Invalid YAML line (no colon): "${line}"`)
    }
    const key = content.slice(0, colonIdx).trim()
    const valuePart = content.slice(colonIdx + 1).trim()
    if (valuePart === '') {
      // Nested block on subsequent lines
      const r = parseBlock(lines, i + 1, indent + 2)
      obj[key] = r.value
      i = r.next
    } else {
      obj[key] = parseScalar(valuePart)
      i++
    }
  }
  return { value: obj, next: i }
}

function parseSequence(
  lines: string[],
  start: number,
  indent: number,
): { value: YamlValue; next: number } {
  const arr: YamlValue[] = []
  let i = start
  while (i < lines.length) {
    const line = lines[i]
    const trimmed = line.trim()
    if (trimmed === '' || trimmed.startsWith('#')) {
      i++
      continue
    }
    const curIndent = getIndent(line)
    if (curIndent < indent) break
    if (curIndent > indent) {
      i++
      continue
    }
    if (!trimmed.startsWith('-')) break
    // Find column where dash sits, then column of first non-space after "-"
    let j = curIndent + 1
    while (j < line.length && line[j] === ' ') j++
    const rest = line.slice(j).trimEnd()
    if (rest === '') {
      // pure "- " — look at next line for nested block
      const r = parseBlock(lines, i + 1, indent + 2)
      arr.push(r.value)
      i = r.next
      continue
    }
    // If the rest looks like "key: value", treat as start of a map at column j
    const colonIdx = findColon(rest)
    if (colonIdx !== -1) {
      // Replace the "-" character with a space, leaving content at column j
      const newLines = [...lines]
      newLines[i] = ' '.repeat(j) + rest
      const r = parseMap(newLines, i, j)
      arr.push(r.value)
      i = r.next
      continue
    }
    // Plain scalar
    arr.push(parseScalar(rest))
    i++
  }
  return { value: arr, next: i }
}

function parseYaml(text: string): YamlValue {
  const rawLines = text.split(/\r\n|\r|\n/)
  const lines: string[] = []
  for (const l of rawLines) {
    if (l.includes('\t')) {
      throw new Error('Tabs are not allowed for indentation in YAML (use 2 spaces)')
    }
    const t = l.trim()
    if (t === '' || t.startsWith('#')) continue
    // Skip document markers (--- / ...)
    if (t === '---' || t === '...') continue
    lines.push(l)
  }
  if (lines.length === 0) return null
  const startIndent = getIndent(lines[0])
  const { value } = parseBlock(lines, 0, startIndent)
  return value
}

// ---------- JSON → YAML ----------

function formatYamlString(s: string): string {
  if (s === '') return '""'
  if (s.includes('\n')) return JSON.stringify(s)
  // Needs quoting if contains special chars or looks like keyword/number
  const needsQuote =
    /^[\s]|[\s]$/.test(s) ||
    /[:#{}\[\],&*!|>'"%@`,]/.test(s) ||
    /^(true|false|null|yes|no|on|off|~)$/i.test(s) ||
    /^[+-]?\d/.test(s) ||
    /^-?\s/.test(s)
  return needsQuote ? JSON.stringify(s) : s
}

function formatYamlKey(k: string): string {
  if (k === '') return '""'
  if (/^[A-Za-z0-9_-]+$/.test(k)) return k
  return JSON.stringify(k)
}

function jsonToYaml(value: unknown, indent = 0): string {
  const pad = ' '.repeat(indent)
  if (value === null || value === undefined) return 'null'
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (typeof value === 'number') {
    if (Number.isFinite(value)) return String(value)
    return 'null'
  }
  if (typeof value === 'string') return formatYamlString(value)

  if (Array.isArray(value)) {
    if (value.length === 0) return '[]'
    const childIndent = indent + 2
    return value
      .map((item) => {
        if (
          item !== null &&
          typeof item === 'object' &&
          !Array.isArray(item) &&
          Object.keys(item as Record<string, unknown>).length > 0
        ) {
          const inner = jsonToYaml(item, childIndent)
          const lines = inner.split('\n')
          const firstContent = lines[0].slice(childIndent)
          const rest = lines.slice(1)
          return `${pad}- ${firstContent}` + (rest.length ? '\n' + rest.join('\n') : '')
        }
        if (Array.isArray(item)) {
          if (item.length === 0) return `${pad}- []`
          const inner = jsonToYaml(item, childIndent)
          const lines = inner.split('\n')
          const firstContent = lines[0].slice(childIndent)
          const rest = lines.slice(1)
          return `${pad}- ${firstContent}` + (rest.length ? '\n' + rest.join('\n') : '')
        }
        return `${pad}- ${jsonToYaml(item, childIndent)}`
      })
      .join('\n')
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
    if (entries.length === 0) return '{}'
    return entries
      .map(([k, v]) => {
        const key = formatYamlKey(k)
        if (v === null || v === undefined) return `${pad}${key}: null`
        if (typeof v === 'object') {
          if (Array.isArray(v)) {
            if (v.length === 0) return `${pad}${key}: []`
            const inner = jsonToYaml(v, indent)
            return `${pad}${key}:\n${inner}`
          }
          const subEntries = Object.entries(v as Record<string, unknown>)
          if (subEntries.length === 0) return `${pad}${key}: {}`
          const inner = jsonToYaml(v, indent + 2)
          return `${pad}${key}:\n${inner}`
        }
        return `${pad}${key}: ${jsonToYaml(v, indent)}`
      })
      .join('\n')
  }

  return String(value)
}

// ============================================================

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

const SAMPLE_YAML = `# Sample YAML config
server:
  host: localhost
  port: 8080
  debug: true
database:
  host: db.example.com
  port: 5432
  name: production
features:
  - auth
  - logging
  - metrics
users:
  - name: Alice
    role: admin
    active: true
  - name: Bob
    role: user
    active: false`

const SAMPLE_JSON = `{
  "server": {
    "host": "localhost",
    "port": 8080,
    "debug": true
  },
  "database": {
    "host": "db.example.com",
    "port": 5432,
    "name": "production"
  },
  "features": ["auth", "logging", "metrics"],
  "users": [
    { "name": "Alice", "role": "admin", "active": true },
    { "name": "Bob", "role": "user", "active": false }
  ]
}`

export default function YamlJsonConverter() {
  const [tab, setTab] = React.useState<'y2j' | 'j2y'>('y2j')

  // YAML → JSON
  const [yamlInput, setYamlInput] = React.useState('')
  const [jsonOutput, setJsonOutput] = React.useState('')
  const [y2jError, setY2jError] = React.useState<string | null>(null)

  // JSON → YAML
  const [jsonInput, setJsonInput] = React.useState('')
  const [yamlOutput, setYamlOutput] = React.useState('')
  const [j2yError, setJ2yError] = React.useState<string | null>(null)

  function runYamlToJson() {
    setY2jError(null)
    if (!yamlInput.trim()) {
      setJsonOutput('')
      toast.info('YAML input is empty')
      return
    }
    try {
      const value = parseYaml(yamlInput)
      setJsonOutput(JSON.stringify(value, null, 2))
      toast.success('Converted YAML → JSON')
    } catch (e) {
      setY2jError((e as Error).message)
      setJsonOutput('')
      toast.error((e as Error).message)
    }
  }

  function runJsonToYaml() {
    setJ2yError(null)
    if (!jsonInput.trim()) {
      setYamlOutput('')
      toast.info('JSON input is empty')
      return
    }
    try {
      const data = JSON.parse(jsonInput)
      setYamlOutput(jsonToYaml(data, 0))
      toast.success('Converted JSON → YAML')
    } catch (e) {
      setJ2yError((e as Error).message)
      setYamlOutput('')
      toast.error((e as Error).message)
    }
  }

  return (
    <div className="space-y-6">
      <ToolCardWrapper>
        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
          <TabsList className="mb-4">
            <TabsTrigger value="y2j" className="gap-1.5">
              <ArrowRight className="h-3.5 w-3.5" />
              YAML → JSON
            </TabsTrigger>
            <TabsTrigger value="j2y" className="gap-1.5">
              <ArrowLeft className="h-3.5 w-3.5" />
              JSON → YAML
            </TabsTrigger>
          </TabsList>

          {/* ===== YAML → JSON ===== */}
          <TabsContent value="y2j">
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <FieldLabel className="mb-0 flex items-center gap-2">
                    <FileCode2 className="h-4 w-4 text-primary" />
                    YAML input
                  </FieldLabel>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => {
                      setYamlInput(SAMPLE_YAML)
                      toast.info('Sample YAML loaded')
                    }}
                  >
                    Load sample
                  </Button>
                </div>
                <Textarea
                  value={yamlInput}
                  onChange={(e) => setYamlInput(e.target.value)}
                  placeholder="key: value"
                  className="min-h-72 font-mono text-sm"
                  spellCheck={false}
                />
                <Button onClick={runYamlToJson} className="w-full gap-1.5">
                  <ArrowRight className="h-4 w-4" />
                  Convert to JSON
                </Button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <FieldLabel className="mb-0 flex items-center gap-2">
                    <FileJson className="h-4 w-4 text-primary" />
                    JSON output
                  </FieldLabel>
                  <div className="flex items-center gap-2">
                    <CopyButton text={jsonOutput} label="" className="px-2.5" />
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      disabled={!jsonOutput}
                      onClick={() => {
                        downloadText(jsonOutput, 'converted.json', 'application/json')
                        toast.success('Downloaded converted.json')
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
                {y2jError && (
                  <p className="text-xs text-destructive">⚠ {y2jError}</p>
                )}
              </div>
            </div>
          </TabsContent>

          {/* ===== JSON → YAML ===== */}
          <TabsContent value="j2y">
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
                  placeholder='{ "key": "value" }'
                  className="min-h-72 font-mono text-sm"
                  spellCheck={false}
                />
                <Button onClick={runJsonToYaml} className="w-full gap-1.5">
                  <ArrowLeft className="h-4 w-4" />
                  Convert to YAML
                </Button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <FieldLabel className="mb-0 flex items-center gap-2">
                    <FileCode2 className="h-4 w-4 text-primary" />
                    YAML output
                  </FieldLabel>
                  <div className="flex items-center gap-2">
                    <CopyButton text={yamlOutput} label="" className="px-2.5" />
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      disabled={!yamlOutput}
                      onClick={() => {
                        downloadText(yamlOutput, 'converted.yaml', 'text/yaml')
                        toast.success('Downloaded converted.yaml')
                      }}
                    >
                      <Download className="h-4 w-4" />
                      YAML
                    </Button>
                  </div>
                </div>
                <Textarea
                  value={yamlOutput}
                  readOnly
                  placeholder="YAML output will appear here..."
                  className="min-h-72 font-mono text-sm"
                  spellCheck={false}
                />
                {j2yError && (
                  <p className="text-xs text-destructive">⚠ {j2yError}</p>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </ToolCardWrapper>

      <ToolCardWrapper>
        <div className="flex items-center gap-2 mb-2">
          <Braces className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Supported YAML subset</h3>
        </div>
        <Separator className="mb-3" />
        <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-5">
          <li>
            Block maps: <code className="font-mono text-xs">key: value</code> with
            arbitrary nesting via <strong>2-space indentation</strong>.
          </li>
          <li>
            Block sequences: <code className="font-mono text-xs">- item</code> —
            including sequences of maps (<code className="font-mono text-xs">- name: ...</code>).
          </li>
          <li>
            Scalars: strings, integers, floats (incl. scientific), booleans
            (<code className="font-mono text-xs">true/false</code>), null
            (<code className="font-mono text-xs">null</code> /{' '}
            <code className="font-mono text-xs">~</code>), and quoted strings
            (<code className="font-mono text-xs">&quot;...&quot;</code> /{' '}
            <code className="font-mono text-xs">&apos;...&apos;</code>).
          </li>
          <li>
            Comments (<code className="font-mono text-xs"># ...</code>) and
            document markers (<code className="font-mono text-xs">---</code>) are
            skipped during parsing.
          </li>
          <li>
            <strong>Not supported:</strong> flow style
            (<code className="font-mono text-xs">[a, b]</code> /{' '}
            <code className="font-mono text-xs">{`{a: b}`}</code>), anchors/aliases
            (<code className="font-mono text-xs">&amp;/*</code>), block scalars
            (<code className="font-mono text-xs">|</code> /{' '}
            <code className="font-mono text-xs">&gt;</code>), multi-document streams,
            and tabs for indentation. Use a full YAML library (js-yaml) if you need these.
          </li>
        </ul>
      </ToolCardWrapper>

      {tab === 'y2j' && !yamlInput && !jsonOutput && (
        <EmptyState message="Paste YAML on the left and click Convert. Click Load sample to try a realistic config." />
      )}
      {tab === 'j2y' && !jsonInput && !yamlOutput && (
        <EmptyState message="Paste JSON on the left and click Convert to get 2-space indented YAML." />
      )}
    </div>
  )
}
