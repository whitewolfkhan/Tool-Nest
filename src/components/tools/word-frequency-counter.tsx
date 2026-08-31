'use client'

import * as React from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import {
  ListOrdered,
  Trash2,
  Download,
  BarChart3,
} from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  ToolCardWrapper,
  FieldLabel,
  EmptyState,
} from '@/components/tool-page-shell'
import { toast } from 'sonner'

const STOPWORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'if', 'then', 'else', 'when', 'where',
  'why', 'how', 'what', 'who', 'whom', 'which', 'this', 'that', 'these', 'those',
  'i', 'me', 'my', 'mine', 'we', 'us', 'our', 'ours', 'you', 'your', 'yours',
  'he', 'him', 'his', 'she', 'her', 'hers', 'it', 'its', 'they', 'them', 'their',
  'theirs', 'is', 'am', 'are', 'was', 'were', 'be', 'been', 'being', 'have',
  'has', 'had', 'having', 'do', 'does', 'did', 'doing', 'will', 'would', 'shall',
  'should', 'may', 'might', 'must', 'can', 'could', 'of', 'at', 'by', 'for',
  'with', 'about', 'against', 'between', 'into', 'through', 'during', 'before',
  'after', 'above', 'below', 'to', 'from', 'up', 'down', 'in', 'out', 'on',
  'off', 'over', 'under', 'again', 'further', 'once', 'here', 'there', 'all',
  'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no',
  'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just',
  'as', 'such', 'because', 'while', 'until', 'also', 's', 't', 'd', 'll', 're',
  've', 'm',
])

const DEFAULT_TEXT = `The quick brown fox jumps over the lazy dog. The dog barked at the fox, but the fox kept running. Quick as lightning, the fox disappeared into the forest. The lazy dog sighed and went back to sleep. The end.`

interface FreqRow {
  word: string
  count: number
  percentage: number
}

