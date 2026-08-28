'use client'

import * as React from 'react'
import { Sparkles, RotateCcw } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  CopyButton,
  DownloadButton,
  ToolCardWrapper,
  FieldLabel,
} from '@/components/tool-page-shell'
import { toast } from 'sonner'

const WORDS = [
  'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit',
  'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore',
  'magna', 'aliqua', 'enim', 'ad', 'minim', 'veniam', 'quis', 'nostrud',
  'exercitation', 'ullamco', 'laboris', 'nisi', 'aliquip', 'ex', 'ea', 'commodo',
  'consequat', 'duis', 'aute', 'irure', 'in', 'reprehenderit', 'voluptate',
  'velit', 'esse', 'cillum', 'fugiat', 'nulla', 'pariatur', 'excepteur', 'sint',
  'occaecat', 'cupidatat', 'non', 'proident', 'sunt', 'culpa', 'qui', 'officia',
  'deserunt', 'mollit', 'anim', 'id', 'est', 'laborum', 'vivamus', 'vestibulum',
  'sapien', 'auctor', 'morbi', 'porta', 'luctus', 'praesent', 'cras', 'facilisis',
  'lacinia', 'dapibus', 'nullam', 'fermentum', 'augue', 'tristique', 'suscipit',
  'maecenas', 'pharetra', 'tortor', 'curabitur', 'gravida', 'scelerisque',
]

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function pickWord() {
  return WORDS[Math.floor(Math.random() * WORDS.length)]
}

function generateSentence(wordsPerSentence: number, startWithLorem: boolean) {
  const count = Math.max(3, wordsPerSentence + rand(-2, 2))
  const words: string[] = []
  if (startWithLorem) {
    words.push('lorem', 'ipsum', 'dolor', 'sit', 'amet')
  }
  while (words.length < count) {
    words.push(pickWord())
  }
  let s = words.slice(0, count).join(' ')
  s = s.charAt(0).toUpperCase() + s.slice(1)
  const commaAt = Math.floor(count / 2)
  if (commaAt > 1 && commaAt < count - 1) {
    const parts = s.split(' ')
    parts.splice(commaAt, 0, ',')
    s = parts.join(' ').replace(' , ', ', ')
  }
  return s + '.'
}

function generateParagraph(sentences: number, wordsPerSentence: number, startWithLorem: boolean) {
  const arr: string[] = []
  for (let i = 0; i < sentences; i++) {
    arr.push(generateSentence(wordsPerSentence, startWithLorem && i === 0))
  }
  return arr.join(' ')
}

function generate(paragraphs: number, sentences: number, wordsPerSentence: number, startWithLorem: boolean) {
  const out: string[] = []
  for (let i = 0; i < paragraphs; i++) {
    out.push(generateParagraph(sentences, wordsPerSentence, startWithLorem && i === 0))
  }
  return out.join('\n\n')
}

export default function LoremIpsum() {
  const [paragraphs, setParagraphs] = React.useState(3)
  const [sentences, setSentences] = React.useState(5)
  const [words, setWords] = React.useState(12)
  const [startLorem, setStartLorem] = React.useState(true)
  const [output, setOutput] = React.useState('')

  const generateText = React.useCallback(() => {
    const text = generate(paragraphs, sentences, words, startLorem)
    setOutput(text)
    toast.success(`Generated ${paragraphs} paragraph${paragraphs > 1 ? 's' : ''}`)
  }, [paragraphs, sentences, words, startLorem])

  React.useEffect(() => {
    // Generate initial sample on mount
    setOutput(generate(paragraphs, sentences, words, startLorem))
  }, [])

  const handleDownload = () => {
    const blob = new Blob([output], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'lorem-ipsum.txt'
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Downloaded lorem-ipsum.txt')
  }

  const wordCount = output ? output.trim().split(/\s+/).length : 0

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <ToolCardWrapper>
        <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
          <FieldLabel className="mb-0">Generated text</FieldLabel>
          <div className="flex gap-2">
            <Badge variant="secondary">{wordCount} words</Badge>
            <CopyButton text={output} />
            <DownloadButton onClick={handleDownload} disabled={!output} />
          </div>
        </div>
        <Textarea
          value={output}
          onChange={(e) => setOutput(e.target.value)}
          className="min-h-[400px] resize-y font-mono text-sm leading-relaxed"
          placeholder="Click Generate to create Lorem Ipsum..."
        />
      </ToolCardWrapper>

      <div className="space-y-4">
        <ToolCardWrapper>
          <FieldLabel>Paragraphs</FieldLabel>
          <div className="flex items-center gap-3">
            <Slider
              value={[paragraphs]}
              min={1}
              max={20}
              step={1}
              onValueChange={(v) => setParagraphs(v[0])}
            />
            <span className="tabular-nums text-sm font-medium w-8 text-right">
              {paragraphs}
            </span>
          </div>

          <FieldLabel className="mt-4">Sentences / paragraph</FieldLabel>
          <div className="flex items-center gap-3">
            <Slider
              value={[sentences]}
              min={1}
              max={15}
              step={1}
              onValueChange={(v) => setSentences(v[0])}
            />
            <span className="tabular-nums text-sm font-medium w-8 text-right">
              {sentences}
            </span>
          </div>

          <FieldLabel className="mt-4">Words / sentence</FieldLabel>
          <div className="flex items-center gap-3">
            <Slider
              value={[words]}
              min={3}
              max={40}
              step={1}
              onValueChange={(v) => setWords(v[0])}
            />
            <span className="tabular-nums text-sm font-medium w-8 text-right">
              {words}
            </span>
          </div>

          <div className="flex items-center justify-between mt-4">
            <Label htmlFor="start-lorem" className="text-sm">Start with "Lorem ipsum"</Label>
            <Switch id="start-lorem" checked={startLorem} onCheckedChange={setStartLorem} />
          </div>

          <div className="grid grid-cols-2 gap-2 mt-5">
            <Button onClick={generateText} className="gap-1.5">
              <Sparkles className="h-4 w-4" /> Generate
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setParagraphs(3)
                setSentences(5)
                setWords(12)
                setStartLorem(true)
                toast.success('Settings reset')
              }}
              className="gap-1.5"
            >
              <RotateCcw className="h-4 w-4" /> Reset
            </Button>
          </div>
        </ToolCardWrapper>
      </div>
    </div>
  )
}
