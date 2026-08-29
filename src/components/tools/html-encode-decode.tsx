'use client'

import * as React from 'react'
import { ArrowRightLeft, Eraser } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { CopyButton, ToolCardWrapper, FieldLabel } from '@/components/tool-page-shell'
import { toast } from 'sonner'

const ENCODE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

const DECODE_MAP: Array<[RegExp, string]> = [
  [/&amp;/g, '&'],
  [/&lt;/g, '<'],
  [/&gt;/g, '>'],
  [/&quot;/g, '"'],
  [/&#0*39;/g, "'"],
  [/&#x0*27;/gi, "'"],
  [/&#0*(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10))],
  [/&#x0*([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16))],
]

function htmlEncode(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ENCODE_MAP[c])
}

function htmlDecode(s: string): string {
  let out = s
  for (const [re, rep] of DECODE_MAP) {
    out = out.replace(re, rep as string)
  }
  return out
}

export default function HtmlEncodeDecode() {
  const [mode, setMode] = React.useState<'encode' | 'decode'>('encode')
  const [encodeInput, setEncodeInput] = React.useState('')
  const [decodeInput, setDecodeInput] = React.useState('')

  const encoded = React.useMemo(() => htmlEncode(encodeInput), [encodeInput])
  const decoded = React.useMemo(() => htmlDecode(decodeInput), [decodeInput])

  const swap = () => {
    if (mode === 'encode') {
      setDecodeInput(encoded)
      setMode('decode')
      setEncodeInput('')
    } else {
      setEncodeInput(decoded)
      setMode('encode')
      setDecodeInput('')
    }
    toast.success('Output moved to input')
  }

  return (
    <ToolCardWrapper>
      <Tabs value={mode} onValueChange={(v) => setMode(v as 'encode' | 'decode')}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="encode">Encode</TabsTrigger>
          <TabsTrigger value="decode">Decode</TabsTrigger>
        </TabsList>

        <TabsContent value="encode" className="mt-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <FieldLabel className="mb-0">Raw HTML</FieldLabel>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={!encodeInput}
                  onClick={() => setEncodeInput('')}
                  className="gap-1.5"
                >
                  <Eraser className="h-4 w-4" /> Clear
                </Button>
              </div>
              <Textarea
                value={encodeInput}
                onChange={(e) => setEncodeInput(e.target.value)}
                placeholder={'<a href="https://example.com">Link</a>'}
                className="min-h-[260px] resize-y font-mono text-sm"
              />
            </div>
            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <FieldLabel className="mb-0">Entity-encoded</FieldLabel>
                <div className="flex items-center gap-2">
                  {encoded && (
                    <Badge variant="secondary" className="font-mono">
                      {new Blob([encoded]).size} B
                    </Badge>
                  )}
                  <CopyButton text={encoded} />
                </div>
              </div>
              <Textarea
                value={encoded}
                readOnly
                placeholder="&lt;a href=&quot;...&quot;&gt;..."
                className="min-h-[260px] resize-y font-mono text-sm bg-muted/40 break-all"
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="decode" className="mt-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <FieldLabel className="mb-0">Entity-encoded input</FieldLabel>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={!decodeInput}
                  onClick={() => setDecodeInput('')}
                  className="gap-1.5"
                >
                  <Eraser className="h-4 w-4" /> Clear
                </Button>
              </div>
              <Textarea
                value={decodeInput}
                onChange={(e) => setDecodeInput(e.target.value)}
                placeholder="&lt;a href=&quot;https://example.com&quot;&gt;Link&lt;/a&gt;"
                className="min-h-[260px] resize-y font-mono text-sm break-all"
              />
            </div>
            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <FieldLabel className="mb-0">Decoded HTML</FieldLabel>
                <div className="flex items-center gap-2">
                  {decoded && (
                    <Badge variant="secondary" className="font-mono">
                      {new Blob([decoded]).size} B
                    </Badge>
                  )}
                  <CopyButton text={decoded} />
                </div>
              </div>
              <Textarea
                value={decoded}
                readOnly
                placeholder="Decoded text appears here..."
                className="min-h-[260px] resize-y font-mono text-sm bg-muted/40"
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="mt-4 flex justify-center">
        <Button variant="outline" size="sm" onClick={swap} className="gap-1.5">
          <ArrowRightLeft className="h-4 w-4" /> Swap input / output
        </Button>
      </div>

      <div className="mt-4 grid sm:grid-cols-5 gap-2 text-xs text-center">
        {[
          { from: '<', to: '&lt;' },
          { from: '>', to: '&gt;' },
          { from: '&', to: '&amp;' },
          { from: '"', to: '&quot;' },
          { from: "'", to: '&#39;' },
        ].map((m) => (
          <div key={m.from} className="rounded-md border border-border bg-muted/20 p-2">
            <code className="font-mono">{m.from}</code>
            <span className="mx-1 text-muted-foreground">→</span>
            <code className="font-mono">{m.to}</code>
          </div>
        ))}
      </div>
    </ToolCardWrapper>
  )
}