function analyze(
  text: string,
  caseSensitive: boolean,
  excludeStopwords: boolean,
  minLength: number
): { rows: FreqRow[]; totalWords: number; uniqueWords: number } {
  if (!text.trim()) return { rows: [], totalWords: 0, uniqueWords: 0 }
  // Tokenize: split on non-word chars (apostrophes kept within words)
  const raw = text.match(/[A-Za-z0-9']+/g) ?? []
  const tokens = raw.map((t) => (caseSensitive ? t : t.toLowerCase()))
  const filtered = tokens.filter((t) => {
    if (t.length < minLength) return false
    if (excludeStopwords && STOPWORDS.has(t.toLowerCase())) return false
    return true
  })

  const counts = new Map<string, number>()
  for (const t of filtered) {
    counts.set(t, (counts.get(t) ?? 0) + 1)
  }

  const rows: FreqRow[] = Array.from(counts.entries())
    .map(([word, count]) => ({
      word,
      count,
      percentage: (count / filtered.length) * 100,
    }))
    .sort((a, b) => b.count - a.count)

  return {
    rows,
    totalWords: filtered.length,
    uniqueWords: counts.size,
  }
}

export default function WordFrequencyCounter() {
  const [text, setText] = React.useState(DEFAULT_TEXT)
  const [caseSensitive, setCaseSensitive] = React.useState(false)
  const [excludeStopwords, setExcludeStopwords] = React.useState(true)
  const [minLength, setMinLength] = React.useState(2)

  const { rows, totalWords, uniqueWords } = React.useMemo(
    () => analyze(text, caseSensitive, excludeStopwords, minLength),
    [text, caseSensitive, excludeStopwords, minLength]
  )

  const top20 = rows.slice(0, 20)
  const chartData = top20.map((r) => ({ word: r.word, count: r.count }))

  const onCopyCsv = () => {
    if (rows.length === 0) {
      toast.error('Nothing to copy')
      return
    }
    const csv = ['word,count,percentage']
      .concat(rows.map((r) => `"${r.word.replace(/"/g, '""')}",${r.count},${r.percentage.toFixed(2)}`))
      .join('\n')
    navigator.clipboard
      .writeText(csv)
      .then(() => toast.success('Copied as CSV'))
      .catch(() => toast.error('Failed to copy'))
  }

  const onDownloadCsv = () => {
    if (rows.length === 0) {
      toast.error('Nothing to download')
      return
    }
    const csv = ['word,count,percentage']
      .concat(rows.map((r) => `"${r.word.replace(/"/g, '""')}",${r.count},${r.percentage.toFixed(2)}`))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'word-frequency.csv'
    a.click()
    URL.revokeObjectURL(url)
    toast.success('CSV downloaded')
  }

  return (
    <div className="space-y-6">
      <ToolCardWrapper>
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left: input + controls */}
          <div className="space-y-4">
            <div>
              <FieldLabel>Text to analyze</FieldLabel>
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste your text here..."
                rows={10}
                className="resize-y font-mono text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center justify-between rounded-md border border-border p-3">
                <Label htmlFor="case-toggle" className="text-xs">Case-sensitive</Label>
                <Switch
                  id="case-toggle"
                  checked={caseSensitive}
                  onCheckedChange={setCaseSensitive}
                />
              </div>
              <div className="flex items-center justify-between rounded-md border border-border p-3">
                <Label htmlFor="stop-toggle" className="text-xs">Exclude stopwords</Label>
                <Switch
                  id="stop-toggle"
                  checked={excludeStopwords}
                  onCheckedChange={setExcludeStopwords}
                />
              </div>
            </div>

            <div>
              <FieldLabel>Min word length: {minLength}</FieldLabel>
              <Input
                type="number"
                min={1}
                max={20}
                value={minLength}
                onChange={(e) => setMinLength(parseInt(e.target.value) || 1)}
                className="font-mono w-32"
              />
            </div>

            <Button
              onClick={() => setText('')}
              variant="ghost"
              size="sm"
              className="gap-1.5"
              disabled={!text}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear
            </Button>

            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{totalWords} words</Badge>
              <Badge variant="secondary">{uniqueWords} unique</Badge>
            </div>
          </div>

          {/* Right: chart */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-1.5">
              <BarChart3 className="h-4 w-4 text-primary" />
              Top {Math.min(20, rows.length)} words
            </h3>
            {chartData.length === 0 ? (
              <EmptyState message="Enter text to see a frequency chart." />
            ) : (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 32 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                    <XAxis
                      dataKey="word"
                      angle={-45}
                      textAnchor="end"
                      height={56}
                      interval={0}
                      tick={{ fontSize: 11 }}
                      stroke="#6b7280"
                    />
                    <YAxis tick={{ fontSize: 11 }} stroke="#6b7280" />
                    <Tooltip
                      cursor={{ fill: 'rgba(16,185,129,0.1)' }}
                      contentStyle={{
                        borderRadius: 6,
                        border: '1px solid #e5e7eb',
                        fontSize: 12,
                      }}
                    />
                    <Bar dataKey="count" fill="#10B981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      </ToolCardWrapper>

      {/* Table */}
      <ToolCardWrapper>
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h3 className="text-sm font-semibold flex items-center gap-1.5">
            <ListOrdered className="h-4 w-4 text-primary" />
            Frequency table ({rows.length} unique words)
          </h3>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onCopyCsv} className="gap-1.5">
              Copy CSV
            </Button>
            <Button variant="outline" size="sm" onClick={onDownloadCsv} className="gap-1.5">
              <Download className="h-3.5 w-3.5" />
              CSV
            </Button>
          </div>
        </div>

        {rows.length === 0 ? (
          <EmptyState message="No words to display. Try adjusting filters or pasting some text." />
        ) : (
          <div className="max-h-96 overflow-y-auto rounded-md border border-border">
            <Table>
              <TableHeader className="sticky top-0 bg-muted/95 backdrop-blur z-10">
                <TableRow>
                  <TableHead className="w-16">#</TableHead>
                  <TableHead>Word</TableHead>
                  <TableHead className="text-right w-20">Count</TableHead>
                  <TableHead className="text-right w-24">Percentage</TableHead>
                  <TableHead className="w-32">Distribution</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r, i) => (
                  <TableRow key={`${r.word}-${i}`}>
                    <TableCell className="font-mono text-muted-foreground">{i + 1}</TableCell>
                    <TableCell className="font-mono">{r.word}</TableCell>
                    <TableCell className="text-right font-mono">{r.count}</TableCell>
                    <TableCell className="text-right font-mono">{r.percentage.toFixed(2)}%</TableCell>
                    <TableCell>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${Math.min(100, (r.count / (rows[0]?.count || 1)) * 100)}%` }}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </ToolCardWrapper>

      <p className="text-xs text-muted-foreground text-center">
        All analysis runs in your browser. No data is uploaded.
      </p>
    </div>
  )
}
