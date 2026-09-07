'use client'

import * as React from 'react'
import { AlertTriangle, Eraser } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { CopyButton, ToolCardWrapper, FieldLabel } from '@/components/tool-page-shell'

interface MatchInfo {
  match: string
  index: number
  end: number
  groups: (string | undefined)[]
}

const FLAGS: { id: string; label: string; desc: string }[] = [
  { id: 'g', label: 'g', desc: 'Global — all matches' },
  { id: 'i', label: 'i', desc: 'Case insensitive' },
  { id: 'm', label: 'm', desc: 'Multiline ^/$' },
  { id: 's', label: 's', desc: '. matches newlines' },
  { id: 'u', label: 'u', desc: 'Unicode' },
  { id: 'y', label: 'y', desc: 'Sticky' },
]

function runRegex(pattern: string, flags: string, test: string): { matches: MatchInfo[]; error: string | null } {
  if (!pattern) return { matches: [], error: null }
  try {
    const re = new RegExp(pattern, flags)
    const out: MatchInfo[] = []
    if (flags.includes('g')) {
      let m: RegExpExecArray | null
      // Defensive cap to avoid infinite loops on pathological patterns
      let safety = 0
      while ((m = re.exec(test)) !== null && safety < 10000) {
        out.push({
          match: m[0],
          index: m.index,
          end: m.index + m[0].length,
          groups: m.slice(1),
        })
        if (m[0] === '') re.lastIndex++
        safety++
      }
    } else {
      const m = re.exec(test)
      if (m) {
        out.push({
          match: m[0],
          index: m.index,
          end: m.index + m[0].length,
          groups: m.slice(1),
        })
      }
    }
    return { matches: out, error: null }
  } catch (e) {
    return { matches: [], error: e instanceof Error ? e.message : 'Invalid regex' }
  }
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function renderHighlighted(test: string, matches: MatchInfo[]): React.ReactNode {
  if (matches.length === 0) return <span>{test}</span>
  // Sort by index; ignore zero-length duplicates that may overlap visually
  const sorted = [...matches].sort((a, b) => a.index - b.index)
  const nodes: React.ReactNode[] = []
  let cursor = 0
  let key = 0
  for (const m of sorted) {
    if (m.index < cursor) continue
    if (m.index > cursor) {
      nodes.push(
        <span key={`t-${key++}`} className="whitespace-pre-wrap">
          {test.slice(cursor, m.index)}
        </span>,
      )
    }
    nodes.push(
      <mark
        key={`m-${key++}`}
        className="rounded-sm bg-amber-300/80 dark:bg-amber-500/30 text-foreground px-0.5"
        title={`Match at index ${m.index}`}
      >
        {test.slice(m.index, m.end)}
      </mark>,
    )
    cursor = m.end > m.index ? m.end : m.index + 1
  }
  if (cursor < test.length) {
    nodes.push(
      <span key={`t-${key++}`} className="whitespace-pre-wrap">
        {test.slice(cursor)}
      </span>,
    )
  }
  return nodes
}

export default function RegexTester() {
  const [pattern, setPattern] = React.useState('')
  const [flags, setFlags] = React.useState<Record<string, boolean>>({
    g: true,
    i: false,
    m: false,
    s: false,
    u: false,
    y: false,
  })
  const [testStr, setTestStr] = React.useState('')

  const flagStr = React.useMemo(
    () => Object.entries(flags).filter(([, v]) => v).map(([k]) => k).join(''),
    [flags],
  )

  const { matches, error } = React.useMemo(
    () => runRegex(pattern, flagStr, testStr),
    [pattern, flagStr, testStr],
  )

  return (
    <ToolCardWrapper>
      <div className="space-y-4">
        {/* Pattern + flags */}
        <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
          <div>
            <FieldLabel>Pattern</FieldLabel>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-muted-foreground">/</span>
              <Input
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                placeholder="Enter regex pattern..."
                className="font-mono pl-7 pr-12"
                spellCheck={false}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-muted-foreground">
                /{flagStr}
              </span>
            </div>
          </div>
          <div className="lg:w-56">
            <FieldLabel>Flags</FieldLabel>
            <div className="grid grid-cols-3 gap-1.5">
              {FLAGS.map((f) => (
                <label
                  key={f.id}
                  htmlFor={`flag-${f.id}`}
                  className="flex items-center gap-1.5 rounded-md border border-border px-2 py-1.5 cursor-pointer hover:bg-accent/40 transition-colors"
                  title={f.desc}
                >
                  <Checkbox
                    id={`flag-${f.id}`}
                    checked={flags[f.id]}
                    onCheckedChange={(v) => setFlags((s) => ({ ...s, [f.id]: !!v }))}
                  />
                  <code className="font-mono text-xs">{f.label}</code>
                </label>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2.5 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <div className="font-medium">Invalid regex</div>
              <div className="text-xs mt-0.5 font-mono">{error}</div>
            </div>
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-2">
          {/* Test string */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
              <FieldLabel className="mb-0">Test string</FieldLabel>
              <Button
                variant="ghost"
                size="sm"
                disabled={!testStr}
                onClick={() => setTestStr('')}
                className="gap-1.5"
              >
                <Eraser className="h-4 w-4" /> Clear
              </Button>
            </div>
            <Textarea
              value={testStr}
              onChange={(e) => setTestStr(e.target.value)}
              placeholder="Paste text to test against the pattern..."
              className="min-h-[260px] resize-y font-mono text-sm"
            />
          </div>

          {/* Highlighted result */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <FieldLabel className="mb-0">Highlighted matches</FieldLabel>
              {matches.length > 0 && (
                <Badge variant="secondary" className="font-mono">
                  {matches.length} match{matches.length > 1 ? 'es' : ''}
                </Badge>
              )}
            </div>
            <div className="min-h-[260px] rounded-md border border-border bg-muted/30 p-3 font-mono text-sm overflow-auto whitespace-pre-wrap break-words">
              {testStr ? (
                renderHighlighted(testStr, matches)
              ) : (
                <span className="text-muted-foreground">
                  Matches will be highlighted here...
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Matches list */}
        {matches.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-2">Match details</h3>
            <div className="rounded-md border border-border divide-y divide-border max-h-72 overflow-auto">
              {matches.map((m, i) => (
                <div key={i} className="p-2.5 hover:bg-accent/30 transition-colors">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="font-mono text-[10px]">#{i + 1}</Badge>
                    <Badge variant="secondary" className="font-mono text-[10px]">
                      index {m.index}
                    </Badge>
                    <code className="font-mono text-xs text-foreground truncate">
                      {escapeHtml(m.match) || <span className="text-muted-foreground">(empty)</span>}
                    </code>
                    <CopyButton text={m.match} label="" className="px-2 ml-auto" />
                  </div>
                  {m.groups.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pl-7">
                      {m.groups.map((g, gi) => (
                        <span
                          key={gi}
                          className="rounded border border-border bg-muted/40 px-1.5 py-0.5 font-mono text-[10px]"
                        >
                          <span className="text-muted-foreground">${gi + 1}:</span>{' '}
                          {g !== undefined ? escapeHtml(g) : <span className="text-muted-foreground">(undef)</span>}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </ToolCardWrapper>
  )
}
