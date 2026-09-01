'use client'

import * as React from 'react'
import {
  BarChart3,
  Clock,
  Mic,
  Type,
  Hash,
  Gauge,
  BookOpen,
  Calculator,
  Sparkles,
  Trash2,
} from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  ToolCardWrapper,
  FieldLabel,
} from '@/components/tool-page-shell'
import { toast } from 'sonner'

const VOWELS = new Set(['a', 'e', 'i', 'o', 'u', 'y'])

interface Stats {
  characters: number
  charactersNoSpaces: number
  words: number
  sentences: number
  paragraphs: number
  lines: number
  letters: number
  digits: number
  spaces: number
  punctuation: number
  special: number
  avgWordLen: number
  avgSentenceLen: number
  longestSentence: number
  syllables: number
  readingEase: number
  gradeLevel: number
  readingTime: number // minutes
  speakingTime: number // minutes
}

function countSyllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, '')
  if (!w) return 0
  if (w.length <= 3) return 1
  // Silent e
  let trimmed = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '')
  trimmed = trimmed.replace(/^y/, '')
  const groups = trimmed.match(/[aeiouy]{1,}/g)
  return groups ? groups.length : 1
}

function computeStats(text: string): Stats {
  const characters = text.length
  const charactersNoSpaces = text.replace(/\s/g, '').length
  const lines = text.length === 0 ? 0 : text.split(/\r\n|\r|\n/).length

  // Words
  const wordMatches = text.match(/[A-Za-z0-9']+/g) ?? []
  const words = wordMatches.length

  // Sentences: split on . ! ? (with optional closing quotes/parens)
  const sentenceArr = text.length ? text.split(/[.!?]+(?:\s|$)/).map((s) => s.trim()).filter(Boolean) : []
  const sentences = sentenceArr.length
  const longestSentence = sentenceArr.reduce((m, s) => Math.max(m, (s.match(/[A-Za-z0-9']+/g) ?? []).length), 0)

  // Paragraphs (separated by one or more blank lines)
  const paragraphs = text.length === 0 ? 0 : text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean).length

  // Character breakdown
  let letters = 0, digits = 0, spaces = 0, punctuation = 0, special = 0
  for (const ch of text) {
    if (/[a-zA-Z]/.test(ch)) letters++
    else if (/[0-9]/.test(ch)) digits++
    else if (/\s/.test(ch)) spaces++
    else if (/[.,;:!?"'`()\[\]{}\-–—…]/.test(ch)) punctuation++
    else special++
  }

  // Syllables
  const syllables = wordMatches.reduce((s, w) => s + countSyllables(w), 0)

  const avgWordLen = words > 0 ? (letters + digits) / words : 0
  const avgSentenceLen = sentences > 0 ? words / sentences : 0

  // Flesch reading ease
  const readingEase = words > 0 && sentences > 0
    ? 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words)
    : 0
  const gradeLevel = words > 0 && sentences > 0
    ? 0.39 * (words / sentences) + 11.8 * (syllables / words) - 15.59
    : 0

  const readingTime = words / 200 // 200 wpm
  const speakingTime = words / 130 // 130 wpm

  return {
    characters,
    charactersNoSpaces,
    words,
    sentences,
    paragraphs,
    lines,
    letters,
    digits,
    spaces,
    punctuation,
    special,
    avgWordLen,
    avgSentenceLen,
    longestSentence,
    syllables,
    readingEase,
    gradeLevel,
    readingTime,
    speakingTime,
  }
}

function formatMinutes(m: number): string {
  if (m < 1) {
    const s = Math.round(m * 60)
    return `${s}s`
  }
  const mins = Math.floor(m)
  const secs = Math.round((m - mins) * 60)
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`
}

function readingEaseLabel(score: number): { label: string; color: string } {
  if (score >= 90) return { label: 'Very Easy (5th grade)', color: 'bg-emerald-500' }
  if (score >= 80) return { label: 'Easy (6th grade)', color: 'bg-emerald-500' }
  if (score >= 70) return { label: 'Fairly Easy (7th grade)', color: 'bg-teal-500' }
  if (score >= 60) return { label: 'Standard (8–9th grade)', color: 'bg-cyan-500' }
  if (score >= 50) return { label: 'Fairly Difficult (10–12th)', color: 'bg-amber-500' }
  if (score >= 30) return { label: 'Difficult (College)', color: 'bg-orange-500' }
  return { label: 'Very Difficult (College graduate)', color: 'bg-rose-500' }
}

const SAMPLE = `The quick brown fox jumps over the lazy dog. This pangram contains every letter of the English alphabet, which makes it perfect for testing typography. Foxes are small-to-medium-sized, omnivorous mammals belonging to several genera of the family Canidae. They have a flattened skull, upright triangular ears, a pointed, slightly upturned snout, and a long bushy tail.!\n\nLazy dogs, on the other hand, prefer to nap.`

export default function TextStatsAnalyzer() {
  const [text, setText] = React.useState('')
  const stats = React.useMemo(() => computeStats(text), [text])
  const ease = readingEaseLabel(stats.readingEase)

  return (
    <div className="space-y-6">
      <ToolCardWrapper>
        <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
          <FieldLabel className="mb-0 flex items-center gap-2">
            <Type className="h-4 w-4 text-primary" />
            Text input
          </FieldLabel>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => { setText(SAMPLE); toast.info('Sample text loaded') }}>
              Load sample
            </Button>
            {text && (
              <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => setText('')}>
                <Trash2 className="h-3.5 w-3.5" /> Clear
              </Button>
            )}
          </div>
        </div>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste your text here to analyze readability, word frequency, syllable counts, and more…"
          className="min-h-[180px] font-mono text-sm"
        />
      </ToolCardWrapper>

      {/* Basic stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard icon={Hash} label="Characters" value={stats.characters.toLocaleString()} color="text-primary" />
        <StatCard icon={Hash} label="No spaces" value={stats.charactersNoSpaces.toLocaleString()} color="text-primary" />
        <StatCard icon={Type} label="Words" value={stats.words.toLocaleString()} color="text-amber-500" />
        <StatCard icon={BookOpen} label="Sentences" value={stats.sentences.toLocaleString()} color="text-violet-500" />
        <StatCard icon={Hash} label="Paragraphs" value={stats.paragraphs.toLocaleString()} color="text-cyan-500" />
        <StatCard icon={Hash} label="Lines" value={stats.lines.toLocaleString()} color="text-pink-500" />
      </div>

      {/* Reading & speaking times */}
      <ToolCardWrapper>
        <FieldLabel className="flex items-center gap-2 mb-3">
          <Clock className="h-4 w-4 text-primary" />
          Reading & speaking time
        </FieldLabel>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-border/60 p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <BookOpen className="h-3.5 w-3.5" /> Reading time <span className="text-muted-foreground/70">(200 wpm)</span>
            </div>
            <div className="text-2xl font-bold tabular-nums">{formatMinutes(stats.readingTime)}</div>
          </div>
          <div className="rounded-lg border border-border/60 p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Mic className="h-3.5 w-3.5" /> Speaking time <span className="text-muted-foreground/70">(130 wpm)</span>
            </div>
            <div className="text-2xl font-bold tabular-nums">{formatMinutes(stats.speakingTime)}</div>
          </div>
        </div>
      </ToolCardWrapper>

      {/* Readability scores */}
      <ToolCardWrapper>
        <FieldLabel className="flex items-center gap-2 mb-3">
          <Gauge className="h-4 w-4 text-primary" />
          Readability scores
        </FieldLabel>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-border/60 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Flesch Reading Ease</span>
              <Badge variant="secondary" className="font-mono">{stats.readingEase.toFixed(1)}</Badge>
            </div>
            <Progress value={Math.max(0, Math.min(100, stats.readingEase))} className="h-2" />
            <div className="flex items-center gap-2 mt-2">
              <span className={`inline-block h-2 w-2 rounded-full ${ease.color}`} />
              <span className="text-xs text-muted-foreground">{ease.label}</span>
            </div>
          </div>
          <div className="rounded-lg border border-border/60 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Flesch-Kincaid Grade</span>
              <Badge variant="secondary" className="font-mono">{stats.gradeLevel.toFixed(1)}</Badge>
            </div>
            <Progress value={Math.max(0, Math.min(100, (stats.gradeLevel / 16) * 100))} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">US school grade level required to understand the text.</p>
          </div>
        </div>
      </ToolCardWrapper>

      {/* Complexity metrics */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MiniStat icon={Calculator} label="Avg word length" value={`${stats.avgWordLen.toFixed(2)} chars`} />
        <MiniStat icon={Calculator} label="Avg sentence length" value={`${stats.avgSentenceLen.toFixed(1)} words`} />
        <MiniStat icon={Calculator} label="Longest sentence" value={`${stats.longestSentence} words`} />
        <MiniStat icon={Calculator} label="Syllables" value={stats.syllables.toLocaleString()} />
      </div>

      {/* Character breakdown */}
      <ToolCardWrapper>
        <FieldLabel className="flex items-center gap-2 mb-3">
          <BarChart3 className="h-4 w-4 text-primary" />
          Character breakdown
        </FieldLabel>
        <div className="space-y-3">
          <BreakdownRow label="Letters" value={stats.letters} total={stats.characters} color="bg-emerald-500" />
          <BreakdownRow label="Digits" value={stats.digits} total={stats.characters} color="bg-amber-500" />
          <BreakdownRow label="Spaces" value={stats.spaces} total={stats.characters} color="bg-violet-500" />
          <BreakdownRow label="Punctuation" value={stats.punctuation} total={stats.characters} color="bg-cyan-500" />
          <BreakdownRow label="Special" value={stats.special} total={stats.characters} color="bg-rose-500" />
        </div>
      </ToolCardWrapper>

      <ToolCardWrapper>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Formulas used</h3>
        </div>
        <ul className="text-sm text-muted-foreground space-y-1.5 list-disc pl-5 font-mono">
          <li>Reading Ease = 206.835 − 1.015 × (words / sentences) − 84.6 × (syllables / words)</li>
          <li>Grade Level = 0.39 × (words / sentences) + 11.8 × (syllables / words) − 15.59</li>
          <li>Syllable counting is approximate: counts vowel groups per word, subtracts silent <code className="font-mono">-e</code> endings.</li>
          <li>Reading time assumes 200 words/minute; speaking time assumes 130 words/minute.</li>
        </ul>
      </ToolCardWrapper>
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType
  label: string
  value: string
  color: string
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-card/50 p-4">
      <div className={`flex items-center gap-1.5 text-xs text-muted-foreground ${color}`}>
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="text-2xl font-semibold tabular-nums mt-1">{value}</div>
    </div>
  )
}

function MiniStat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType
  label: string
  value: string
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-card/50 p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5 text-primary" />
        {label}
      </div>
      <div className="text-lg font-semibold tabular-nums mt-1 font-mono">{value}</div>
    </div>
  )
}

function BreakdownRow({
  label,
  value,
  total,
  color,
}: {
  label: string
  value: number
  total: number
  color: string
}) {
  const pct = total > 0 ? (value / total) * 100 : 0
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="font-medium">{label}</span>
        <span className="font-mono text-muted-foreground tabular-nums">{value} ({pct.toFixed(1)}%)</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div className={`h-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
