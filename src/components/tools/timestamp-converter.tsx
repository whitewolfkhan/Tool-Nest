'use client'

import * as React from 'react'
import { Clock, RefreshCw, ArrowRight } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CopyButton, ToolCardWrapper, FieldLabel } from '@/components/tool-page-shell'

function relativeTime(date: Date): string {
  const now = Date.now()
  const diff = date.getTime() - now
  const abs = Math.abs(diff)
  const past = diff < 0
  const units: [number, string][] = [
    [1000, 'second'],
    [60 * 1000, 'minute'],
    [60 * 60 * 1000, 'hour'],
    [24 * 60 * 60 * 1000, 'day'],
    [7 * 24 * 60 * 60 * 1000, 'week'],
    [30 * 24 * 60 * 60 * 1000, 'month'],
    [365 * 24 * 60 * 60 * 1000, 'year'],
  ]
  if (abs < 1000) return 'just now'
  let unit = units[0]
  for (const u of units) {
    if (abs >= u[0]) unit = u
  }
  const value = Math.floor(abs / unit[0])
  if (value === 1 && unit[1] === 'second') return past ? '1 second ago' : 'in 1 second'
  return past
    ? `${value} ${unit[1]}${value > 1 ? 's' : ''} ago`
    : `in ${value} ${unit[1]}${value > 1 ? 's' : ''}`
}

