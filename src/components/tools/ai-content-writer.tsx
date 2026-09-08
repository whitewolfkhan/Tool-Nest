'use client'

import * as React from 'react'
import { Sparkles, RefreshCw, FileText } from 'lucide-react'
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
  EmptyState,
  CopyButton,
  DownloadButton,
} from '@/components/tool-page-shell'

type ContentType =
  | 'article'
  | 'email'
  | 'product-description'
  | 'social-post'
  | 'blog-post'
type Tone = 'professional' | 'casual' | 'friendly' | 'formal'
type Length = 'short' | 'medium' | 'long'

const TYPE_OPTIONS: { value: ContentType; label: string }[] = [
  { value: 'article', label: 'Article' },
  { value: 'email', label: 'Email' },
  { value: 'product-description', label: 'Product description' },
  { value: 'social-post', label: 'Social media post' },
  { value: 'blog-post', label: 'Blog post' },
]

const TONE_OPTIONS: { value: Tone; label: string }[] = [
  { value: 'professional', label: 'Professional' },
  { value: 'casual', label: 'Casual' },
  { value: 'friendly', label: 'Friendly' },
  { value: 'formal', label: 'Formal' },
]

const LENGTH_OPTIONS: { value: Length; label: string }[] = [
  { value: 'short', label: 'Short (~100 words)' },
  { value: 'medium', label: 'Medium (~300 words)' },
  { value: 'long', label: 'Long (~600 words)' },
]

function Spinner() {
  return (
    <span
      aria-hidden
      className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
    />
  )
}

function countWords(text: string): number {
  const trimmed = text.trim()
  if (!trimmed) return 0
  return trimmed.split(/\s+/).length
}

export default function AiContentWriter() {
  const [prompt, setPrompt] = React.useState('')
  const [type, setType] = React.useState<ContentType>('article')
  const [tone, setTone] = React.useState<Tone>('professional')
  const [length, setLength] = React.useState<Length>('medium')
  const [loading, setLoading] = React.useState(false)
  const [content, setContent] = React.useState('')
  const [error, setError] = React.useState<string | null>(null)

  async function generate() {
    const trimmed = prompt.trim()
    if (!trimmed) {
      setError('Please enter a topic or prompt.')
      return
    }
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/ai/content-writer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: trimmed, type, tone, length }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to generate content')
      }
      setContent(data.content ?? '')
    } catch (e) {
      setError((e as Error).message || 'Failed to generate content')
    } finally {
      setLoading(false)
    }
  }

  function downloadAsTxt() {
    if (!content) return
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `toolnest-${type}-${Date.now()}.txt`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const wordCount = countWords(content)

  return (
    <div className="space-y-6">
      <ToolCardWrapper>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <FieldLabel>Content type</FieldLabel>
            <Select value={type} onValueChange={(v) => setType(v as ContentType)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                {TYPE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <FieldLabel>Tone</FieldLabel>
            <Select value={tone} onValueChange={(v) => setTone(v as Tone)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Tone" />
              </SelectTrigger>
              <SelectContent>
                {TONE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <FieldLabel>Length</FieldLabel>
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
        </div>

        <div className="mt-4">
          <FieldLabel>Topic / prompt</FieldLabel>
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. The benefits of remote work for tech startups in 2025"
            rows={4}
            maxLength={2000}
            disabled={loading}
          />
          <div className="mt-1 flex justify-end text-xs text-muted-foreground">
            {prompt.length}/2000
          </div>
        </div>

        {error && (
          <p className="mt-3 text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        <div className="mt-4">
          <Button
            onClick={generate}
            disabled={loading || !prompt.trim()}
            size="lg"
            className="w-full sm:w-auto"
          >
            {loading ? (
              <>
                <Spinner />
                Writing...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                {content ? 'Regenerate' : 'Generate content'}
              </>
            )}
          </Button>
          {content && !loading && (
            <Button
              variant="outline"
              size="lg"
              onClick={() => {
                setContent('')
                setError(null)
              }}
              className="w-full sm:w-auto sm:ml-2"
            >
              <RefreshCw className="h-4 w-4" />
              Clear
            </Button>
          )}
        </div>
      </ToolCardWrapper>

      {loading && !content && (
        <ToolCardWrapper>
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">
              Writing your content...
            </p>
          </div>
        </ToolCardWrapper>
      )}

      {content && (
        <ToolCardWrapper>
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <FileText className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold">Generated content</h3>
              <Badge variant="secondary">{wordCount} words</Badge>
              <Badge variant="secondary" className="capitalize">
                {type.replace('-', ' ')}
              </Badge>
              <Badge variant="outline" className="capitalize">
                {tone}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <CopyButton text={content} />
              <DownloadButton onClick={downloadAsTxt} label=".txt" />
            </div>
          </div>
          <article className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap break-words rounded-md border border-border bg-background/50 p-4 text-sm leading-relaxed">
            {content}
          </article>
        </ToolCardWrapper>
      )}

      {!content && !loading && (
        <EmptyState message="Your generated content will appear here. Fill in the form above and click Generate." />
      )}
    </div>
  )
}
