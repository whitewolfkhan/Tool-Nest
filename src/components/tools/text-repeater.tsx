'use client'

import * as React from 'react'
import {
  Copy,
  Download,
  Repeat,
  Hash,
  Trash2,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
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
  CopyButton,
  DownloadButton,
} from '@/components/tool-page-shell'
import { toast } from 'sonner'

type Separator = 'newline' | 'space' | 'comma' | 'comma-space' | 'tab' | 'custom'

const SEPARATORS: Record<Separator, string> = {
  newline: '\n',
  space: ' ',
  comma: ',',
  'comma-space': ', ',
  tab: '\t',
  custom: '',
}

export default function TextRepeater() {
  const [text, setText] = React.useState('Hello, world!')
  const [count, setCount] = React.useState(5)
  const [separator, setSeparator] = React.useState<Separator>('newline')
  const [customSep, setCustomSep] = React.useState(' - ')
  const [numbered, setNumbered] = React.useState(false)
  const [trimEach, setTrimEach] = React.useState(false)
  const [copied, setCopied] = React.useState(false)

  const sepString = React.useMemo(() => {
    if (separator === 'custom') return customSep
    return SEPARATORS[separator]
  }, [separator, customSep])

  const output = React.useMemo(() => {
    const trimmed = trimEach ? text.trim() : text
    if (!trimmed) return ''
    const parts: string[] = []
    for (let i = 1; i <= count; i++) {
      if (numbered) {
        parts.push(`${i}. ${trimmed}`)
      } else {
        parts.push(trimmed)
      }
    }
    return parts.join(sepString)
  }, [text, count, sepString, numbered, trimEach])

  const charCount = output.length
  const wordCount = output.trim() ? output.trim().split(/\s+/).length : 0
  const lineCount = output ? output.split('\n').length : 0

  const onCopy = async () => {
    if (!output) {
      toast.error('Nothing to copy')
      return
    }
    try {
      await navigator.clipboard.writeText(output)
      setCopied(true)
      toast.success('Copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Failed to copy')
    }
  }

  const onDownload = () => {
    if (!output) {
      toast.error('Nothing to download')
      return
    }
    const blob = new Blob([output], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'repeated-text.txt'
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Downloaded')
  }

  const onClear = () => {
    setText('')
    setCount(5)
    setNumbered(false)
  }

  return (
    <div className="space-y-6">
      <ToolCardWrapper>
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Input + controls */}
          <div className="space-y-4">
            <div>
              <FieldLabel>Text to repeat</FieldLabel>
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type or paste text..."
                rows={5}
                className="resize-y font-mono text-sm"
              />
            </div>

            <div>
              <FieldLabel>Repeat count: {count}</FieldLabel>
              <Slider
                min={1}
                max={100}
                step={1}
                value={[count]}
                onValueChange={(v) => setCount(v[0] ?? 1)}
              />
              <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
                <span>1</span>
                <span>50</span>
                <span>100</span>
              </div>
            </div>

            <div>
              <FieldLabel>Exact count (1 - 10000)</FieldLabel>
              <Input
                type="number"
                min={1}
                max={10000}
                value={count}
                onChange={(e) => {
                  const n = parseInt(e.target.value, 10)
                  if (isNaN(n)) return
                  setCount(Math.min(10000, Math.max(1, n)))
                }}
                className="font-mono"
              />
            </div>

            <div>
              <FieldLabel>Separator</FieldLabel>
              <Select value={separator} onValueChange={(v) => setSeparator(v as Separator)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newline">Newline (\n)</SelectItem>
                  <SelectItem value="space">Space</SelectItem>
                  <SelectItem value="comma">Comma (,)</SelectItem>
                  <SelectItem value="comma-space">Comma + space (, )</SelectItem>
                  <SelectItem value="tab">Tab (\t)</SelectItem>
                  <SelectItem value="custom">Custom...</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {separator === 'custom' && (
              <div>
                <FieldLabel>Custom separator</FieldLabel>
                <Input
                  value={customSep}
                  onChange={(e) => setCustomSep(e.target.value)}
                  placeholder="e.g.  |  or  ---  or  ==>"
                  className="font-mono"
                />
              </div>
            )}

            <div className="flex flex-col gap-3 rounded-md border border-border p-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="numbered-toggle" className="text-sm flex items-center gap-1.5">
                  <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                  Number each repetition
                </Label>
                <Switch
                  id="numbered-toggle"
                  checked={numbered}
                  onCheckedChange={setNumbered}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="trim-toggle" className="text-sm">
                  Trim whitespace from each copy
                </Label>
                <Switch
                  id="trim-toggle"
                  checked={trimEach}
                  onCheckedChange={setTrimEach}
                />
              </div>
            </div>

            <Button onClick={onClear} variant="ghost" size="sm" className="gap-1.5 w-full">
              <Trash2 className="h-3.5 w-3.5" />
              Reset
            </Button>
          </div>

          {/* Output */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold flex items-center gap-1.5">
                <Repeat className="h-4 w-4 text-primary" />
                Output
              </h3>
              <div className="flex items-center gap-2">
                <CopyButton text={output} label="Copy" />
                <DownloadButton onClick={onDownload} disabled={!output} />
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              <Badge variant="secondary">{count} × repeats</Badge>
              <Badge variant="secondary">{charCount} chars</Badge>
              <Badge variant="secondary">{wordCount} words</Badge>
              {output.includes('\n') && <Badge variant="secondary">{lineCount} lines</Badge>}
            </div>

            <Textarea
              value={output}
              readOnly
              rows={14}
              placeholder="Output will appear here..."
              className="resize-y font-mono text-sm bg-muted/30"
            />
            {output && output.length > 100000 && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Note: Output is very large ({(output.length / 1000).toFixed(1)}K chars). Browser may be slow.
              </p>
            )}
          </div>
        </div>
      </ToolCardWrapper>

      <p className="text-xs text-muted-foreground text-center">
        All processing happens locally in your browser.
      </p>
    </div>
  )
}
