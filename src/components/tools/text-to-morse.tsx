'use client'

import * as React from 'react'
import { Eraser, Play, Pause, Square, Radio } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  CopyButton,
  ToolCardWrapper,
  FieldLabel,
} from '@/components/tool-page-shell'
import { toast } from 'sonner'

const MORSE_MAP: Record<string, string> = {
  A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.',
  H: '....', I: '..', J: '.---', K: '-.-', L: '.-..', M: '--', N: '-.',
  O: '---', P: '.--.', Q: '--.-', R: '.-.', S: '...', T: '-', U: '..-',
  V: '...-', W: '.--', X: '-..-', Y: '-.--', Z: '--..',
  '0': '-----', '1': '.----', '2': '..---', '3': '...--', '4': '....-',
  '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.',
  '.': '.-.-.-', ',': '--..--', '?': '..--..', "'": '.----.', '!': '-.-.--',
  '/': '-..-.', '(': '-.--.', ')': '-.--.-', '&': '.-...', ':': '---...',
  ';': '-.-.-.', '=': '-...-', '+': '.-.-.', '-': '-....-', '_': '..--.-',
  '"': '.-..-.', '@': '.--.-.',
}

const REVERSE_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(MORSE_MAP).map(([k, v]) => [v, k])
)

function textToMorse(text: string, letterSep: string, wordSep: string): string {
  if (!text) return ''
  const upper = text.toUpperCase()
  const words = upper.split(/\s+/)
  return words
    .map((word) =>
      Array.from(word)
        .map((ch) => MORSE_MAP[ch] || '')
        .filter(Boolean)
        .join(letterSep)
    )
    .filter(Boolean)
    .join(wordSep)
}

function morseToText(morse: string): string {
  if (!morse) return ''
  // Determine separator — assume '/' or 3+ spaces is word sep, single space is letter sep
  const words = morse
    .replace(/\s{2,}/g, ' / ')
    .split(/\s+\/\s+/)
  return words
    .map((word) =>
      word
        .split(/\s+/)
        .map((code) => REVERSE_MAP[code] || '')
        .filter(Boolean)
        .join('')
    )
    .join(' ')
}

