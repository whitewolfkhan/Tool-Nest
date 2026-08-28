'use client'

import * as React from 'react'
import { Bot, Plus, Trash2, RotateCcw } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
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
  DownloadButton,
  ToolCardWrapper,
  FieldLabel,
} from '@/components/tool-page-shell'

interface Rule {
  id: string
  userAgent: string
  rule: 'allow' | 'disallow'
  paths: string
}

let counter = 0
function newId() {
  counter += 1
  return `rule-${counter}-${Math.random().toString(36).slice(2, 6)}`
}

const DEFAULT_RULES: Rule[] = [
  {
    id: newId(),
    userAgent: '*',
    rule: 'allow',
    paths: '/',
  },
  {
    id: newId(),
    userAgent: 'Googlebot',
    rule: 'disallow',
    paths: '/private/',
  },
]

interface GlobalSettings {
  allowAll: boolean
  sitemap: string
  crawlDelay: string
}

function buildRobotsTxt(
  rules: Rule[],
  settings: GlobalSettings
): string {
  const lines: string[] = []
  if (settings.allowAll) {
    lines.push('User-agent: *')
    lines.push('Allow: /')
    lines.push('')
  }
  for (const r of rules) {
    if (settings.allowAll && r.userAgent === '*' && r.rule === 'allow')
      continue
    lines.push(`User-agent: ${r.userAgent || '*'}`)
    if (r.rule === 'allow') {
      const paths = r.paths
        .split('\n')
        .map((p) => p.trim())
        .filter(Boolean)
      if (paths.length === 0) paths.push('/')
      for (const p of paths) lines.push(`Allow: ${p}`)
    } else {
      const paths = r.paths
        .split('\n')
        .map((p) => p.trim())
        .filter(Boolean)
      if (paths.length === 0) paths.push('/')
      for (const p of paths) lines.push(`Disallow: ${p}`)
    }
    lines.push('')
  }
  if (settings.crawlDelay) {
    lines.push(`Crawl-delay: ${settings.crawlDelay}`)
    lines.push('')
  }
  if (settings.sitemap) {
    lines.push(`Sitemap: ${settings.sitemap}`)
  }
  return lines.join('\n').trim()
}

export default function RobotsTxtGenerator() {
  const [rules, setRules] = React.useState<Rule[]>(DEFAULT_RULES)
  const [settings, setSettings] = React.useState<GlobalSettings>({
    allowAll: false,
    sitemap: 'https://example.com/sitemap.xml',
    crawlDelay: '',
  })

  const output = React.useMemo(
    () => buildRobotsTxt(rules, settings),
    [rules, settings]
  )

  const updateRule = (id: string, patch: Partial<Rule>) => {
    setRules((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }

  const addRule = () => {
    setRules((rs) => [
      ...rs,
      { id: newId(), userAgent: '*', rule: 'disallow', paths: '/' },
    ])
  }

  const removeRule = (id: string) => {
    setRules((rs) => rs.filter((r) => r.id !== id))
  }

  const downloadRobots = () => {
    const blob = new Blob([output], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'robots.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      <ToolCardWrapper>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            <h2 className="text-base font-semibold">Global Settings</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setRules(DEFAULT_RULES)
              setSettings({
                allowAll: false,
                sitemap: 'https://example.com/sitemap.xml',
                crawlDelay: '',
              })
            }}
            className="gap-1.5"
          >
            <RotateCcw className="h-4 w-4" /> Reset
          </Button>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="flex items-center justify-between rounded-lg border border-border p-3 sm:col-span-2">
            <div>
              <Label htmlFor="allowAll" className="text-sm">
                Allow all crawlers by default
              </Label>
              <p className="text-xs text-muted-foreground">
                Adds <code>User-agent: * / Allow: /</code> at the top
              </p>
            </div>
            <Switch
              id="allowAll"
              checked={settings.allowAll}
              onCheckedChange={(v) =>
                setSettings({ ...settings, allowAll: v })
              }
            />
          </div>
          <div>
            <FieldLabel>Sitemap URL</FieldLabel>
            <Input
              value={settings.sitemap}
              onChange={(e) =>
                setSettings({ ...settings, sitemap: e.target.value })
              }
              placeholder="https://example.com/sitemap.xml"
            />
          </div>
          <div>
            <FieldLabel>Crawl-delay (seconds)</FieldLabel>
            <Input
              type="number"
              min={0}
              step={1}
              value={settings.crawlDelay}
              onChange={(e) =>
                setSettings({ ...settings, crawlDelay: e.target.value })
              }
              placeholder="e.g. 10 (optional)"
            />
          </div>
        </div>
      </ToolCardWrapper>

      <ToolCardWrapper>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h2 className="text-base font-semibold">User-agent Rules</h2>
          <Button onClick={addRule} size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" /> Add Rule
          </Button>
        </div>
        <div className="space-y-3">
          {rules.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">
              No rules yet. Click “Add Rule” to begin.
            </p>
          )}
          {rules.map((r) => (
            <div
              key={r.id}
              className="rounded-lg border border-border p-3 grid sm:grid-cols-[1fr_auto_2fr_auto] gap-3 items-start"
            >
              <div>
                <Label className="text-xs text-muted-foreground">
                  User-agent
                </Label>
                <Input
                  value={r.userAgent}
                  onChange={(e) => updateRule(r.id, { userAgent: e.target.value })}
                  placeholder="* or Googlebot"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Action</Label>
                <Select
                  value={r.rule}
                  onValueChange={(v: 'allow' | 'disallow') =>
                    updateRule(r.id, { rule: v })
                  }
                >
                  <SelectTrigger className="w-[130px] mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="allow">Allow</SelectItem>
                    <SelectItem value="disallow">Disallow</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">
                  Paths (one per line)
                </Label>
                <textarea
                  value={r.paths}
                  onChange={(e) => updateRule(r.id, { paths: e.target.value })}
                  placeholder={'/\n/private/\n/tmp/'}
                  className="mt-1 flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono resize-y focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeRule(r.id)}
                aria-label="Remove rule"
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </ToolCardWrapper>

      <ToolCardWrapper>
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <FieldLabel className="mb-0">robots.txt Preview</FieldLabel>
            <Badge variant="secondary">{rules.length} rules</Badge>
          </div>
          <div className="flex gap-2">
            <CopyButton text={output} />
            <DownloadButton onClick={downloadRobots} label="Download" />
          </div>
        </div>
        <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-xs leading-relaxed font-mono whitespace-pre max-h-96 overflow-y-auto">
          <code>{output}</code>
        </pre>
      </ToolCardWrapper>
    </div>
  )
}
