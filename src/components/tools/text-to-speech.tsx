'use client'

import * as React from 'react'
import {
  Play,
  Pause,
  Square,
  Volume2,
  Gauge,
  Music2,
  Mic2,
  Info,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
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
} from '@/components/tool-page-shell'
import { toast } from 'sonner'

// Minimal type for SpeechSynthesisUtterance boundary event
interface BoundaryEvent {
  charIndex: number
  charLength?: number
  elapsedTime?: number
  name?: string
}

const DEFAULT_TEXT =
  'Welcome to ToolNest. Type or paste any text here, pick a voice, then press Play to hear it spoken aloud. Your browser turns the text into speech entirely on your device — nothing is uploaded.'

export default function TextToSpeech() {
  const [text, setText] = React.useState(DEFAULT_TEXT)
  const [voices, setVoices] = React.useState<SpeechSynthesisVoice[]>([])
  const [voiceURI, setVoiceURI] = React.useState<string>('')
  const [rate, setRate] = React.useState(1)
  const [pitch, setPitch] = React.useState(1)
  const [volume, setVolume] = React.useState(1)
  const [status, setStatus] = React.useState<'idle' | 'playing' | 'paused'>('idle')
  const [highlightRange, setHighlightRange] = React.useState<[number, number] | null>(null)

  const utterRef = React.useRef<SpeechSynthesisUtterance | null>(null)

  // Load voices (async on some browsers)
  React.useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    const load = () => {
      const v = window.speechSynthesis.getVoices()
      if (v.length > 0) {
        setVoices(v)
        if (!voiceURI && v.length > 0) {
          // Prefer an English voice if available
          const defaultVoice =
            v.find((x) => x.default) ||
            v.find((x) => x.lang.startsWith('en')) ||
            v[0]
          setVoiceURI(defaultVoice.voiceURI)
        }
      }
    }
    load()
    window.speechSynthesis.onvoiceschanged = load
    return () => {
      window.speechSynthesis.onvoiceschanged = null
      try {
        window.speechSynthesis.cancel()
      } catch {
        // ignore
      }
    }
  }, [])

  const supported =
    typeof window !== 'undefined' && 'speechSynthesis' in window

  const charCount = text.length
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0
  const maxChars = 4000

  const speak = () => {
    if (!supported) {
      toast.error('Your browser does not support speech synthesis.')
      return
    }
    if (!text.trim()) {
      toast.error('Please enter some text to speak')
      return
    }
    try {
      window.speechSynthesis.cancel()
      const u = new SpeechSynthesisUtterance(text.slice(0, maxChars))
      const voice = voices.find((v) => v.voiceURI === voiceURI)
      if (voice) {
        u.voice = voice
        u.lang = voice.lang
      }
      u.rate = rate
      u.pitch = pitch
      u.volume = volume
      u.onstart = () => setStatus('playing')
      u.onend = () => {
        setStatus('idle')
        setHighlightRange(null)
      }
      u.onerror = (e) => {
        console.error('speech error', e)
        setStatus('idle')
        setHighlightRange(null)
      }
      u.onboundary = (e: any) => {
        const ev = e as BoundaryEvent
        if (typeof ev.charIndex === 'number') {
          setHighlightRange([ev.charIndex, ev.charIndex + (ev.charLength ?? 1)])
        }
      }
      utterRef.current = u
      window.speechSynthesis.speak(u)
    } catch (err) {
      console.error(err)
      toast.error('Failed to start speech')
    }
  }

  const pause = () => {
    if (!supported) return
    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause()
      setStatus('paused')
    }
  }

  const resume = () => {
    if (!supported) return
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume()
      setStatus('playing')
    }
  }

  const stop = () => {
    if (!supported) return
    window.speechSynthesis.cancel()
    setStatus('idle')
    setHighlightRange(null)
  }

  // Render the text with the highlighted range shown
  const renderText = () => {
    if (!highlightRange) return text
    const [start, end] = highlightRange
    return (
      <>
        {text.slice(0, start)}
        <mark className="rounded-sm bg-primary/30 px-0.5 text-foreground">
          {text.slice(start, end)}
        </mark>
        {text.slice(end)}
      </>
    )
  }

  const selectedVoice = voices.find((v) => v.voiceURI === voiceURI)

  return (
    <div className="space-y-6">
      <ToolCardWrapper>
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left: Text + controls */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <FieldLabel className="mb-0">Text to speak</FieldLabel>
                <span className="text-xs text-muted-foreground">
                  {charCount} / {maxChars} chars · {wordCount} words
                </span>
              </div>
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type or paste text here..."
                rows={8}
                className="resize-y font-mono text-sm"
                maxLength={maxChars}
              />
              {status === 'playing' || status === 'paused' ? (
                <div className="mt-2 max-h-32 overflow-y-auto rounded-md border border-border bg-muted/30 p-3 text-sm leading-relaxed">
                  {renderText()}
                </div>
              ) : null}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <Button
                onClick={status === 'paused' ? resume : speak}
                disabled={!supported || status === 'playing' || !text.trim()}
                className="gap-1.5"
              >
                <Play className="h-4 w-4" />
                {status === 'paused' ? 'Resume' : 'Play'}
              </Button>
              <Button
                onClick={pause}
                disabled={!supported || status !== 'playing'}
                variant="outline"
                className="gap-1.5"
              >
                <Pause className="h-4 w-4" />
                Pause
              </Button>
              <Button
                onClick={stop}
                disabled={!supported || status === 'idle'}
                variant="outline"
                className="gap-1.5"
              >
                <Square className="h-4 w-4" />
                Stop
              </Button>
              <Button
                onClick={() => setText('')}
                variant="ghost"
                className="gap-1.5"
                disabled={!text}
              >
                Clear
              </Button>
            </div>

            {!supported && (
              <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300">
                <Info className="h-3.5 w-3.5 inline mr-1" />
                Your browser does not support the Web Speech API. Try Chrome, Edge, or Safari.
              </div>
            )}
          </div>

          {/* Right: Voice settings */}
          <div className="space-y-5">
            <div>
              <FieldLabel>Voice</FieldLabel>
              <Select value={voiceURI} onValueChange={setVoiceURI}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a voice" />
                </SelectTrigger>
                <SelectContent>
                  {voices.map((v) => (
                    <SelectItem key={v.voiceURI} value={v.voiceURI}>
                      {v.name} ({v.lang})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedVoice && (
                <div className="mt-2 flex flex-wrap gap-1">
                  <Badge variant="secondary">{selectedVoice.lang}</Badge>
                  {selectedVoice.localService && (
                    <Badge variant="outline">Local</Badge>
                  )}
                  {selectedVoice.default && (
                    <Badge variant="outline">Default</Badge>
                  )}
                </div>
              )}
            </div>

            <div>
              <FieldLabel>
                <span className="flex items-center gap-1.5">
                  <Gauge className="h-3.5 w-3.5" />
                  Rate: {rate.toFixed(2)}×
                </span>
              </FieldLabel>
              <Slider
                min={0.5}
                max={2}
                step={0.05}
                value={[rate]}
                onValueChange={(v) => setRate(v[0] ?? 1)}
              />
              <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
                <span>0.5× slow</span>
                <span>1× normal</span>
                <span>2× fast</span>
              </div>
            </div>

            <div>
              <FieldLabel>
                <span className="flex items-center gap-1.5">
                  <Music2 className="h-3.5 w-3.5" />
                  Pitch: {pitch.toFixed(2)}
                </span>
              </FieldLabel>
              <Slider
                min={0}
                max={2}
                step={0.05}
                value={[pitch]}
                onValueChange={(v) => setPitch(v[0] ?? 1)}
              />
              <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
                <span>low</span>
                <span>normal</span>
                <span>high</span>
              </div>
            </div>

            <div>
              <FieldLabel>
                <span className="flex items-center gap-1.5">
                  <Volume2 className="h-3.5 w-3.5" />
                  Volume: {Math.round(volume * 100)}%
                </span>
              </FieldLabel>
              <Slider
                min={0}
                max={1}
                step={0.05}
                value={[volume]}
                onValueChange={(v) => setVolume(v[0] ?? 1)}
              />
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Mic2 className="h-3.5 w-3.5" />
              {voices.length} voices available
            </div>
          </div>
        </div>
      </ToolCardWrapper>

      <div className="rounded-lg border border-border bg-muted/30 p-4 text-xs text-muted-foreground">
        <p className="font-semibold text-foreground mb-1 flex items-center gap-1.5">
          <Info className="h-3.5 w-3.5 text-primary" />
          Notes &amp; limitations
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            All synthesis runs locally via the browser&apos;s Web Speech API — your text never leaves your device.
          </li>
          <li>
            Voice list depends on your operating system and browser. Install more voices in your OS settings.
          </li>
          <li>
            Downloading the spoken audio as a file is not supported by the Web Speech API. To record output, use a system-level audio capture tool.
          </li>
          <li>
            Word highlighting uses the <code className="font-mono">onboundary</code> event, which works in Chrome and Edge.
          </li>
        </ul>
      </div>
    </div>
  )
}
