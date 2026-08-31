'use client'

import * as React from 'react'
import {
  Code2,
  Link2,
  Braces,
  Database,
  Regex,
  Terminal,
  ArrowLeftRight,
  Trash2,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  ToolCardWrapper,
  FieldLabel,
  CopyButton,
} from '@/components/tool-page-shell'
import { toast } from 'sonner'

type Mode = 'html' | 'url' | 'json' | 'sql' | 'regex' | 'shell'

const MODES: { id: Mode; name: string; icon: React.ElementType; desc: string }[] = [
  { id: 'html', name: 'HTML', icon: Code2, desc: 'Escape &, <, >, ", \' into HTML entities' },
  { id: 'url', name: 'URL', icon: Link2, desc: 'encodeURIComponent / decodeURIComponent' },
  { id: 'json', name: 'JSON String', icon: Braces, desc: 'Escape quotes, backslashes, control chars' },
  { id: 'sql', name: 'SQL', icon: Database, desc: 'Double single quotes (ANSI SQL standard)' },
  { id: 'regex', name: 'Regex', icon: Regex, desc: 'Escape regex special characters' },
  { id: 'shell', name: 'Shell', icon: Terminal, desc: 'Safe single-quote wrapping for bash' },
]

// ---------- escape / unescape implementations ----------

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
function unescapeHtml(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&#x2[02];/g, '"')
}

function escapeJsonString(s: string): string {
  // Produce the inner contents of a JSON string literal (without surrounding quotes).
  return s
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
    .replace(/\f/g, '\\f')
    .replace(/\b/g, '\\b')
    .replace(/[\u0000-\u001F]/g, (m) => '\\u' + m.charCodeAt(0).toString(16).padStart(4, '0'))
}
function unescapeJsonString(s: string): string {
  // Re-add surrounding quotes and use JSON.parse
  try {
    return JSON.parse('"' + s + '"')
  } catch {
    // Fall back to a regex-based approach for partial unescaping.
    return s
      .replace(/\\"/g, '"')
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '\r')
      .replace(/\\t/g, '\t')
      .replace(/\\f/g, '\f')
      .replace(/\\b/g, '\b')
      .replace(/\\\\/g, '\\')
  }
}