export default function TextToMorse() {
  const [mode, setMode] = React.useState<'encode' | 'decode'>('encode')
  const [text, setText] = React.useState('')
  const [letterSep, setLetterSep] = React.useState(' ')
  const [wordSep, setWordSep] = React.useState(' / ')
  const [wpm, setWpm] = React.useState(15)
  const [pitch, setPitch] = React.useState(600)
  const audioCtxRef = React.useRef<AudioContext | null>(null)
  const playingRef = React.useRef<boolean>(false)
  const stopRef = React.useRef<boolean>(false)
  const [isPlaying, setIsPlaying] = React.useState(false)

  const output = React.useMemo(() => {
    if (mode === 'encode') return textToMorse(text, letterSep, wordSep)
    return morseToText(text)
  }, [text, mode, letterSep, wordSep])

  function getCtx(): AudioContext | null {
    if (typeof window === 'undefined') return null
    if (!audioCtxRef.current) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      audioCtxRef.current = new AC()
    }
    if (audioCtxRef.current.state === 'suspended') {
      void audioCtxRef.current.resume()
    }
    return audioCtxRef.current
  }

  async function playMorse(morseStr: string) {
    if (!morseStr) {
      toast.error('Nothing to play')
      return
    }
    if (isPlaying) {
      stopRef.current = true
      return
    }
    const ctx = getCtx()
    if (!ctx) return
    setIsPlaying(true)
    playingRef.current = true
    stopRef.current = false
    toast.success('Playing Morse audio...')

    // PARIS standard: wpm => dot length in ms = 1200/wpm
    const dotMs = 1200 / wpm
    const dashMs = dotMs * 3
    const symbolGapMs = dotMs
    const letterGapMs = dotMs * 3
    const wordGapMs = dotMs * 7

    let t = ctx.currentTime + 0.05
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = pitch
    gain.gain.value = 0
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()

    for (const ch of morseStr) {
      if (stopRef.current) break
      let durSec = 0
      if (ch === '.') {
        durSec = dotMs / 1000
        gain.gain.setValueAtTime(0.3, t)
        gain.gain.setValueAtTime(0, t + durSec)
        t += durSec + symbolGapMs / 1000
      } else if (ch === '-') {
        durSec = dashMs / 1000
        gain.gain.setValueAtTime(0.3, t)
        gain.gain.setValueAtTime(0, t + durSec)
        t += durSec + symbolGapMs / 1000
      } else if (ch === '/' || (ch === ' ' && letterSep !== ' ')) {
        t += (wordGapMs - symbolGapMs) / 1000
      } else {
        // word gap
        t += (letterGapMs - symbolGapMs) / 1000
      }
      // Wait until next event
      const wait = Math.max(0, (t - ctx.currentTime) * 1000)
      await new Promise((resolve) => setTimeout(resolve, wait))
    }

    const finalWait = Math.max(0, (t - ctx.currentTime) * 1000) + 100
    await new Promise((resolve) => setTimeout(resolve, finalWait))
    osc.stop()
    osc.disconnect()
    gain.disconnect()
    playingRef.current = false
    setIsPlaying(false)
  }

  function stopPlayback() {
    stopRef.current = true
    setIsPlaying(false)
    toast.info('Playback stopped')
  }

  React.useEffect(() => {
    return () => {
      stopRef.current = true
      if (audioCtxRef.current) {
        void audioCtxRef.current.close()
      }
    }
  }, [])

  return (
    <div className="space-y-4">
      <Tabs value={mode} onValueChange={(v) => setMode(v as 'encode' | 'decode')}>
        <TabsList className="grid w-full max-w-xs grid-cols-2">
          <TabsTrigger value="encode" className="gap-1.5">
            <Radio className="h-4 w-4" /> Text → Morse
          </TabsTrigger>
          <TabsTrigger value="decode">Morse → Text</TabsTrigger>
        </TabsList>

        {mode === 'encode' && (
          <ToolCardWrapper className="mt-4">
            <FieldLabel>Separators</FieldLabel>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="lsep" className="text-xs text-muted-foreground">Between letters</Label>
                <input
                  id="lsep"
                  value={letterSep}
                  onChange={(e) => setLetterSep(e.target.value)}
                  className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:ring-[3px] focus-visible:ring-ring/50 outline-none"
                />
              </div>
              <div>
                <Label htmlFor="wsep" className="text-xs text-muted-foreground">Between words</Label>
                <input
                  id="wsep"
                  value={wordSep}
                  onChange={(e) => setWordSep(e.target.value)}
                  className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:ring-[3px] focus-visible:ring-ring/50 outline-none"
                />
              </div>
            </div>
          </ToolCardWrapper>
        )}

        <TabsContent value="encode" className="mt-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <ToolCardWrapper>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <FieldLabel className="mb-0">Text input</FieldLabel>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={!text}
                  onClick={() => setText('')}
                  className="gap-1.5"
                >
                  <Eraser className="h-4 w-4" /> Clear
                </Button>
              </div>
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type text to encode..."
                className="min-h-[200px] resize-y font-mono text-sm"
              />
            </ToolCardWrapper>

            <ToolCardWrapper>
              <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                <FieldLabel className="mb-0">Morse output</FieldLabel>
                <div className="flex gap-2 items-center">
                  {output && (
                    <Badge variant="secondary">{output.length} chars</Badge>
                  )}
                  <CopyButton text={output} />
                </div>
              </div>
              <Textarea
                value={output}
                readOnly
                placeholder=".... . .-.. .-.. ---"
                className="min-h-[200px] resize-y font-mono text-sm bg-muted/40"
              />
            </ToolCardWrapper>
          </div>
        </TabsContent>

        <TabsContent value="decode" className="mt-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <ToolCardWrapper>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <FieldLabel className="mb-0">Morse input</FieldLabel>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={!text}
                  onClick={() => setText('')}
                  className="gap-1.5"
                >
                  <Eraser className="h-4 w-4" /> Clear
                </Button>
              </div>
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder=".... . .-.. .-.. --- / .-- --- .-. .-.. -.."
                className="min-h-[200px] resize-y font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Use space between letters, <code>/</code> between words.
              </p>
            </ToolCardWrapper>

            <ToolCardWrapper>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <FieldLabel className="mb-0">Decoded text</FieldLabel>
                <CopyButton text={output} />
              </div>
              <Textarea
                value={output}
                readOnly
                placeholder="Decoded text..."
                className="min-h-[200px] resize-y font-mono text-sm bg-muted/40"
              />
            </ToolCardWrapper>
          </div>
        </TabsContent>
      </Tabs>

      <ToolCardWrapper>
        <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
          <FieldLabel className="mb-0">Audio playback</FieldLabel>
          <div className="flex gap-2">
            {isPlaying ? (
              <>
                <Button variant="outline" size="sm" onClick={() => playMorse(output)} className="gap-1.5">
                  <Pause className="h-4 w-4" /> Playing...
                </Button>
                <Button variant="destructive" size="sm" onClick={stopPlayback} className="gap-1.5">
                  <Square className="h-4 w-4" /> Stop
                </Button>
              </>
            ) : (
              <Button size="sm" onClick={() => playMorse(output)} disabled={!output} className="gap-1.5">
                <Play className="h-4 w-4" /> Play Morse
              </Button>
            )}
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm">Speed (WPM)</Label>
              <Badge variant="secondary">{wpm} wpm</Badge>
            </div>
            <Slider
              value={[wpm]}
              min={5}
              max={40}
              step={1}
              onValueChange={(v) => setWpm(v[0])}
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm">Tone pitch (Hz)</Label>
              <Badge variant="secondary">{pitch} Hz</Badge>
            </div>
            <Slider
              value={[pitch]}
              min={300}
              max={1000}
              step={50}
              onValueChange={(v) => setPitch(v[0])}
            />
          </div>
        </div>
      </ToolCardWrapper>
    </div>
  )
}
