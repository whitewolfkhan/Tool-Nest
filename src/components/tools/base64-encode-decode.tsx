'use client'

import * as React from 'react'
import { ArrowRightLeft, Eraser } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { CopyButton, ToolCardWrapper, FieldLabel } from '@/components/tool-page-shell'
import { toast } from 'sonner'

// UTF-8 safe base64 encode: handle chars outside Latin1 via TextEncoder.
function encodeBase64(text: string): string {
  try {
    const bytes = new TextEncoder().encode(text)
    let bin = ''
    bytes.forEach((b) => (bin += String.fromCharCode(b)))
    return btoa(bin)
  } catch {
    return ''
  }
}

function decodeBase64(b64: string): { output: string; error: string | null } {
  if (!b64.trim()) return { output: '', error: null }
  try {
    // Normalize: strip whitespace, pad to multiple of 4
    let cleaned = b64.replace(/\s+/g, '')
    const pad = cleaned.length % 4
    if (pad === 2) cleaned += '=='
    else if (pad === 3) cleaned += '='
    else if (pad === 1) return { output: '', error: 'Invalid Base64 length' }
    const bin = atob(cleaned)
    const bytes = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
    const output = new TextDecoder().decode(bytes)
    return { output, error: null }
  } catch {
    return { output: '', error: 'Invalid Base64 input' }
  }
}

export default function Base64EncodeDecode() {
  const [mode, setMode] = React.useState<'encode' | 'decode'>('encode')
  const [encodeInput, setEncodeInput] = React.useState('')
  const [decodeInput, setDecodeInput] = React.useState('')

  const encoded = React.useMemo(() => encodeBase64(encodeInput), [encodeInput])
  const decodeResult = React.useMemo(() => decodeBase64(decodeInput), [decodeInput])

  const swap = () => {
    if (mode === 'encode') {
      setDecodeInput(encoded)
      setMode('decode')
      setEncodeInput('')
    } else {
      setEncodeInput(decodeResult.output)
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

        <TabsContent value="encode" className="mt-4 space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <FieldLabel className="mb-0">Plain text</FieldLabel>
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
                placeholder="Type or paste text to encode..."
                className="min-h-[260px] resize-y font-mono text-sm"
              />
            </div>
            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <FieldLabel className="mb-0">Base64 output</FieldLabel>
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
                placeholder="Base64 encoded string appears here..."
                className="min-h-[260px] resize-y font-mono text-sm bg-muted/40 break-all"
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="decode" className="mt-4 space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <FieldLabel className="mb-0">Base64 input</FieldLabel>
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
                placeholder="Paste Base64 string to decode..."
                className="min-h-[260px] resize-y font-mono text-sm break-all"
              />
            </div>
            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <FieldLabel className="mb-0">Decoded text</FieldLabel>
                <div className="flex items-center gap-2">
                  {decodeResult.error && (
                    <Badge variant="destructive" className="font-mono text-xs">error</Badge>
                  )}
                  {!decodeResult.error && decodeResult.output && (
                    <Badge variant="secondary" className="font-mono">
                      {new Blob([decodeResult.output]).size} B
                    </Badge>
                  )}
                  <CopyButton text={decodeResult.output} />
                </div>
              </div>
              {decodeResult.error ? (
                <div className="min-h-[260px] rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive flex items-center justify-center text-center">
                  {decodeResult.error}
                </div>
              ) : (
                <Textarea
                  value={decodeResult.output}
                  readOnly
                  placeholder="Decoded text appears here..."
                  className="min-h-[260px] resize-y font-mono text-sm bg-muted/40"
                />
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="mt-4 flex justify-center">
        <Button variant="outline" size="sm" onClick={swap} className="gap-1.5">
          <ArrowRightLeft className="h-4 w-4" /> Swap input / output
        </Button>
      </div>

      <p className="mt-4 text-xs text-muted-foreground text-center">
        Full UTF-8 support via <code className="font-mono">TextEncoder</code> / <code className="font-mono">TextDecoder</code>.
      </p>
    </ToolCardWrapper>
  )
}
