'use client'

import * as React from 'react'
import {
  Play,
  Pause,
  RotateCcw,
  Coffee,
  Briefcase,
  Timer as TimerIcon,
  SkipForward,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { ToolCardWrapper, FieldLabel } from '@/components/tool-page-shell'

type Mode = 'work' | 'short' | 'long'

interface Settings {
  work: number
  short: number
  long: number
  interval: number // every N pomodoros → long break
}

const DEFAULT_SETTINGS: Settings = {
  work: 25,
  short: 5,
  long: 15,
  interval: 4,
}

const MODE_META: Record<
  Mode,
  { label: string; color: string; ring: string; icon: typeof Briefcase }
> = {
  work: {
    label: 'Focus',
    color: 'text-rose-600',
    ring: 'stroke-rose-500',
    icon: Briefcase,
  },
  short: {
    label: 'Short Break',
    color: 'text-emerald-600',
    ring: 'stroke-emerald-500',
    icon: Coffee,
  },
  long: {
    label: 'Long Break',
    color: 'text-emerald-700',
    ring: 'stroke-emerald-600',
    icon: Coffee,
  },
}

export default function PomodoroTimer() {
  const [settings, setSettings] = React.useState<Settings>(DEFAULT_SETTINGS)
  const [mode, setMode] = React.useState<Mode>('work')
  const [secondsLeft, setSecondsLeft] = React.useState(
    DEFAULT_SETTINGS.work * 60
  )
  const [running, setRunning] = React.useState(false)
  const [completed, setCompleted] = React.useState(0)
  const intervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null)

  const totalSeconds = settings[mode] * 60
  const progress = totalSeconds > 0 ? (totalSeconds - secondsLeft) / totalSeconds : 0
  const Meta = MODE_META[mode]

  React.useEffect(() => {
    if (!running) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }
    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          // Mode complete — switch automatically
          if (mode === 'work') {
            const newCount = completed + 1
            setCompleted(newCount)
            toast.success('Pomodoro complete! Time for a break.')
            const nextMode: Mode =
              newCount % settings.interval === 0 ? 'long' : 'short'
            setMode(nextMode)
            setRunning(false)
            return settings[nextMode] * 60
          } else {
            toast.info('Break over! Back to work.')
            setMode('work')
            setRunning(false)
            return settings.work * 60
          }
        }
        return s - 1
      })
    }, 1000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [running, mode, completed, settings])

  const switchMode = (m: Mode) => {
    setMode(m)
    setSecondsLeft(settings[m] * 60)
    setRunning(false)
  }

  const startPause = () => setRunning((r) => !r)

  const reset = () => {
    setRunning(false)
    setSecondsLeft(settings[mode] * 60)
  }

  const skip = () => {
    if (mode === 'work') {
      const newCount = completed + 1
      setCompleted(newCount)
      const nextMode: Mode =
        newCount % settings.interval === 0 ? 'long' : 'short'
      setMode(nextMode)
      setSecondsLeft(settings[nextMode] * 60)
    } else {
      setMode('work')
      setSecondsLeft(settings.work * 60)
    }
    setRunning(false)
  }

  const updateSetting = (k: keyof Settings, v: number) => {
    const next = { ...settings, [k]: v }
    setSettings(next)
    if (k === mode) setSecondsLeft(v * 60)
  }

  const fmt = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }

  // SVG ring
  const radius = 110
  const circumference = 2 * Math.PI * radius
  const dashoffset = circumference * (1 - progress)

  return (
    <div className="space-y-4">
      <ToolCardWrapper>
        <div className="flex justify-center gap-2 mb-6 flex-wrap">
          {(Object.keys(MODE_META) as Mode[]).map((m) => {
            const M = MODE_META[m]
            const Icon = M.icon
            return (
              <button
                key={m}
                onClick={() => switchMode(m)}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  mode === m
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-accent'
                }`}
              >
                <Icon className="h-4 w-4" />
                {M.label}
              </button>
            )
          })}
        </div>

        <div className="flex justify-center mb-6">
          <div className="relative h-72 w-72">
            <svg
              className="absolute inset-0 -rotate-90"
              width="100%"
              height="100%"
              viewBox="0 0 240 240"
            >
              <circle
                cx="120"
                cy="120"
                r={radius}
                fill="none"
                className="stroke-muted"
                strokeWidth="14"
              />
              <circle
                cx="120"
                cy="120"
                r={radius}
                fill="none"
                className={Meta.ring}
                strokeWidth="14"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashoffset}
                style={{ transition: 'stroke-dashoffset 1s linear' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className={`text-6xl font-bold tabular-nums ${Meta.color}`}>
                {fmt(secondsLeft)}
              </div>
              <div className="text-sm text-muted-foreground mt-2 uppercase tracking-wide">
                {Meta.label}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-2 flex-wrap">
          <Button onClick={startPause} size="lg" className="gap-2 h-12 px-8">
            {running ? (
              <>
                <Pause className="h-5 w-5" /> Pause
              </>
            ) : (
              <>
                <Play className="h-5 w-5" /> Start
              </>
            )}
          </Button>
          <Button
            onClick={skip}
            variant="outline"
            size="lg"
            className="gap-2 h-12"
          >
            <SkipForward className="h-5 w-5" /> Skip
          </Button>
          <Button
            onClick={reset}
            variant="ghost"
            size="lg"
            className="gap-2 h-12"
          >
            <RotateCcw className="h-5 w-5" /> Reset
          </Button>
        </div>

        <div className="flex justify-center mt-6 gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <TimerIcon className="h-4 w-4 text-primary" />
            <span className="text-sm">
              Completed pomodoros:{' '}
              <strong className="font-semibold">{completed}</strong>
            </span>
          </div>
          <Badge variant="secondary">
            Long break after every {settings.interval}
          </Badge>
        </div>
      </ToolCardWrapper>

      <ToolCardWrapper>
        <h2 className="text-base font-semibold mb-4">Timer Settings</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <FieldLabel>Work duration (minutes)</FieldLabel>
            <Input
              type="number"
              min={1}
              max={120}
              value={settings.work}
              onChange={(e) => updateSetting('work', Number(e.target.value) || 1)}
            />
          </div>
          <div>
            <FieldLabel>Short break (minutes)</FieldLabel>
            <Input
              type="number"
              min={1}
              max={60}
              value={settings.short}
              onChange={(e) => updateSetting('short', Number(e.target.value) || 1)}
            />
          </div>
          <div>
            <FieldLabel>Long break (minutes)</FieldLabel>
            <Input
              type="number"
              min={1}
              max={60}
              value={settings.long}
              onChange={(e) => updateSetting('long', Number(e.target.value) || 1)}
            />
          </div>
          <div>
            <FieldLabel>Long break interval (every N pomodoros)</FieldLabel>
            <Input
              type="number"
              min={2}
              max={10}
              value={settings.interval}
              onChange={(e) => updateSetting('interval', Number(e.target.value) || 1)}
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Changing the duration of the current mode resets its timer.
        </p>
      </ToolCardWrapper>
    </div>
  )
}