function toRFC2822(date: Date): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${days[date.getUTCDay()]}, ${pad(date.getUTCDate())} ${months[date.getUTCMonth()]} ${date.getUTCFullYear()} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())} +0000`
}

interface FormatRow {
  label: string
  value: string
}

export default function TimestampConverter() {
  const [tsInput, setTsInput] = React.useState('')
  const [unit, setUnit] = React.useState<'auto' | 's' | 'ms'>('auto')
  const [dateInput, setDateInput] = React.useState('')
  const [timeInput, setTimeInput] = React.useState('')
  const [now, setNow] = React.useState(Date.now())

  // Tick "now" for relative time
  React.useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  // Resolve timestamp input → Date
  const tsDate = React.useMemo<Date | null>(() => {
    if (!tsInput.trim()) return null
    const num = Number(tsInput.replace(/[^0-9.-]/g, ''))
    if (!Number.isFinite(num)) return null
    let ms: number
    if (unit === 's') ms = num * 1000
    else if (unit === 'ms') ms = num
    else {
      // Auto: 10-digit = seconds, 13-digit = ms
      ms = Math.abs(num) < 1e12 ? num * 1000 : num
    }
    return new Date(ms)
  }, [tsInput, unit])

  // Format rows for the timestamp view
  const tsFormats: FormatRow[] = React.useMemo(() => {
    if (!tsDate) return []
    return [
      { label: 'ISO 8601', value: tsDate.toISOString() },
      { label: 'RFC 2822', value: toRFC2822(tsDate) },
      { label: 'UTC', value: tsDate.toUTCString() },
      { label: 'Local time', value: tsDate.toLocaleString() },
      { label: 'Local date', value: tsDate.toLocaleDateString() },
      { label: 'Local time only', value: tsDate.toLocaleTimeString() },
      { label: 'Relative', value: relativeTime(tsDate) },
      { label: 'Unix seconds', value: Math.floor(tsDate.getTime() / 1000).toString() },
      { label: 'Unix ms', value: tsDate.getTime().toString() },
    ]
    // Re-evaluate every tick (now changes each second) for live relative time
  }, [tsDate, now])

  // Date picker → timestamp
  const dateResult = React.useMemo<{ s: number; ms: number; iso: string } | null>(() => {
    if (!dateInput) return null
    const combined = `${dateInput}T${timeInput || '00:00'}:00`
    const d = new Date(combined)
    if (Number.isNaN(d.getTime())) return null
    return {
      s: Math.floor(d.getTime() / 1000),
      ms: d.getTime(),
      iso: d.toISOString(),
    }
  }, [dateInput, timeInput])

  const setNowTs = () => {
    const ms = Date.now()
    setTsInput(ms.toString())
    setUnit('ms')
  }

  const applyDateToTs = () => {
    if (dateResult) {
      setTsInput(dateResult.s.toString())
      setUnit('s')
    }
  }

  const tsFormatsDisplay = tsFormats
  const todayLocal = new Date(now)
  const todayStr = todayLocal.toISOString().slice(0, 10)

  return (
    <ToolCardWrapper>
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Timestamp → Date */}
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
              <FieldLabel className="mb-0">Unix timestamp</FieldLabel>
              <Button variant="ghost" size="sm" onClick={setNowTs} className="gap-1.5">
                <RefreshCw className="h-4 w-4" /> Now
              </Button>
            </div>
            <div className="flex gap-2">
              <Input
                value={tsInput}
                onChange={(e) => setTsInput(e.target.value)}
                placeholder="1700000000"
                className="font-mono"
                inputMode="numeric"
              />
              <div className="flex gap-1 rounded-md border border-border p-0.5">
                {(['auto', 's', 'ms'] as const).map((u) => (
                  <button
                    key={u}
                    onClick={() => setUnit(u)}
                    className={`px-2.5 py-1 text-xs rounded-sm transition-colors ${
                      unit === u
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-accent'
                    }`}
                  >
                    {u === 'auto' ? 'auto' : u}
                  </button>
                ))}
              </div>
            </div>
            {tsInput && unit === 'auto' && tsDate && (
              <p className="mt-1.5 text-[11px] text-muted-foreground">
                Detected as {Math.abs(Number(tsInput)) < 1e12 ? 'seconds' : 'milliseconds'}.
              </p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" /> Date / time formats
              </h3>
              {tsDate && (
                <Badge variant="outline" className="font-mono text-xs">
                  {relativeTime(tsDate)}
                </Badge>
              )}
            </div>

            {tsFormatsDisplay.length === 0 ? (
              <div className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                Enter a timestamp above to see formatted dates
              </div>
            ) : (
              <ul className="space-y-1.5">
                {tsFormatsDisplay.map((f) => (
                  <li
                    key={f.label}
                    className="rounded-md border border-border bg-muted/30 p-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        {f.label}
                      </span>
                      <CopyButton text={f.value} label="" className="px-2 h-7" />
                    </div>
                    <code className="block mt-1 font-mono text-xs break-all">
                      {f.value}
                    </code>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Date → Timestamp */}
        <div className="space-y-4">
          <div>
            <FieldLabel>Date &amp; time</FieldLabel>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="date"
                value={dateInput}
                onChange={(e) => setDateInput(e.target.value)}
                max={todayStr}
              />
              <Input
                type="time"
                value={timeInput}
                onChange={(e) => setTimeInput(e.target.value)}
              />
            </div>
            {dateResult && (
              <p className="mt-1.5 text-[11px] text-muted-foreground">
                Interpreted as local time ({dateResult.iso} UTC).
              </p>
            )}
          </div>

          {dateResult && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-md border border-border bg-muted/30 p-3">
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    Unix seconds
                  </div>
                  <div className="flex items-center justify-between gap-1 mt-0.5">
                    <code className="font-mono text-sm break-all">{dateResult.s}</code>
                    <CopyButton text={String(dateResult.s)} label="" className="px-2 h-7" />
                  </div>
                </div>
                <div className="rounded-md border border-border bg-muted/30 p-3">
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    Unix milliseconds
                  </div>
                  <div className="flex items-center justify-between gap-1 mt-0.5">
                    <code className="font-mono text-sm break-all">{dateResult.ms}</code>
                    <CopyButton text={String(dateResult.ms)} label="" className="px-2 h-7" />
                  </div>
                </div>
              </div>

              <div className="rounded-md border border-border bg-muted/30 p-3">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  ISO 8601 (UTC)
                </div>
                <div className="flex items-center justify-between gap-2 mt-0.5">
                  <code className="font-mono text-xs break-all">{dateResult.iso}</code>
                  <CopyButton text={dateResult.iso} label="" className="px-2 h-7" />
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={applyDateToTs}
                className="w-full gap-1.5"
              >
                <ArrowRight className="h-4 w-4" /> Send to timestamp field
              </Button>
            </>
          )}

          <div className="rounded-md border border-border bg-muted/20 p-3 text-xs text-muted-foreground space-y-1.5">
            <div className="font-medium text-foreground">Reference</div>
            <div className="flex justify-between font-mono"><span>Now (s)</span><span>{Math.floor(now / 1000)}</span></div>
            <div className="flex justify-between font-mono"><span>Now (ms)</span><span>{now}</span></div>
            <div className="flex justify-between font-mono"><span>Y2K38 limit</span><span>2147483647</span></div>
          </div>
        </div>
      </div>
    </ToolCardWrapper>
  )
}
