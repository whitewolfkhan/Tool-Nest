'use client'

import * as React from 'react'
import { ArrowRight, Eraser } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
  CopyButton,
  ToolCardWrapper,
  FieldLabel,
} from '@/components/tool-page-shell'
import { toast } from 'sonner'

type CaseType =
  | 'upper'
  | 'lower'
  | 'title'
  | 'sentence'
  | 'camel'
  | 'pascal'
  | 'snake'
  | 'kebab'
  | 'constant'
  | 'alternating'

const WORDS_RE = /[\p{L}\p{N}]+/gu

function splitWords(s: string): string[] {
  return s.match(WORDS_RE) || []
}

function toTitleCase(s: string): string {
  return s.replace(
    WORDS_RE,
    (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
  )
}

function toSentenceCase(s: string): string {
  return s.replace(
    /(^\s*[\p{L}\p{N}])|([.!?]\s+[\p{L}\p{N}])/gu,
    (m) => m.toUpperCase()
  )
}

function toCamelCase(s: string): string {
  const words = splitWords(s)
  return words
    .map((w, i) =>
      i === 0
        ? w.toLowerCase()
        : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
    )
    .join('')
}

function toPascalCase(s: string): string {
  const words = splitWords(s)
  return words
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join('')
}

function toSnakeCase(s: string): string {
  return splitWords(s).map((w) => w.toLowerCase()).join('_')
}

function toKebabCase(s: string): string {
  return splitWords(s).map((w) => w.toLowerCase()).join('-')
}

function toConstantCase(s: string): string {
  return splitWords(s).map((w) => w.toUpperCase()).join('_')
}

function toAlternatingCase(s: string): string {
  let upper = false
  let out = ''
  for (const ch of s) {
    if (/[\p{L}]/u.test(ch)) {
      out += upper ? ch.toUpperCase() : ch.toLowerCase()
      upper = !upper
    } else {
      out += ch
    }
  }
  return out
}

const CASES: { type: CaseType; label: string; fn: (s: string) => string }[] = [
  { type: 'upper', label: 'UPPER CASE', fn: (s) => s.toUpperCase() },
  { type: 'lower', label: 'lower case', fn: (s) => s.toLowerCase() },
  { type: 'title', label: 'Title Case', fn: toTitleCase },
  { type: 'sentence', label: 'Sentence case', fn: toSentenceCase },
  { type: 'camel', label: 'camelCase', fn: toCamelCase },
  { type: 'pascal', label: 'PascalCase', fn: toPascalCase },
  { type: 'snake', label: 'snake_case', fn: toSnakeCase },
  { type: 'kebab', label: 'kebab-case', fn: toKebabCase },
  { type: 'constant', label: 'CONSTANT_CASE', fn: toConstantCase },
  { type: 'alternating', label: 'aLtErNaTiNg', fn: toAlternatingCase },
]

export default function CaseConverter() {
  const [text, setText] = React.useState('')
  const [result, setResult] = React.useState('')
  const [activeCase, setActiveCase] = React.useState<CaseType | null>(null)

  const apply = (c: (typeof CASES)[number]) => {
    if (!text) {
      toast.error('Please enter some text first')
      return
    }
    const out = c.fn(text)
    setResult(out)
    setActiveCase(c.type)
    toast.success(`Converted to ${c.label}`)
  }

  return (
    <div className="space-y-4">
      <ToolCardWrapper>
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <FieldLabel className="mb-0">Input text</FieldLabel>
          <Button
            variant="ghost"
            size="sm"
            disabled={!text && !result}
            onClick={() => {
              setText('')
              setResult('')
              setActiveCase(null)
            }}
          >
            <Eraser className="h-4 w-4" /> Clear
          </Button>
        </div>
        <Textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            if (activeCase) {
              const c = CASES.find((x) => x.type === activeCase)
              if (c) setResult(c.fn(e.target.value))
            }
          }}
          placeholder="Type or paste text here..."
          className="min-h-[180px] resize-y font-mono text-sm"
        />
      </ToolCardWrapper>

      <ToolCardWrapper>
        <FieldLabel>Select a case</FieldLabel>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          {CASES.map((c) => (
            <Button
              key={c.type}
              variant={activeCase === c.type ? 'default' : 'outline'}
              size="sm"
              onClick={() => apply(c)}
              className="w-full justify-center"
            >
              {c.label}
            </Button>
          ))}
        </div>
      </ToolCardWrapper>

      <ToolCardWrapper>
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <FieldLabel className="mb-0">Result</FieldLabel>
          <CopyButton text={result} />
        </div>
        <Textarea
          value={result}
          readOnly
          placeholder="Converted text will appear here..."
          className="min-h-[180px] resize-y font-mono text-sm bg-muted/40"
        />
        <div className="flex items-center justify-end mt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={!result}
            onClick={() => {
              setText(result)
              toast.success('Result moved to input')
            }}
            className="gap-1.5"
          >
            <ArrowRight className="h-4 w-4" /> Use as input
          </Button>
        </div>
      </ToolCardWrapper>
    </div>
  )
}
