'use client'

import * as React from 'react'
import { Sparkles, FileText, ListChecks, RefreshCw } from 'lucide-react'
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

type Length = 'short' | 'medium' | 'long'

const LENGTH_OPTIONS: { value: Length; label: string }[] = [
  { value: 'short', label: 'Short (1-2 sentences)' },
  { value: 'medium', label: 'Medium (3-5 sentences)' },
  { value: 'long', label: 'Long (full paragraph)' },
]

const MAX_INPUT = 12000

function Spinner() {
  return (
    <span
      aria-hidden
      className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
    />
  )
}

interface SummarizerResult {
  summary: string
  keyPoints: string[]
}

export default function AiSummarizer() {
  const [text, setText] = React.useState('')
  const [length, setLength] = React.useState<Length>('medium')
  const [loading, setLoading] = React.useState(false)
  const [result, setResult] = React.useState<SummarizerResult | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  async function summarize() {
    const trimmed = text.trim()
    if (!trimmed) {
      setError('Please paste some text to summarize.')
      return
    }
    if (trimmed.length < 50) {
      setError('Text is too short to summarize meaningfully (minimum 50 characters).')
      return
    }
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/ai/summarizer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: trimmed, length }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to summarize')
      }
      const summary: string = data.summary ?? ''
      const keyPoints: string[] = Array.isArray(data.keyPoints)
        ? data.keyPoints.filter((p: unknown) => typeof p === 'string' && p)
        : []
      if (!summary) {
        throw new Error('No summary returned')
      }
      setResult({ summary, keyPoints })
    } catch (e) {
      setError((e as Error).message || 'Failed to summarize text')
      toast.error((e as Error).message || 'Failed to summarize text')
    } finally {
      setLoading(false)
    }
  }

  function copyKeyPoints() {
    if (!result?.keyPoints?.length) return
    const text = result.keyPoints.map((p) => `• ${p}`).join('\n')
    navigator.clipboard
      .writeText(text)
      .then(() => toast.success('Key points copied'))
      .catch(() => toast.error('Failed to copy'))
  }

  return (
    <div className="space-y-6">
      <ToolCardWrapper>
        <FieldLabel>Text to summarize</FieldLabel>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste an article, document, or any long-form text here..."
          rows={8}
          maxLength={MAX_INPUT}
          disabled={loading}
          className="resize-y"
        />
        <div className="mt-1 flex justify-between text-xs text-muted-foreground">
          <span>{text.length.toLocaleString()} characters</span>
          <span>Max {MAX_INPUT.toLocaleString()}</span>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
          <div>
            <FieldLabel>Summary length</FieldLabel>
            <Select value={length} onValueChange={(v) => setLength(v as Length)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Length" />
              </SelectTrigger>
              <SelectContent>
                {LENGTH_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={summarize}
              disabled={loading || !text.trim()}
              size="lg"
            >
              {loading ? (
                <>
                  <Spinner />
                  Summarizing...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  {result ? 'Re-summarize' : 'Summarize'}
                </>
              )}
            </Button>
            {result && !loading && (
              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  setResult(null)
                  setError(null)
                }}
              >
                <RefreshCw className="h-4 w-4" />
                Clear
              </Button>
            )}
          </div>
        </div>

        {error && (
          <p className="mt-3 text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
      </ToolCardWrapper>

      {loading && !result && (
        <ToolCardWrapper>
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">Summarizing your text...</p>
          </div>
        </ToolCardWrapper>
      )}

      {result && (
        <div className="space-y-4">
          <ToolCardWrapper>
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Summary
              </h3>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="capitalize">
                  {length}
                </Badge>
                <CopyButton text={result.summary} label="Copy summary" />
              </div>
            </div>
            <Card className="p-4 bg-background/50">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {result.summary}
              </p>
            </Card>
          </ToolCardWrapper>

          {result.keyPoints.length > 0 && (
            <ToolCardWrapper>
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <ListChecks className="h-4 w-4 text-primary" />
                  Key points ({result.keyPoints.length})
                </h3>
                <CopyButton
                  text={result.keyPoints.map((p) => `• ${p}`).join('\n')}
                  label="Copy all"
                />
              </div>
              <ul className="space-y-2">
                {result.keyPoints.map((p, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm rounded-md border border-border p-3 bg-background/50"
                  >
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                      {i + 1}
                    </span>
                    <span className="leading-relaxed">{p}</span>
                  </li>
                ))}
              </ul>
            </ToolCardWrapper>
          )}
        </div>
      )}

      {!result && !loading && (
        <EmptyState message="Paste your text above, choose a length, and click Summarize to get a concise summary and key points." />
      )}
    </div>
  )
}
