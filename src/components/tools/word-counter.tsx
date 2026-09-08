'use client'

import * as React from 'react'
import {
  Type,
  Hash,
  AlignLeft,
  Pilcrow,
  AlignCenter,
  Clock,
  Mic,
} from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
  CopyButton,
  DownloadButton,
  ToolCardWrapper,
  FieldLabel,
  EmptyState,
} from '@/components/tool-page-shell'
import { toast } from 'sonner'

interface Stat {
  label: string
  value: number | string
  suffix?: string
  icon: React.ElementType
}

function calcStats(text: string) {
  const characters = text.length
  const charactersNoSpaces = text.replace(/\s/g, '').length
  const words = text.trim() ? text.trim().split(/\s+/).length : 0
  const sentences = text.trim() ? (text.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g) || []).length : 0
  const paragraphs = text.trim() ? text.trim().split(/\n{2,}/).filter((p) => p.trim().length > 0).length : 0
  const lines = text ? text.split(/\n/).length : 0
  // Avg reading speed ~200 wpm, speaking ~130 wpm
  const readingTimeMin = words / 200
  const speakingTimeMin = words / 130
  return {
    characters,
    charactersNoSpaces,
    words,
    sentences,
    paragraphs,
    lines,
    readingTimeMin,
    speakingTimeMin,
  }
}

function formatTime(min: number) {
  if (min <= 0) return '0s'
  const totalSeconds = Math.round(min * 60)
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  if (m === 0) return `${s}s`
  return `${m}m ${s}s`
}

export default function WordCounter() {
  const [text, setText] = React.useState('')

  const stats = React.useMemo(() => calcStats(text), [text])

  const cards: Stat[] = [
    { label: 'Words', value: stats.words, icon: Type },
    { label: 'Characters', value: stats.characters, icon: Hash },
    { label: 'No Spaces', value: stats.charactersNoSpaces, icon: AlignCenter },
    { label: 'Sentences', value: stats.sentences, icon: AlignLeft },
    { label: 'Paragraphs', value: stats.paragraphs, icon: Pilcrow },
    { label: 'Lines', value: stats.lines, icon: AlignLeft },
    { label: 'Reading Time', value: formatTime(stats.readingTimeMin), icon: Clock },
    { label: 'Speaking Time', value: formatTime(stats.speakingTimeMin), icon: Mic },
  ]

  const handleDownload = () => {
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'text.txt'
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Downloaded text.txt')
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <ToolCardWrapper>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
          <FieldLabel className="mb-0">Your text</FieldLabel>
          <div className="flex gap-2">
            <CopyButton text={text} label="Copy" />
            <DownloadButton onClick={handleDownload} disabled={!text} />
            <Button
              variant="ghost"
              size="sm"
              disabled={!text}
              onClick={() => {
                setText('')
                toast.success('Cleared')
              }}
            >
              Clear
            </Button>
          </div>
        </div>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Start typing or paste your text here..."
          className="min-h-[400px] resize-y font-mono text-sm leading-relaxed"
        />
      </ToolCardWrapper>

      <div className="space-y-4">
        <ToolCardWrapper>
          <FieldLabel>Live Statistics</FieldLabel>
          <div className="grid grid-cols-2 gap-3">
            {cards.map((c) => {
              const Icon = c.icon
              return (
                <div
                  key={c.label}
                  className="rounded-lg border border-border bg-background p-3"
                >
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                    <Icon className="h-3.5 w-3.5" />
                    {c.label}
                  </div>
                  <div className="text-2xl font-semibold tabular-nums">
                    {c.value}
                    {c.suffix && <span className="text-sm text-muted-foreground ml-1">{c.suffix}</span>}
                  </div>
                </div>
              )
            })}
          </div>
        </ToolCardWrapper>

        {!text && (
          <EmptyState message="Stats will appear here as you type." />
        )}
      </div>
    </div>
  )
}
