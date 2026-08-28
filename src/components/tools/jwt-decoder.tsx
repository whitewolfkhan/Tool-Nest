'use client'

import * as React from 'react'
import { KeyRound, ShieldAlert, ClipboardPaste, Eraser } from 'lucide-react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CopyButton, ToolCardWrapper, FieldLabel } from '@/components/tool-page-shell'

function base64UrlDecode(b64url: string): string {
  // Convert base64url to base64: replace URL-safe chars and pad.
  let s = b64url.replace(/-/g, '+').replace(/_/g, '/')
  const pad = s.length % 4
  if (pad === 2) s += '=='
  else if (pad === 3) s += '='
  else if (pad === 1) throw new Error('Invalid base64url length')
  const bin = atob(s)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return new TextDecoder().decode(bytes)
}

interface DecodedJwt {
  header: object
  payload: object
  signature: string
  parts: string[]
}

function decodeJwt(jwt: string): DecodedJwt {
  const trimmed = jwt.trim()
  const parts = trimmed.split('.')
  if (parts.length !== 3) {
    throw new Error(`Expected 3 parts separated by ".", got ${parts.length}`)
  }
  const header = JSON.parse(base64UrlDecode(parts[0]))
  const payload = JSON.parse(base64UrlDecode(parts[1]))
  return { header, payload, signature: parts[2], parts }
}

function tryPretty(obj: unknown): string {
  try {
    return JSON.stringify(obj, null, 2)
  } catch {
    return String(obj)
  }
}

export default function JwtDecoder() {
  const [input, setInput] = React.useState('')
  const [decoded, setDecoded] = React.useState<DecodedJwt | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!input.trim()) {
      setDecoded(null)
      setError(null)
      return
    }
    try {
      const d = decodeJwt(input)
      setDecoded(d)
      setError(null)
    } catch (e) {
      setDecoded(null)
      setError(e instanceof Error ? e.message : 'Invalid JWT')
    }
  }, [input])

  const paste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      setInput(text.trim())
    } catch {
      // Clipboard read may be blocked; ignore silently.
    }
  }

  const headerStr = decoded ? tryPretty(decoded.header) : ''
  const payloadStr = decoded ? tryPretty(decoded.payload) : ''

  // Inspect common payload claims for nice summary
  const summary = React.useMemo(() => {
    if (!decoded) return null
    const p = decoded.payload as Record<string, unknown>
    const out: { label: string; value: string }[] = []
    if (p.iss) out.push({ label: 'Issuer (iss)', value: String(p.iss) })
    if (p.sub) out.push({ label: 'Subject (sub)', value: String(p.sub) })
    if (p.aud) out.push({ label: 'Audience (aud)', value: String(p.aud) })
    if (p.exp) {
      const d = new Date((p.exp as number) * 1000)
      out.push({ label: 'Expires (exp)', value: d.toLocaleString() })
    }
    if (p.iat) {
      const d = new Date((p.iat as number) * 1000)
      out.push({ label: 'Issued at (iat)', value: d.toLocaleString() })
    }
    if (p.nbf) {
      const d = new Date((p.nbf as number) * 1000)
      out.push({ label: 'Not before (nbf)', value: d.toLocaleString() })
    }
    return out
  }, [decoded])

  return (
    <ToolCardWrapper>
      <div className="space-y-4">
        {/* Input */}
        <div>
          <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
            <FieldLabel className="mb-0">JWT token</FieldLabel>
            <div className="flex gap-1.5">
              <Button variant="ghost" size="sm" onClick={paste} className="gap-1.5">
                <ClipboardPaste className="h-4 w-4" /> Paste
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={!input}
                onClick={() => setInput('')}
                className="gap-1.5"
              >
                <Eraser className="h-4 w-4" /> Clear
              </Button>
            </div>
          </div>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste your JWT here (header.payload.signature)..."
            className="min-h-[120px] resize-y font-mono text-xs break-all"
            spellCheck={false}
          />
          {input && (
            <div className="mt-2 flex items-center gap-2 text-xs">
              <Badge variant="secondary" className="font-mono">
                {input.length} chars
              </Badge>
              {decoded && (
                <Badge variant="outline" className="font-mono">
                  {(decoded.header as { alg?: string }).alg ?? 'unknown'} alg
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Warning */}
        <div className="flex items-start gap-2.5 rounded-md border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900 p-3 text-xs text-amber-800 dark:text-amber-300">
          <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <strong>Decoding only.</strong> The signature is <em>not</em> verified. Never paste a
            token you don&apos;t trust being exposed — JWT payloads are base64-encoded, not encrypted,
            and may contain secrets.
          </div>
        </div>

        {error && (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            <strong>Decode error:</strong> {error}
          </div>
        )}

        {decoded && (
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <h3 className="text-sm font-semibold">Header</h3>
                <CopyButton text={headerStr} label="Copy JSON" />
              </div>
              <div className="rounded-md border border-border overflow-hidden">
                <SyntaxHighlighter
                  language="json"
                  style={oneDark}
                  customStyle={{
                    margin: 0,
                    padding: '0.75rem',
                    fontSize: '12px',
                    background: 'transparent',
                  }}
                  wrapLongLines
                >
                  {headerStr}
                </SyntaxHighlighter>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <h3 className="text-sm font-semibold">Payload</h3>
                <CopyButton text={payloadStr} label="Copy JSON" />
              </div>
              <div className="rounded-md border border-border overflow-hidden">
                <SyntaxHighlighter
                  language="json"
                  style={oneDark}
                  customStyle={{
                    margin: 0,
                    padding: '0.75rem',
                    fontSize: '12px',
                    background: 'transparent',
                  }}
                  wrapLongLines
                >
                  {payloadStr}
                </SyntaxHighlighter>
              </div>
            </div>

            {/* Signature */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-primary" /> Signature
                </h3>
                <CopyButton text={decoded.signature} label="" className="px-2" />
              </div>
              <code className="block rounded-md border border-border bg-muted/40 p-3 font-mono text-xs break-all">
                {decoded.signature || '(empty)'}
              </code>
            </div>

            {/* Summary */}
            {summary && summary.length > 0 && (
              <div className="lg:col-span-2">
                <h3 className="text-sm font-semibold mb-2">Claim summary</h3>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {summary.map((s) => (
                    <div
                      key={s.label}
                      className="rounded-md border border-border bg-muted/20 p-2.5"
                    >
                      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        {s.label}
                      </div>
                      <div className="font-mono text-xs break-all">{s.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </ToolCardWrapper>
  )
}
