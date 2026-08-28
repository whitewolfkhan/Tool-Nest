'use client'

import * as React from 'react'
import { Eraser, ArrowLeftRight } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Toggle } from '@/components/ui/toggle'
import {
  CopyButton,
  ToolCardWrapper,
  FieldLabel,
} from '@/components/tool-page-shell'

type Mode = 'chars' | 'words' | 'lines'

const MODES: { value: Mode; label: string }[] = [
  { value: 'chars', label: 'Reverse characters' },
  { value: 'words', label: 'Reverse words' },
  { value: 'lines', label: 'Reverse lines' },
]

function reverseText(text: string, mode: Mode): string {
  if (!text) return ''
  if (mode === 'chars') {
    // Reverse by code points to handle multi-byte properly
    return Array.from(text).reverse().join('')
  }
  if (mode === 'words') {
    return text
      .split('\n')
      .map((line) => line.split(/(\s+)/).reverse().join(''))
      .join('\n')
  }
  // lines
  return text.split('\n').reverse().join('\n')
}

export default function TextReverse() {
  const [text, setText] = React.useState('')
  const [mode, setMode] = React.useState<Mode>('chars')

  const output = React.useMemo(() => reverseText(text, mode), [text, mode])

  const swap = () => {
    if (!output) return
    setText(output)
  }

  return (
    <div className="space-y-4">
      <ToolCardWrapper>
        <FieldLabel>Reverse mode</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {MODES.map((m) => (
            <Toggle
              key={m.value}
              pressed={mode === m.value}
              onPressedChange={() => setMode(m.value)}
              aria-label={m.label}
            >
              {m.label}
            </Toggle>
          ))}
        </div>
      </ToolCardWrapper>

      <div className="grid gap-4 lg:grid-cols-2">
        <ToolCardWrapper>
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <FieldLabel className="mb-0">Input</FieldLabel>
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
            placeholder="Type text to reverse..."
            className="min-h-[280px] resize-y font-mono text-sm"
          />
          <div className="mt-2">
            <Badge variant="secondary">{text.length} chars</Badge>
          </div>
        </ToolCardWrapper>

        <ToolCardWrapper>
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <FieldLabel className="mb-0">Reversed output</FieldLabel>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={swap}
                disabled={!output}
                className="gap-1.5"
              >
                <ArrowLeftRight className="h-4 w-4" /> Swap
              </Button>
              <CopyButton text={output} />
            </div>
          </div>
          <Textarea
            value={output}
            readOnly
            placeholder="Reversed text..."
            className="min-h-[280px] resize-y font-mono text-sm bg-muted/40"
          />
          <div className="mt-2">
            <Label className="text-xs text-muted-foreground">
              Mode: {MODES.find((m) => m.value === mode)?.label}
            </Label>
          </div>
        </ToolCardWrapper>
      </div>
    </div>
  )
}
