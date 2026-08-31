'use client'

import * as React from 'react'
import {
  Mic,
  Square,
  Copy,
  Trash2,
  Info,
  Check,
  Volume2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
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

// ---- Web Speech API typing helpers ----
interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}
interface SpeechRecognitionResult {
  isFinal: boolean
  length: number
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
}
interface SpeechRecognitionResultList {
  length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}
interface SpeechRecognitionEventLike extends Event {
  resultIndex: number
  results: SpeechRecognitionResultList
}
interface SpeechRecognitionErrorEventLike extends Event {
  error: string
  message: string
}
interface SpeechRecognitionLike {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  start(): void
  stop(): void
  abort(): void
  onresult: ((e: SpeechRecognitionEventLike) => void) | null
  onerror: ((e: SpeechRecognitionErrorEventLike) => void) | null
  onend: (() => void) | null
  onstart: (() => void) | null
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null
  const w = window as any
  return (w.SpeechRecognition || w.webkitSpeechRecognition) ?? null
}

const LANGUAGES: { value: string; label: string }[] = [
  { value: 'en-US', label: 'English (US)' },
  { value: 'en-GB', label: 'English (UK)' },
  { value: 'en-AU', label: 'English (AU)' },
  { value: 'en-IN', label: 'English (India)' },
  { value: 'es-ES', label: 'Spanish (Spain)' },
  { value: 'es-MX', label: 'Spanish (Mexico)' },
  { value: 'fr-FR', label: 'French' },
  { value: 'de-DE', label: 'German' },
  { value: 'it-IT', label: 'Italian' },
  { value: 'pt-BR', label: 'Portuguese (Brazil)' },
  { value: 'pt-PT', label: 'Portuguese (Portugal)' },
  { value: 'nl-NL', label: 'Dutch' },
  { value: 'ru-RU', label: 'Russian' },
  { value: 'pl-PL', label: 'Polish' },
  { value: 'tr-TR', label: 'Turkish' },
  { value: 'ar-SA', label: 'Arabic' },
  { value: 'hi-IN', label: 'Hindi' },
  { value: 'ja-JP', label: 'Japanese' },
  { value: 'ko-KR', label: 'Korean' },
  { value: 'zh-CN', label: 'Chinese (Simplified)' },
  { value: 'zh-TW', label: 'Chinese (Traditional)' },
]

