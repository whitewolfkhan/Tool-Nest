'use client'

import * as React from 'react'
import { Hash, Loader2 } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { CopyButton, ToolCardWrapper, FieldLabel } from '@/components/tool-page-shell'
import { toast } from 'sonner'

/* ----------------------------- MD5 implementation ---------------------------- */
/* Compact MD5 by Joseph Myers (http://www.myersdaily.org/joseph/javascript/md5-text.html) */
/* Public domain. Adapted to TypeScript. */
function md5Cycle(x: number[], k: number[]) {
  let a = x[0], b = x[1], c = x[2], d = x[3]
  a = ff(a, b, c, d, k[0], 7, -680876936); d = ff(d, a, b, c, k[1], 12, -389564586)
  c = ff(c, d, a, b, k[2], 17, 606105819); b = ff(b, c, d, a, k[3], 22, -1044525330)
  a = ff(a, b, c, d, k[4], 7, -176418897); d = ff(d, a, b, c, k[5], 12, 1200080426)
  c = ff(c, d, a, b, k[6], 17, -1473231341); b = ff(b, c, d, a, k[7], 22, -45705983)
  a = ff(a, b, c, d, k[8], 7, 1770035416); d = ff(d, a, b, c, k[9], 12, -1958414417)
  c = ff(c, d, a, b, k[10], 17, -42063); b = ff(b, c, d, a, k[11], 22, -1990404162)
  a = ff(a, b, c, d, k[12], 7, 1804603682); d = ff(d, a, b, c, k[13], 12, -40341101)
  c = ff(c, d, a, b, k[14], 17, -1502002290); b = ff(b, c, d, a, k[15], 22, 1236535329)
  a = gg(a, b, c, d, k[1], 5, -165796510); d = gg(d, a, b, c, k[6], 9, -1069501632)
  c = gg(c, d, a, b, k[11], 14, 643717713); b = gg(b, c, d, a, k[0], 20, -373897302)
  a = gg(a, b, c, d, k[5], 5, -701558691); d = gg(d, a, b, c, k[10], 9, 38016083)
  c = gg(c, d, a, b, k[15], 14, -660478335); b = gg(b, c, d, a, k[4], 20, -405537848)
  a = gg(a, b, c, d, k[9], 5, 568446438); d = gg(d, a, b, c, k[14], 9, -1019803690)
  c = gg(c, d, a, b, k[3], 14, -187363961); b = gg(b, c, d, a, k[8], 20, 1163531501)
  a = gg(a, b, c, d, k[13], 5, -1444681467); d = gg(d, a, b, c, k[2], 9, -51403784)
  c = gg(c, d, a, b, k[7], 14, 1735328473); b = gg(b, c, d, a, k[12], 20, -1926607734)
  a = hh(a, b, c, d, k[5], 4, -378558); d = hh(d, a, b, c, k[8], 11, -2022574463)
  c = hh(c, d, a, b, k[11], 16, 1839030562); b = hh(b, c, d, a, k[14], 23, -35309556)
  a = hh(a, b, c, d, k[1], 4, -1530992060); d = hh(d, a, b, c, k[4], 11, 1272893353)
  c = hh(c, d, a, b, k[7], 16, -155497632); b = hh(b, c, d, a, k[10], 23, -1094730640)
  a = hh(a, b, c, d, k[13], 4, 681279174); d = hh(d, a, b, c, k[0], 11, -358537222)
  c = hh(c, d, a, b, k[3], 16, -722521979); b = hh(b, c, d, a, k[6], 23, 76029189)
  a = hh(a, b, c, d, k[9], 4, -640364487); d = hh(d, a, b, c, k[12], 11, -421815835)
  c = hh(c, d, a, b, k[15], 16, 530742520); b = hh(b, c, d, a, k[2], 23, -995338651)
  a = ii(a, b, c, d, k[0], 6, -198630844); d = ii(d, a, b, c, k[7], 10, 1126891415)
  c = ii(c, d, a, b, k[14], 15, -1416354905); b = ii(b, c, d, a, k[5], 21, -57434055)
  a = ii(a, b, c, d, k[12], 6, 1700485571); d = ii(d, a, b, c, k[3], 10, -1894986606)
  c = ii(c, d, a, b, k[10], 15, -1051523); b = ii(b, c, d, a, k[1], 21, -2054922799)
  a = ii(a, b, c, d, k[8], 6, 1873313359); d = ii(d, a, b, c, k[15], 10, -30611744)
  c = ii(c, d, a, b, k[6], 15, -1560198380); b = ii(b, c, d, a, k[13], 21, 1309151649)
  a = ii(a, b, c, d, k[4], 6, -145523070); d = ii(d, a, b, c, k[11], 10, -1120210379)
  c = ii(c, d, a, b, k[2], 15, 718787259); b = ii(b, c, d, a, k[9], 21, -343485551)
  x[0] = add32(a, x[0]); x[1] = add32(b, x[1]); x[2] = add32(c, x[2]); x[3] = add32(d, x[3])
}
function cmn(q: number, a: number, b: number, x: number[], s: number, t: number) {
  a = add32(add32(a, q), add32(x, t)); return add32((a << s) | (a >>> (32 - s)), b)
}
function ff(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
  return cmn((b & c) | (~b & d), a, b, x, s, t)
}
function gg(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
  return cmn((b & d) | (c & ~d), a, b, x, s, t)
}
function hh(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
  return cmn(b ^ c ^ d, a, b, x, s, t)
}
function ii(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
  return cmn(c ^ (b | ~d), a, b, x, s, t)
}
function md51(s: string): number[] {
  const n = s.length
  const state = [1732584193, -271733879, -1732584194, 271733878]
  let i: number
  for (i = 64; i <= s.length; i += 64) {
    md5Cycle(state, md5blk(s.substring(i - 64, i)))
  }
  const tail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  const sub = s.substring(i - 64)
  let j: number
  for (j = 0; j < sub.length; j++) tail[j >> 2] = sub.charCodeAt(j) << ((j % 4) << 3)
  tail[j >> 2] |= 0x80 << ((j % 4) << 3)
  if (j > 55) {
    md5Cycle(state, tail)
    for (let k = 0; k < 16; k++) tail[k] = 0
  }
  tail[14] = n * 8
  md5Cycle(state, tail)
  return state
}
function md5blk(s: string): number[] {
  const md5blks: number[] = []
  for (let i = 0; i < 64; i += 4) {
    md5blks[i >> 2] =
      s.charCodeAt(i) +
      (s.charCodeAt(i + 1) << 8) +
      (s.charCodeAt(i + 2) << 16) +
      (s.charCodeAt(i + 3) << 24)
  }
  return md5blks
}
const hexChr = '0123456789abcdef'.split('')
function rhex(n: number): string {
  let s = ''
  for (let j = 0; j < 4; j++) {
    s += hexChr[(n >> (j * 8 + 4)) & 0x0f] + hexChr[(n >> (j * 8)) & 0x0f]
  }
  return s
}
function hex(x: number[]): string {
  return x.map(rhex).join('')
}
function add32(a: number, b: number): number {
  return (a + b) & 0xffffffff
}
// UTF-8 encode before MD5 so non-ASCII input works correctly
function md5(s: string): string {
  // Encode UTF-8 to bytes, then build a binary string for charCodeAt() < 256.
  const bytes = new TextEncoder().encode(s)
  let bin = ''
  bytes.forEach((b) => (bin += String.fromCharCode(b)))
  return hex(md51(bin))
}

