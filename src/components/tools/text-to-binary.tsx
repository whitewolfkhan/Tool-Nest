'use client'

import * as React from 'react'
import { Binary, Eraser } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  CopyButton,
  ToolCardWrapper,
  FieldLabel,
} from '@/components/tool-page-shell'
import { toast } from 'sonner'

type Separator = 'space' | 'none' | 'dash'
type Encoding = 'utf8' | 'ascii'

function textToBinary(text: string, sep: Separator, enc: Encoding): string {
  const sepStr = sep === 'space' ? ' ' : sep === 'dash' ? '-' : ''
  const chars = Array.from(text) // handle surrogate pairs
  const parts = chars.map((ch) => {
    const code = ch.codePointAt(0) || 0
    if (enc === 'ascii' && code > 127) {
      // ascii mode — use '?' or just truncated bits (use 8 bits of 0)
      return '00000000'
    }
    if (code > 0xff) {
      // UTF-16 surrogate or astral — represent as multiple 8-bit groups
      // Encode as UTF-8 bytes
      const bytes: string[] = []
      const utf8 = new TextEncoder().encode(ch)
      for (const b of utf8) bytes.push(b.toString(2).padStart(8, '0'))
      return bytes.join(sepStr)
    }
    return code.toString(2).padStart(8, '0')
  })
  return parts.join(sepStr)
}

function binaryToText(binary: string, enc: Encoding): { output: string; error?: string } {
  const cleaned = binary.replace(/[^01]/g, '')
  if (cleaned.length % 8 !== 0) {
    // Pad with leading zeros to multiple of 8
    const padded = cleaned.padStart(Math.ceil(cleaned.length / 8) * 8, '0')
    if (!padded) return { output: '' }
    const bytes: number[] = []
    for (let i = 0; i < padded.length; i += 8) {
      bytes.push(parseInt(padded.slice(i, i + 8), 2))
    }
    try {
      const arr = new Uint8Array(bytes)
      const text = new TextDecoder(enc === 'ascii' ? 'ascii' : 'utf-8').decode(arr)
      return { output: text }
    } catch (e) {
      return { output: '', error: e instanceof Error ? e.message : 'Decode error' }
    }
  }
  const bytes: number[] = []
  for (let i = 0; i < cleaned.length; i += 8) {
    bytes.push(parseInt(cleaned.slice(i, i + 8), 2))
  }
  try {
    const arr = new Uint8Array(bytes)
    const text = new TextDecoder(enc === 'ascii' ? 'ascii' : 'utf-8').decode(arr)
    return { output: text }
  } catch (e) {
    return { output: '', error: e instanceof Error ? e.message : 'Decode error' }
  }
}

export default function TextToBinary() {
  const [mode, setMode] = React.useState<'encode' | 'decode'>('encode')
  const [text, setText] = React.useState('')
  const [sep, setSep] = React.useState<Separator>('space')
  const [enc, setEnc] = React.useState<Encoding>('utf8')

  const { output, error } = React.useMemo(() => {
    if (!text) return { output: '', error: null as string | null }
    if (mode === 'encode') {
      return { output: textToBinary(text, sep, enc), error: null as string | null }
    }
    const r = binaryToText(text, enc)
    return { output: r.output, error: r.error ?? null }
  }, [text, mode, sep, enc])

  const handleClear = () => {
    setText('')
    toast.success('Cleared')
  }

  return (
    <div className="space-y-4">
      <ToolCardWrapper>
        <div className="grid sm:grid-cols-2 gap-4">
          {mode === 'encode' && (
            <div>
              <FieldLabel>Separator between bytes</FieldLabel>
              <Select value={sep} onValueChange={(v: Separator) => setSep(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="space">Space (01001000 01101001)</SelectItem>
                  <SelectItem value="none">None (0100100001101001)</SelectItem>
                  <SelectItem value="dash">Dash (01001000-01101001)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <div>
            <FieldLabel>Encoding</FieldLabel>
            <Select value={enc} onValueChange={(v: Encoding) => setEnc(v)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="utf8">UTF-8</SelectItem>
                <SelectItem value="ascii">ASCII</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </ToolCardWrapper>

      <Tabs value={mode} onValueChange={(v) => setMode(v as 'encode' | 'decode')}>
        <TabsList className="grid w-full max-w-xs grid-cols-2">
          <TabsTrigger value="encode" className="gap-1.5">
            <Binary className="h-4 w-4" /> Text → Binary
          </TabsTrigger>
          <TabsTrigger value="decode" className="gap-1.5">
            Binary → Text
          </TabsTrigger>
        </TabsList>
        <TabsContent value="encode" className="mt-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <ToolCardWrapper>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <FieldLabel className="mb-0">Text input</FieldLabel>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={!text}
                  onClick={handleClear}
                  className="gap-1.5"
                >
                  <Eraser className="h-4 w-4" /> Clear
                </Button>
              </div>
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type text to convert..."
                className="min-h-[260px] resize-y font-mono text-sm"
              />
            </ToolCardWrapper>

            <ToolCardWrapper>
              <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                <FieldLabel className="mb-0">Binary output</FieldLabel>
                <div className="flex gap-2 items-center">
                  {output && (
                    <Badge variant="secondary">{output.length} chars</Badge>
                  )}
                  <CopyButton text={output} />
                </div>
              </div>
              <Textarea
                value={output}
                readOnly
                placeholder="01001000 01101001"
                className="min-h-[260px] resize-y font-mono text-xs bg-muted/40 break-all"
              />
            </ToolCardWrapper>
          </div>
        </TabsContent>
        <TabsContent value="decode" className="mt-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <ToolCardWrapper>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <FieldLabel className="mb-0">Binary input</FieldLabel>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={!text}
                  onClick={handleClear}
                  className="gap-1.5"
                >
                  <Eraser className="h-4 w-4" /> Clear
                </Button>
              </div>
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="01001000 01101001"
                className="min-h-[260px] resize-y font-mono text-xs"
              />
              {error && (
                <p className="text-sm text-destructive mt-2">{error}</p>
              )}
            </ToolCardWrapper>

            <ToolCardWrapper>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <FieldLabel className="mb-0">Decoded text</FieldLabel>
                <CopyButton text={output} />
              </div>
              <Textarea
                value={output}
                readOnly
                placeholder="Decoded text..."
                className="min-h-[260px] resize-y font-mono text-sm bg-muted/40"
              />
            </ToolCardWrapper>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
