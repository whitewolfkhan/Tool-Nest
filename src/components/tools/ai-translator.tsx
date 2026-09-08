'use client'

import * as React from 'react'
import { Sparkles, Languages, ArrowRight, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
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
  EmptyState,
  CopyButton,
} from '@/components/tool-page-shell'
import { toast } from 'sonner'

type LangCode =
  | 'en'
  | 'zh'
  | 'es'
  | 'fr'
  | 'de'
  | 'it'
  | 'pt'
  | 'ru'
  | 'ja'
  | 'ko'
  | 'ar'
  | 'hi'
  | 'bn'
  | 'tr'
  | 'vi'
  | 'th'
  | 'id'
  | 'pl'
  | 'nl'
  | 'sv'
  | 'uk'

const LANGUAGES: { code: LangCode; name: string; native: string }[] = [
  { code: 'en', name: 'English', native: 'English' },
  { code: 'zh', name: 'Chinese', native: '中文' },
  { code: 'es', name: 'Spanish', native: 'Español' },
  { code: 'fr', name: 'French', native: 'Français' },
  { code: 'de', name: 'German', native: 'Deutsch' },
  { code: 'it', name: 'Italian', native: 'Italiano' },
  { code: 'pt', name: 'Portuguese', native: 'Português' },
  { code: 'ru', name: 'Russian', native: 'Русский' },
  { code: 'ja', name: 'Japanese', native: '日本語' },
  { code: 'ko', name: 'Korean', native: '한국어' },
  { code: 'ar', name: 'Arabic', native: 'العربية' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা' },
  { code: 'tr', name: 'Turkish', native: 'Türkçe' },
  { code: 'vi', name: 'Vietnamese', native: 'Tiếng Việt' },
  { code: 'th', name: 'Thai', native: 'ไทย' },
  { code: 'id', name: 'Indonesian', native: 'Bahasa Indonesia' },
  { code: 'pl', name: 'Polish', native: 'Polski' },
  { code: 'nl', name: 'Dutch', native: 'Nederlands' },
  { code: 'sv', name: 'Swedish', native: 'Svenska' },
  { code: 'uk', name: 'Ukrainian', native: 'Українська' },
]

const AUTO = 'auto'

const MAX_INPUT = 5000

function Spinner() {
  return (
    <span
      aria-hidden
      className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
    />
  )
}

function langName(code: string): string {
  return LANGUAGES.find((l) => l.code === code)?.name ?? code.toUpperCase()
}

export default function AiTranslator() {
  const [text, setText] = React.useState('')
  const [target, setTarget] = React.useState<LangCode>('en')
  const [source, setSource] = React.useState<string>(AUTO)
  const [loading, setLoading] = React.useState(false)
  const [translation, setTranslation] = React.useState('')
  const [detectedSource, setDetectedSource] = React.useState<string | undefined>(
    undefined
  )
  const [error, setError] = React.useState<string | null>(null)

  async function translate() {
    const trimmed = text.trim()
    if (!trimmed) {
      setError('Please enter text to translate.')
      return
    }
    setError(null)
    setLoading(true)
    setTranslation('')
    setDetectedSource(undefined)
    try {
      const payload: { text: string; target: string; source?: string } = {
        text: trimmed,
        target,
      }
      if (source !== AUTO) payload.source = source
      const res = await fetch('/api/ai/translator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to translate')
      }
      if (!data.translation) {
        throw new Error('No translation returned')
      }
      setTranslation(data.translation)
      setDetectedSource(data.detectedSource)
    } catch (e) {
      setError((e as Error).message || 'Failed to translate text')
      toast.error((e as Error).message || 'Failed to translate text')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <ToolCardWrapper>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel>From</FieldLabel>
            <Select value={source} onValueChange={(v) => setSource(v)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Auto-detect" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={AUTO}>Auto-detect</SelectItem>
                {LANGUAGES.map((l) => (
                  <SelectItem key={l.code} value={l.code}>
                    {l.name} · {l.native}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <FieldLabel>To</FieldLabel>
            <Select value={target} onValueChange={(v) => setTarget(v as LangCode)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select target" />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((l) => (
                  <SelectItem key={l.code} value={l.code}>
                    {l.name} · {l.native}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-4">
          <FieldLabel>Text to translate</FieldLabel>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type or paste text here..."
            rows={5}
            maxLength={MAX_INPUT}
            disabled={loading}
            className="resize-y"
          />
          <div className="mt-1 flex justify-between text-xs text-muted-foreground">
            <span>{text.length.toLocaleString()} characters</span>
            <span>Max {MAX_INPUT.toLocaleString()}</span>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 flex-wrap">
          <Button
            onClick={translate}
            disabled={loading || !text.trim()}
            size="lg"
          >
            {loading ? (
              <>
                <Spinner />
                Translating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Translate
              </>
            )}
          </Button>
          {translation && !loading && (
            <Button
              variant="outline"
              size="lg"
              onClick={() => {
                setTranslation('')
                setDetectedSource(undefined)
                setError(null)
              }}
            >
              <RefreshCw className="h-4 w-4" />
              Clear
            </Button>
          )}
          <div className="flex items-center gap-2 text-xs text-muted-foreground ml-auto">
            <span className="font-medium">{langName(source === AUTO ? 'en' : source)}</span>
            <ArrowRight className="h-3 w-3" />
            <span className="font-medium">{langName(target)}</span>
          </div>
        </div>

        {error && (
          <p className="mt-3 text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
      </ToolCardWrapper>

      {loading && (
        <ToolCardWrapper>
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">Translating...</p>
          </div>
        </ToolCardWrapper>
      )}

      {translation && !loading && (
        <ToolCardWrapper>
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Languages className="h-4 w-4 text-primary" />
              Translation
            </h3>
            <div className="flex items-center gap-2 flex-wrap">
              {detectedSource && source === AUTO && (
                <Badge variant="secondary">
                  Auto-detected: {langName(detectedSource)} ({detectedSource})
                </Badge>
              )}
              <Badge variant="outline">{langName(target)}</Badge>
              <CopyButton text={translation} label="Copy" />
            </div>
          </div>
          <Card className="p-4 bg-background/50">
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
              {translation}
            </p>
          </Card>
        </ToolCardWrapper>
      )}

      {!translation && !loading && (
        <EmptyState message="Pick your languages, enter text above, and click Translate to see the result here." />
      )}
    </div>
  )
}
