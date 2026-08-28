'use client'

import * as React from 'react'
import { v1 as uuidv1, v4 as uuidv4, validate as uuidValidate, version as uuidVersion } from 'uuid'
import { RefreshCw, Trash2, Hash } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { CopyButton, ToolCardWrapper, FieldLabel } from '@/components/tool-page-shell'
import { toast } from 'sonner'

interface UuidEntry {
  value: string
  createdAt: number
}

export default function UuidGenerator() {
  const [version, setVersion] = React.useState<'v4' | 'v1'>('v4')
  const [count, setCount] = React.useState(5)
  const [entries, setEntries] = React.useState<UuidEntry[]>([])

  const generate = React.useCallback(() => {
    const fn = version === 'v4' ? uuidv4 : uuidv1
    const next: UuidEntry[] = []
    for (let i = 0; i < count; i++) {
      next.push({ value: fn(), createdAt: Date.now() })
    }
    setEntries(next)
    toast.success(`Generated ${count} UUID${count > 1 ? 's' : ''}`)
  }, [version, count])

  // Generate on mount with defaults
  React.useEffect(() => {
    setEntries([
      { value: uuidv4(), createdAt: Date.now() },
      { value: uuidv4(), createdAt: Date.now() },
      { value: uuidv4(), createdAt: Date.now() },
    ])
  }, [])

  const allText = entries.map((e) => e.value).join('\n')

  return (
    <ToolCardWrapper>
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* Controls */}
        <div className="space-y-4">
          <div>
            <FieldLabel>UUID version</FieldLabel>
            <Tabs value={version} onValueChange={(v) => setVersion(v as 'v4' | 'v1')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="v4">v4 (random)</TabsTrigger>
                <TabsTrigger value="v1">v1 (time)</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div>
            <FieldLabel>How many UUIDs</FieldLabel>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={1}
                max={100}
                value={count}
                onChange={(e) => {
                  const n = Math.max(1, Math.min(100, Number(e.target.value) || 1))
                  setCount(n)
                }}
                className="w-24"
              />
              <span className="text-xs text-muted-foreground">1–100</span>
            </div>
          </div>

          <Button onClick={generate} className="w-full gap-2">
            <RefreshCw className="h-4 w-4" /> Generate
          </Button>

          <Button
            variant="outline"
            onClick={() => {
              setEntries([])
            }}
            className="w-full gap-2"
            disabled={!entries.length}
          >
            <Trash2 className="h-4 w-4" /> Clear list
          </Button>

          {entries.length > 0 && (
            <div className="rounded-md border border-border bg-muted/30 p-3 text-xs text-muted-foreground space-y-1">
              <div className="flex items-center justify-between">
                <span>Generated</span>
                <Badge variant="secondary" className="font-mono">{entries.length}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Last batch</span>
                <span className="font-mono">
                  {new Date(entries[entries.length - 1].createdAt).toLocaleTimeString()}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Output list */}
        <div>
          <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Hash className="h-4 w-4 text-primary" /> Generated UUIDs
            </h3>
            <CopyButton text={allText} label="Copy all" />
          </div>

          {entries.length === 0 ? (
            <div className="rounded-md border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              No UUIDs yet. Click <span className="font-medium">Generate</span>.
            </div>
          ) : (
            <ScrollArea className="h-[460px] rounded-md border border-border">
              <ul className="divide-y divide-border">
                {entries.map((e, i) => {
                  const valid = uuidValidate(e.value)
                  const ver = uuidVersion(e.value)
                  return (
                    <li
                      key={i}
                      className="flex items-center gap-3 px-3 py-2 hover:bg-accent/40 transition-colors"
                    >
                      <span className="text-xs font-mono text-muted-foreground w-8 shrink-0 text-right">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <code className="flex-1 font-mono text-sm break-all">{e.value}</code>
                      <Badge variant="outline" className="font-mono text-[10px] shrink-0">
                        v{ver}
                      </Badge>
                      {!valid && (
                        <Badge variant="destructive" className="text-[10px]">invalid</Badge>
                      )}
                      <span className="text-[10px] text-muted-foreground shrink-0 font-mono hidden sm:inline">
                        {new Date(e.createdAt).toLocaleTimeString()}
                      </span>
                      <CopyButton text={e.value} label="" className="px-2 shrink-0" />
                    </li>
                  )
                })}
              </ul>
            </ScrollArea>
          )}
        </div>
      </div>
    </ToolCardWrapper>
  )
}