function escapeSql(s: string): string {
  return s.replace(/'/g, "''")
}
function unescapeSql(s: string): string {
  return s.replace(/''/g, "'")
}

const REGEX_SPECIAL = /[.*+?^${}()|[\]\\]/g
function escapeRegex(s: string): string {
  return s.replace(REGEX_SPECIAL, '\\$&')
}
function unescapeRegex(s: string): string {
  // Best-effort: remove backslashes that precede a special char.
  return s.replace(/\\([.*+?^${}()|[\]\\])/g, '$1')
}

function escapeShell(s: string): string {
  // Wrap in single quotes; escape any embedded single quotes via '\'' sequence.
  return "'" + s.replace(/'/g, "'\\''") + "'"
}
function unescapeShell(s: string): string {
  const trimmed = s.trim()
  // If wrapped in single quotes, strip them and reverse the escape.
  if (trimmed.startsWith("'") && trimmed.endsWith("'") && trimmed.length >= 2) {
    return trimmed.slice(1, -1).replace(/'\\''/g, "'")
  }
  // Otherwise just reverse any escape sequences found.
  return trimmed.replace(/'\\''/g, "'")
}

const escapers: Record<Mode, { escape: (s: string) => string; unescape: (s: string) => string }> = {
  html: { escape: escapeHtml, unescape: unescapeHtml },
  url: {
    escape: (s) => encodeURIComponent(s),
    unescape: (s) => decodeURIComponent(s),
  },
  json: { escape: escapeJsonString, unescape: unescapeJsonString },
  sql: { escape: escapeSql, unescape: unescapeSql },
  regex: { escape: escapeRegex, unescape: unescapeRegex },
  shell: { escape: escapeShell, unescape: unescapeShell },
}

function ModePanel({ mode }: { mode: Mode }) {
  const meta = MODES.find((m) => m.id === mode)!
  const [input, setInput] = React.useState('')
  const [output, setOutput] = React.useState('')

  const { escape, unescape } = escapers[mode]

  function doEscape() {
    try {
      setOutput(escape(input))
      toast.success(`${meta.name} escaped`)
    } catch (e) {
      toast.error(`Escape failed: ${(e as Error).message}`)
    }
  }
  function doUnescape() {
    try {
      setOutput(unescape(input))
      toast.success(`${meta.name} unescaped`)
    } catch (e) {
      toast.error(`Unescape failed: ${(e as Error).message}`)
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-border/60 bg-card/50 p-3 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">{meta.name} mode:</span> {meta.desc}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <FieldLabel className="flex items-center justify-between">
            <span>Input</span>
            <span className="text-xs text-muted-foreground">{input.length} chars</span>
          </FieldLabel>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Type or paste text to ${meta.name.toLowerCase()}-escape…`}
            className="min-h-[200px] font-mono text-sm"
            spellCheck={false}
          />
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={doEscape} disabled={!input} className="gap-1.5">
              <ArrowLeftRight className="h-4 w-4 rotate-180" /> Escape →
            </Button>
            <Button size="sm" variant="outline" onClick={doUnescape} disabled={!input} className="gap-1.5">
              ← Unescape
            </Button>
            {input && (
              <Button size="sm" variant="ghost" onClick={() => { setInput(''); setOutput('') }} className="gap-1.5">
                <Trash2 className="h-4 w-4" /> Clear
              </Button>
            )}
          </div>
        </div>
        <div className="space-y-2">
          <FieldLabel className="flex items-center justify-between">
            <span>Output</span>
            {output && <CopyButton text={output} label="Copy" />}
          </FieldLabel>
          <Textarea
            value={output}
            onChange={(e) => setOutput(e.target.value)}
            placeholder="Result will appear here…"
            className="min-h-[200px] font-mono text-sm"
            spellCheck={false}
          />
        </div>
      </div>
    </div>
  )
}

export default function TextEscapeUnescape() {
  const [mode, setMode] = React.useState<Mode>('html')
  return (
    <div className="space-y-6">
      <ToolCardWrapper>
        <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)}>
          <TabsList className="flex flex-wrap h-auto">
            {MODES.map((m) => (
              <TabsTrigger key={m.id} value={m.id} className="gap-1.5">
                <m.icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{m.name}</span>
              </TabsTrigger>
            ))}
          </TabsList>
          {MODES.map((m) => (
            <TabsContent key={m.id} value={m.id} className="mt-4">
              <ModePanel mode={m.id} />
            </TabsContent>
          ))}
        </Tabs>
      </ToolCardWrapper>

      <ToolCardWrapper>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Quick reference</h3>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <RefCard title="HTML entities" items={[
            ['&', '&amp;'],
            ['<', '&lt;'],
            ['>', '&gt;'],
            ['"', '&quot;'],
            ["'", '&#39;'],
          ]} />
          <RefCard title="Regex specials" items={[
            ['.', '\\.'],
            ['*', '\\*'],
            ['+', '\\+'],
            ['?', '\\?'],
            ['^ $', '\\^ \\$'],
            ['( )', '\\( \\)'],
            ['[ ]', '\\[ \\]'],
            ['{ }', '\\{ \\}'],
            ['| \\', '\\| \\\\'],
          ]} />
          <RefCard title="Shell example" items={[
            [`hello`, `'hello'`],
            [`it's`, `'it'\\''s'`],
          ]} />
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          <Badge variant="outline" className="font-mono text-[10px] mr-1">Note</Badge>
          For JSON String mode, the output is the inner contents of a quoted JSON string (no surrounding quotes).
          For URL mode, <code className="font-mono">+</code> in your input is preserved as <code className="font-mono">%2B</code>.
        </p>
      </ToolCardWrapper>
    </div>
  )
}

function RefCard({ title, items }: { title: string; items: [string, string][] }) {
  return (
    <div className="rounded-lg border border-border/60 p-3">
      <p className="text-xs font-semibold mb-2">{title}</p>
      <div className="space-y-1">
        {items.map(([from, to], i) => (
          <div key={i} className="flex items-center gap-2 text-xs font-mono">
            <span className="text-muted-foreground">{from}</span>
            <ArrowLeftRight className="h-3 w-3 text-primary" />
            <span className="text-foreground">{to}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
