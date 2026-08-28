'use client'

import * as React from 'react'
import { Hash, Eraser } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  CopyButton,
  ToolCardWrapper,
  FieldLabel,
} from '@/components/tool-page-shell'

const STOPWORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'if', 'of', 'at', 'by', 'for',
  'with', 'about', 'to', 'from', 'in', 'on', 'is', 'are', 'was', 'were',
  'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
  'will', 'would', 'should', 'could', 'may', 'might', 'can', 'shall',
  'this', 'that', 'these', 'those', 'it', 'its', 'as', 'so', 'than',
  'too', 'very', 'just', 'also', 'i', 'me', 'my', 'we', 'our', 'you',
  'your', 'he', 'she', 'him', 'her', 'they', 'them', 'their', 'what',
  'which', 'who', 'whom', 'whose', 'when', 'where', 'why', 'how', 'all',
  'each', 'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such',
  'no', 'not', 'only', 'own', 'same', 'than', 'then', 'here', 'there',
  'into', 'out', 'up', 'down', 'off', 'over', 'under', 'again',
  'further', 'once',
])

interface KeywordResult {
  word: string
  count: number
  percentage: number
}

function analyze(text: string, stripStop: boolean): {
  results: KeywordResult[]
  total: number
} {
  if (!text.trim()) return { results: [], total: 0 }
  const words = text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s'-]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean)

  const counts = new Map<string, number>()
  let total = 0
  for (const w of words) {
    if (stripStop && STOPWORDS.has(w)) continue
    if (w.length < 2) continue
    counts.set(w, (counts.get(w) || 0) + 1)
    total += 1
  }

  const results: KeywordResult[] = Array.from(counts.entries())
    .map(([word, count]) => ({
      word,
      count,
      percentage: total > 0 ? (count / total) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20)

  return { results, total }
}

const SAMPLE = `Search engine optimization SEO is the process of improving the quality and quantity of website traffic from search engines. SEO targets unpaid traffic rather than direct traffic or paid traffic. Unpaid traffic may originate from different kinds of searches, including image search, video search, academic search, news search, and industry-specific vertical search engines.`

export default function KeywordDensity() {
  const [text, setText] = React.useState(SAMPLE)
  const [stripStop, setStripStop] = React.useState(true)

  const { results, total } = React.useMemo(
    () => analyze(text, stripStop),
    [text, stripStop]
  )

  const maxCount = results.length > 0 ? results[0].count : 0

  return (
    <div className="space-y-4">
      <ToolCardWrapper>
        <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
          <FieldLabel className="mb-0">Your content</FieldLabel>
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
          placeholder="Paste your article, blog post, or page content here…"
          className="min-h-[200px] resize-y text-sm"
        />
        <div className="flex items-center justify-between mt-3 rounded-lg border border-border p-3">
          <div>
            <Label htmlFor="sw" className="text-sm">
              Exclude common stopwords
            </Label>
            <p className="text-xs text-muted-foreground">
              Ignore “the”, “a”, “is”, etc.
            </p>
          </div>
          <Switch
            id="sw"
            checked={stripStop}
            onCheckedChange={setStripStop}
          />
        </div>
      </ToolCardWrapper>

      <ToolCardWrapper>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Hash className="h-5 w-5 text-primary" />
            <h2 className="text-base font-semibold">Top 20 Keywords</h2>
          </div>
          <Badge variant="secondary">
            {total} {total === 1 ? 'word' : 'words'} analyzed
          </Badge>
        </div>

        {results.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
            Enter text above to see keyword analysis.
          </div>
        ) : (
          <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
            {results.map((r, i) => (
              <div
                key={r.word + i}
                className="grid grid-cols-[40px_1fr_60px_60px] items-center gap-3 rounded-md border border-border px-3 py-2 text-sm hover:bg-accent/40 transition-colors"
              >
                <span className="text-xs text-muted-foreground font-mono">
                  #{i + 1}
                </span>
                <div className="min-w-0">
                  <div className="font-medium truncate">{r.word}</div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden mt-1">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{
                        width: `${maxCount > 0 ? (r.count / maxCount) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
                <span className="text-right font-mono text-xs text-muted-foreground">
                  {r.percentage.toFixed(2)}%
                </span>
                <span className="text-right font-mono text-sm font-semibold">
                  {r.count}
                </span>
              </div>
            ))}
          </div>
        )}
      </ToolCardWrapper>
    </div>
  )
}
