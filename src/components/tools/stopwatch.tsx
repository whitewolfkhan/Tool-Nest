'use client'

import * as React from 'react'
import { Play, Pause, Flag, RotateCcw, Timer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ToolCardWrapper, FieldLabel } from '@/components/tool-page-shell'

interface Lap {
  lapNumber: number
  lapTime: number // ms since previous lap
  totalTime: number // ms since start
}

function formatTime(ms: number): string {
  const totalMs = Math.floor(ms)
  const minutes = Math.floor(totalMs / 60000)
  const seconds = Math.floor((totalMs % 60000) / 1000)
  const centiseconds = Math.floor((totalMs % 1000) / 10)
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(centiseconds).padStart(2, '0')}`
}

export default function Stopwatch() {
  const [running, setRunning] = React.useState(false)
  const [elapsed, setElapsed] = React.useState(0) // ms accumulated
  const [laps, setLaps] = React.useState<Lap[]>([])

  const startRef = React.useRef(0)
  const rafRef = React.useRef<number | null>(null)

  React.useEffect(() => {
    if (!running) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      return
    }
    startRef.current = performance.now()
    let cancelled = false
    const tick = () => {
      if (cancelled) return
      setElapsed((e) => performance.now() - startRef.current + e)
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      cancelled = true
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [running])

  const startPause = () => setRunning((r) => !r)

  const reset = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    setRunning(false)
    setElapsed(0)
    setLaps([])
  }

  const lap = () => {
    if (!running) return
    const lastTotal = laps.length > 0 ? laps[0].totalTime : 0
    setLaps((ls) =>
      [
        {
          lapNumber: ls.length + 1,
          lapTime: elapsed - lastTotal,
          totalTime: elapsed,
        },
        ...ls,
      ].slice(0, 100)
    )
  }

  // Determine fastest and slowest lap
  const lapStats = React.useMemo(() => {
    if (laps.length < 2) return { fastest: -1, slowest: -1 }
    let fastest = 0
    let slowest = 0
    for (let i = 1; i < laps.length; i++) {
      if (laps[i].lapTime < laps[fastest].lapTime) fastest = i
      if (laps[i].lapTime > laps[slowest].lapTime) slowest = i
    }
    return { fastest, slowest }
  }, [laps])

  return (
    <div className="space-y-4">
      <ToolCardWrapper>
        <div className="flex items-center justify-center gap-2 mb-4">
          <Timer className="h-5 w-5 text-primary" />
          <h2 className="text-base font-semibold">Stopwatch</h2>
        </div>

        <div className="flex flex-col items-center py-6">
          <div
            className="text-6xl sm:text-7xl font-bold tabular-nums font-mono"
            aria-live="polite"
          >
            {formatTime(elapsed)}
          </div>
          <div className="text-xs text-muted-foreground mt-2">
            {running ? 'Running' : elapsed > 0 ? 'Paused' : 'Ready'}
          </div>
        </div>

        <div className="flex justify-center gap-2 flex-wrap">
          <Button
            onClick={startPause}
            size="lg"
            className="gap-2 h-12 px-8"
            variant={running ? 'secondary' : 'default'}
          >
            {running ? (
              <>
                <Pause className="h-5 w-5" /> Pause
              </>
            ) : (
              <>
                <Play className="h-5 w-5" /> {elapsed > 0 ? 'Resume' : 'Start'}
              </>
            )}
          </Button>
          <Button
            onClick={lap}
            disabled={!running}
            variant="outline"
            size="lg"
            className="gap-2 h-12"
          >
            <Flag className="h-5 w-5" /> Lap
          </Button>
          <Button
            onClick={reset}
            disabled={elapsed === 0}
            variant="ghost"
            size="lg"
            className="gap-2 h-12"
          >
            <RotateCcw className="h-5 w-5" /> Reset
          </Button>
        </div>
      </ToolCardWrapper>

      {laps.length > 0 && (
        <ToolCardWrapper>
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <FieldLabel className="mb-0">Laps</FieldLabel>
            <Badge variant="secondary">{laps.length} laps</Badge>
          </div>
          <div className="max-h-[420px] overflow-y-auto pr-1">
            {laps.map((l, i) => {
              const isFastest = i === lapStats.fastest
              const isSlowest = i === lapStats.slowest
              return (
                <div key={l.lapNumber}>
                  <div className="grid grid-cols-3 gap-3 items-center py-2.5 px-1 text-sm hover:bg-accent/30 rounded-md transition-colors">
                    <div className="font-mono text-muted-foreground">
                      Lap {l.lapNumber}
                    </div>
                    <div
                      className={`font-mono text-center ${
                        isFastest
                          ? 'text-emerald-600 font-semibold'
                          : isSlowest
                          ? 'text-rose-600 font-semibold'
                          : ''
                      }`}
                    >
                      {formatTime(l.lapTime)}
                      {isFastest && (
                        <span className="ml-2 text-xs text-emerald-600">
                          fastest
                        </span>
                      )}
                      {isSlowest && (
                        <span className="ml-2 text-xs text-rose-600">
                          slowest
                        </span>
                      )}
                    </div>
                    <div className="font-mono text-right text-muted-foreground">
                      {formatTime(l.totalTime)}
                    </div>
                  </div>
                  {i < laps.length - 1 && <Separator />}
                </div>
              )
            })}
          </div>
        </ToolCardWrapper>
      )}
    </div>
  )
}
