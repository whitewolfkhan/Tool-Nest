'use client'

import * as React from 'react'
import { ArrowRightLeft, Eraser } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { CopyButton, ToolCardWrapper, FieldLabel } from '@/components/tool-page-shell'
import { toast } from 'sonner'

export default function UrlEncodeDecode() {
  const [mode, setMode] = React.useState<'encode' | 'decode'>('encode')
  const [encodeInput, setEncodeInput] = React.useState('')
  const [decodeInput, setDecodeInput] = React.useState('')
  const [decodeError, setDecodeError] = React.useState<string | null>(null)

  const encoded = React.useMemo(() => {
    try {
      return encodeURIComponent(encodeInput)
    } catch {
      return ''
    }
  }, [encodeInput])

  React.useEffect(() => {
    if (!decodeInput) {
      setDecodeError(null)
      return
    }
    try {
      // Side-effect: validates decode — value consumed below to avoid TS unused-var.
      const _ = decodeURIComponent(decodeInput)
      void _
      setDecodeError(null)
    } catch (e) {
      setDecodeError(e instanceof Error ? e.message : 'Invalid URL-encoded input')
    }
  }, [decodeInput])

  const decoded = React.useMemo(() => {
    if (!decodeInput) return ''
    try {
      return decodeURIComponent(decodeInput)
    } catch {
      return ''
    }
  }, [decodeInput])

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
                placeholder="Enter URL or text to encode..."
                className="min-h-[260px] resize-y font-mono text-sm"
              />
            </div>
            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <FieldLabel className="mb-0">URL-encoded output</FieldLabel>
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
                placeholder="Encoded text appears here..."
                className="min-h-[260px] resize-y font-mono text-sm bg-muted/40 break-all"
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="decode" className="mt-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <FieldLabel className="mb-0">URL-encoded input</FieldLabel>
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
                placeholder="Paste URL-encoded text..."
                className="min-h-[260px] resize-y font-mono text-sm break-all"
              />
            </div>
            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <FieldLabel className="mb-0">Decoded text</FieldLabel>
                <div className="flex items-center gap-2">
                  {decodeError && (
                    <Badge variant="destructive" className="text-xs">error</Badge>
                  )}
                  {!decodeError && decoded && (
                    <Badge variant="secondary" className="font-mono">
                      {new Blob([decoded]).size} B
                    </Badge>
                  )}
                  <CopyButton text={decoded} />
                </div>
              </div>
              {decodeError ? (
                <div className="min-h-[260px] rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive flex items-center justify-center text-center">
                  {decodeError}
                </div>
              ) : (
                <Textarea
                  value={decoded}
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
        Uses <code className="font-mono">encodeURIComponent</code> / <code className="font-mono">decodeURIComponent</code>.
      </p>
    </ToolCardWrapper>
  )
}