export default function SpeechToText() {
  const [lang, setLang] = React.useState('en-US')
  const [listening, setListening] = React.useState(false)
  const [finalText, setFinalText] = React.useState('')
  const [interimText, setInterimText] = React.useState('')
  const [error, setError] = React.useState<string | null>(null)
  const [copied, setCopied] = React.useState(false)

  const recRef = React.useRef<SpeechRecognitionLike | null>(null)

  const Ctor = getRecognitionCtor()
  const supported = !!Ctor

  const stop = React.useCallback(() => {
    if (recRef.current) {
      try {
        recRef.current.stop()
      } catch {
        // ignore
      }
    }
    setListening(false)
  }, [])

  const start = React.useCallback(() => {
    if (!Ctor) {
      toast.error('Speech recognition not supported in this browser')
      return
    }
    setError(null)
    const rec = new Ctor()
    rec.lang = lang
    rec.continuous = true
    rec.interimResults = true
    rec.maxAlternatives = 1

    rec.onstart = () => {
      setListening(true)
    }
    rec.onerror = (e) => {
      if (e.error === 'no-speech') {
        // benign — keep going
        return
      }
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        setError('Microphone permission denied. Please allow mic access and try again.')
        setListening(false)
        return
      }
      setError(`Recognition error: ${e.error}`)
      setListening(false)
    }
    rec.onend = () => {
      setListening(false)
      setInterimText('')
    }
    rec.onresult = (event) => {
      let interim = ''
      let appended = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        const transcript = result.item(0)?.transcript ?? ''
        if (result.isFinal) {
          appended += transcript
        } else {
          interim += transcript
        }
      }
      if (appended) {
        setFinalText((prev) => {
          const sep = prev && !prev.endsWith(' ') ? ' ' : ''
          return prev + sep + appended.trim()
        })
      }
      setInterimText(interim)
    }

    recRef.current = rec
    try {
      rec.start()
    } catch (err) {
      setError('Failed to start recognition. Try stopping first.')
      setListening(false)
    }
  }, [Ctor, lang])

  React.useEffect(() => {
    return () => {
      if (recRef.current) {
        try {
          recRef.current.abort()
        } catch {
          // ignore
        }
      }
    }
  }, [])

  // Stop listening when language changes mid-session
  React.useEffect(() => {
    if (listening) {
      stop()
    }
  }, [lang, listening, stop])

  const wordCount = finalText.trim() ? finalText.trim().split(/\s+/).length : 0
  const charCount = finalText.length

  const onCopy = async () => {
    if (!finalText) {
      toast.error('Nothing to copy yet')
      return
    }
    try {
      await navigator.clipboard.writeText(finalText)
      setCopied(true)
      toast.success('Transcript copied')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Failed to copy')
    }
  }

  const onClear = () => {
    setFinalText('')
    setInterimText('')
    setError(null)
  }

  return (
    <div className="space-y-6">
      <ToolCardWrapper>
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          {/* Controls */}
          <div className="space-y-4">
            <div>
              <FieldLabel>Language</FieldLabel>
              <Select value={lang} onValueChange={setLang}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a language" />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((l) => (
                    <SelectItem key={l.value} value={l.value}>
                      {l.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <FieldLabel>Microphone</FieldLabel>
              <div className="flex flex-col gap-2">
                {!listening ? (
                  <Button
                    onClick={start}
                    disabled={!supported}
                    className="gap-2 w-full"
                    size="lg"
                  >
                    <Mic className="h-5 w-5" />
                    Start recording
                  </Button>
                ) : (
                  <Button
                    onClick={stop}
                    variant="destructive"
                    className="gap-2 w-full animate-pulse"
                    size="lg"
                  >
                    <Square className="h-4 w-4" />
                    Stop recording
                  </Button>
                )}
              </div>
              {listening && (
                <div className="mt-2 flex items-center gap-2 text-xs text-rose-500">
                  <Volume2 className="h-3.5 w-3.5" />
                  Listening... speak into your microphone
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={onCopy}
                variant="outline"
                disabled={!finalText}
                className="gap-1.5"
                size="sm"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                Copy
              </Button>
              <Button
                onClick={onClear}
                variant="ghost"
                disabled={!finalText && !interimText}
                className="gap-1.5"
                size="sm"
              >
                <Trash2 className="h-4 w-4" />
                Clear
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{wordCount} words</Badge>
              <Badge variant="secondary">{charCount} chars</Badge>
            </div>
          </div>

          {/* Transcript */}
          <div className="space-y-3">
            <FieldLabel>Transcript (editable)</FieldLabel>
            <Textarea
              value={finalText + (interimText ? (finalText && !finalText.endsWith(' ') ? ' ' : '') + interimText : '')}
              onChange={(e) => {
                setFinalText(e.target.value)
                setInterimText('')
              }}
              placeholder="Your transcribed text will appear here. You can also edit it manually."
              rows={12}
              className="resize-y font-mono text-sm"
            />
            {interimText && (
              <div className="text-xs text-muted-foreground">
                <span className="opacity-50">{finalText} </span>
                <span className="italic">{interimText}</span>
                <span className="ml-2 inline-block h-3 w-1.5 animate-pulse bg-primary align-middle" />
              </div>
            )}
            {error && (
              <div className="rounded-md border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-700 dark:text-rose-300">
                <Info className="h-3.5 w-3.5 inline mr-1" />
                {error}
              </div>
            )}
          </div>
        </div>
      </ToolCardWrapper>

      <div className="rounded-lg border border-border bg-muted/30 p-4 text-xs text-muted-foreground">
        <p className="font-semibold text-foreground mb-1 flex items-center gap-1.5">
          <Info className="h-3.5 w-3.5 text-primary" />
          Browser support
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>Chrome &amp; Edge</strong> work best — speech is processed by Google / Microsoft cloud services. Audio leaves your device for transcription.
          </li>
          <li>
            <strong>Firefox</strong> has limited support and may not offer any language in some builds.
          </li>
          <li>
            <strong>Safari</strong> supports dictation on macOS / iOS via the system recognizer.
          </li>
          <li>
            Grant microphone permission when prompted. If permission was denied, you can re-enable it in your browser&apos;s site settings.
          </li>
          <li>
            This tool is 100% client-side: we do not store, send, or save your transcript anywhere on our servers. The browser&apos;s own recognition service handles the audio.
          </li>
        </ul>
      </div>
    </div>
  )
}