/* --------------------------- Web Crypto SHA helpers -------------------------- */
async function sha(algo: string, text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text)
  const buf = await crypto.subtle.digest(algo, bytes)
  const arr = Array.from(new Uint8Array(buf))
  return arr.map((b) => b.toString(16).padStart(2, '0')).join('')
}

const HASHES = [
  { id: 'md5', label: 'MD5', algo: null, bits: 128 },
  { id: 'sha1', label: 'SHA-1', algo: 'SHA-1', bits: 160 },
  { id: 'sha256', label: 'SHA-256', algo: 'SHA-256', bits: 256 },
  { id: 'sha384', label: 'SHA-384', algo: 'SHA-384', bits: 384 },
  { id: 'sha512', label: 'SHA-512', algo: 'SHA-512', bits: 512 },
] as const

type HashId = (typeof HASHES)[number]['id']

export default function HashGenerator() {
  const [input, setInput] = React.useState('')
  const [selected, setSelected] = React.useState<Record<HashId, boolean>>({
    md5: true,
    sha1: true,
    sha256: true,
    sha384: false,
    sha512: false,
  })
  const [results, setResults] = React.useState<Record<string, string>>({})
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    let cancelled = false
    if (!input) {
      setResults({})
      return
    }
    setLoading(true)
    const run = async () => {
      const next: Record<string, string> = {}
      for (const h of HASHES) {
        if (!selected[h.id]) continue
        if (h.algo === null) {
          next[h.id] = md5(input)
        } else {
          next[h.id] = await sha(h.algo, input)
        }
      }
      if (!cancelled) {
        setResults(next)
        setLoading(false)
      }
    }
    // Debounce slightly so very large inputs don't thrash.
    const t = setTimeout(run, 80)
    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [input, selected])

  const toggle = (id: HashId) => {
    setSelected((s) => ({ ...s, [id]: !s[id] }))
  }

  const enabled = HASHES.filter((h) => selected[h.id])

  return (
    <ToolCardWrapper>
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Input + results */}
        <div className="space-y-4">
          <div>
            <FieldLabel>Input text</FieldLabel>
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type or paste text to hash..."
              className="min-h-[140px] resize-y font-mono text-sm"
            />
          </div>

          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Hash className="h-4 w-4 text-primary" /> Digest output
                {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
              </h3>
              {input && (
                <Badge variant="secondary" className="font-mono text-xs">
                  {new Blob([input]).size} B
                </Badge>
              )}
            </div>

            {!input ? (
              <div className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                Output appears here once you enter text
              </div>
            ) : (
              <ul className="space-y-2">
                {enabled.map((h) => {
                  const val = results[h.id]
                  return (
                    <li
                      key={h.id}
                      className="rounded-md border border-border bg-muted/30 p-3"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="font-mono text-[10px]">
                            {h.bits}-bit
                          </Badge>
                          <span className="text-sm font-semibold">{h.label}</span>
                        </div>
                        <CopyButton text={val || ''} label="" className="px-2" />
                      </div>
                      <code className="block break-all font-mono text-xs text-foreground/90">
                        {val || '…'}
                      </code>
                    </li>
                  )
                })}
                {enabled.length === 0 && (
                  <li className="rounded-md border border-dashed border-border p-3 text-center text-xs text-muted-foreground">
                    Select at least one algorithm on the right
                  </li>
                )}
              </ul>
            )}
          </div>
        </div>

        {/* Algorithm picker */}
        <div className="space-y-3">
          <FieldLabel>Algorithms</FieldLabel>
          <div className="space-y-2">
            {HASHES.map((h) => (
              <label
                key={h.id}
                htmlFor={`hash-${h.id}`}
                className="flex items-center justify-between gap-3 rounded-md border border-border p-3 hover:bg-accent/40 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Checkbox
                    id={`hash-${h.id}`}
                    checked={selected[h.id]}
                    onCheckedChange={() => toggle(h.id)}
                  />
                  <div>
                    <div className="text-sm font-medium">{h.label}</div>
                    <div className="text-[11px] text-muted-foreground font-mono">{h.bits} bits</div>
                  </div>
                </div>
              </label>
            ))}
          </div>

          <div className="rounded-md border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900 p-3 text-[11px] text-amber-800 dark:text-amber-300">
            <strong>Note:</strong> MD5 and SHA-1 are cryptographically broken — use them only for checksums, not security.
            SHA-256+ use the browser&apos;s <code className="font-mono">crypto.subtle</code> API.
          </div>
        </div>
      </div>
    </ToolCardWrapper>
  )
}
