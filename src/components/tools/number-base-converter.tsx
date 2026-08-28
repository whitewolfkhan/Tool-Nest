'use client'

import * as React from 'react'
import { Hash, Binary, Octagon, Sigma, Hexagon, FileText, FileLock } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ToolCardWrapper, FieldLabel, CopyButton } from '@/components/tool-page-shell'
import { toast } from 'sonner'

type Base = '2' | '8' | '10' | '16' | '32' | '64'

const BASE_LIST: { id: Base; label: string; icon: React.ElementType; description: string }[] = [
  { id: '2', label: 'Binary', icon: Binary, description: 'Base 2 (0-1)' },
  { id: '8', label: 'Octal', icon: Octagon, description: 'Base 8 (0-7)' },
  { id: '10', label: 'Decimal', icon: Sigma, description: 'Base 10 (0-9)' },
  { id: '16', label: 'Hexadecimal', icon: Hexagon, description: 'Base 16 (0-9, A-F)' },
  { id: '32', label: 'Base32', icon: FileText, description: 'RFC 4648 (A-Z, 2-7)' },
  { id: '64', label: 'Base64', icon: FileLock, description: 'RFC 4648 (A-Z, a-z, 0-9, +, /)' },
]

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

function encodeBase32(input: string): string {
  const bytes = new TextEncoder().encode(input)
  let output = ''
  let bits = 0
  let value = 0
  for (const byte of bytes) {
    value = (value << 8) | byte
    bits += 8
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 0x1f]
      bits -= 5
    }
  }
  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 0x1f]
  }
  while (output.length % 8 !== 0) {
    output += '='
  }
  return output
}

function decodeBase32(input: string): string {
  const clean = input.replace(/=+$/, '').toUpperCase()
  let bits = 0
  let value = 0
  const bytes: number[] = []
  for (const char of clean) {
    const idx = BASE32_ALPHABET.indexOf(char)
    if (idx === -1) throw new Error(`Invalid Base32 character: ${char}`)
    value = (value << 5) | idx
    bits += 5
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff)
      bits -= 8
    }
  }
  return new TextDecoder().decode(new Uint8Array(bytes))
}

function encodeBase64(input: string): string {
  try {
    return btoa(unescape(encodeURIComponent(input)))
  } catch {
    return ''
  }
}

function decodeBase64(input: string): string {
  try {
    return decodeURIComponent(escape(atob(input)))
  } catch {
    throw new Error('Invalid Base64 input')
  }
}

// Parse fractional number string in given radix (2,8,10,16)
function parseRadix(value: string, radix: number): number {
  if (!value) return NaN
  const [intPart, fracPart] = value.split('.')
  let intParsed: number
  if (intPart === '' || intPart === '-' || intPart === '+') {
    intParsed = 0
  } else {
    intParsed = parseInt(intPart, radix)
    if (isNaN(intParsed)) return NaN
  }
  let sign = 1
  if (value.trim().startsWith('-')) sign = -1
  let frac = 0
  if (fracPart !== undefined) {
    let place = 1 / radix
    for (const c of fracPart) {
      const digit = parseInt(c, radix)
      if (isNaN(digit)) return NaN
      frac += digit * place
      place /= radix
    }
  }
  return sign * (Math.abs(intParsed) + frac)
}

function toRadix(num: number, radix: number): string {
  if (isNaN(num) || !isFinite(num)) return ''
  const sign = num < 0 ? '-' : ''
  const abs = Math.abs(num)
  const intPart = Math.floor(abs)
  const fracPart = abs - intPart
  let intStr = intPart.toString(radix).toUpperCase()
  let fracStr = ''
  if (fracPart > 0) {
    let place = fracPart
    const digits: string[] = []
    let maxDigits = 32
    while (place > 0 && maxDigits > 0) {
      place *= radix
      const d = Math.floor(place)
      digits.push(d.toString(radix).toUpperCase())
      place -= d
      maxDigits--
    }
    fracStr = '.' + digits.join('')
  }
  return sign + intStr + fracStr
}

// Convert value from a base into a number
function parseValue(value: string, base: Base): number {
  if (!value) return NaN
  if (base === '32') {
    const decoded = decodeBase32(value)
    const n = parseFloat(decoded)
    if (isNaN(n)) throw new Error('Decoded Base32 is not a number')
    return n
  }
  if (base === '64') {
    const decoded = decodeBase64(value)
    const n = parseFloat(decoded)
    if (isNaN(n)) throw new Error('Decoded Base64 is not a number')
    return n
  }
  return parseRadix(value, parseInt(base))
}

// Convert number to a base representation
function toBase(num: number, base: Base): string {
  if (isNaN(num) || !isFinite(num)) return ''
  if (base === '32') {
    return encodeBase32(num.toString())
  }
  if (base === '64') {
    return encodeBase64(num.toString())
  }
  return toRadix(num, parseInt(base))
}

function fmtNum(n: number): string {
  if (isNaN(n)) return '—'
  if (!isFinite(n)) return '∞'
  return n.toLocaleString('en-US', { maximumFractionDigits: 12 })
}

export default function NumberBaseConverter() {
  const [input, setInput] = React.useState('255')
  const [base, setBase] = React.useState<Base>('10')
  const [num, setNum] = React.useState<number>(255)
  const [error, setError] = React.useState<string>('')

  React.useEffect(() => {
    if (!input) {
      setError('')
      setNum(NaN)
      return
    }
    try {
      const parsed = parseValue(input, base)
      if (isNaN(parsed)) {
        setError('Invalid number for this base')
        setNum(NaN)
      } else {
        setError('')
        setNum(parsed)
      }
    } catch (e) {
      setError((e as Error).message)
      setNum(NaN)
    }
  }, [input, base])

  const inputIcon = BASE_LIST.find((b) => b.id === base)?.icon

  return (
    <ToolCardWrapper>
      {/* Input + base selector */}
      <div className="grid gap-4 lg:grid-cols-[1fr_220px] items-end">
        <div>
          <FieldLabel>Number to convert</FieldLabel>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {inputIcon && <inputIcon className="h-4 w-4" />}
            </span>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter value..."
              className="pl-10 font-mono text-base"
              spellCheck={false}
            />
          </div>
        </div>
        <div>
          <FieldLabel>Input base</FieldLabel>
          <Select value={base} onValueChange={(v) => setBase(v as Base)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BASE_LIST.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.label} (base {b.id})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {error && (
        <p className="mt-2 text-sm text-destructive">{error}</p>
      )}

      {/* Live preview of decimal value */}
      <div className="mt-4 flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">Decimal value:</span>
        <span className="font-mono font-semibold">{fmtNum(num)}</span>
      </div>

      {/* Dashboard: all bases simultaneously */}
      <div className="mt-6">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Hash className="h-4 w-4 text-primary" />
          All base representations
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {BASE_LIST.map((b) => {
            const out = !isNaN(num) ? toBase(num, b.id) : ''
            return (
              <div
                key={b.id}
                className="group rounded-lg border border-border bg-muted/30 p-3 hover:border-primary/40 transition-colors"
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <b.icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-xs font-semibold uppercase tracking-wide">
                      {b.label}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      base {b.id}
                    </span>
                  </div>
                  <CopyButton text={out} label="" className="h-7 px-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="font-mono text-sm break-all min-h-[1.25rem]">
                  {out || <span className="text-muted-foreground">—</span>}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Help text */}
      <div className="mt-5 rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
        <p className="mb-1 font-medium text-foreground">Notes</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Binary, Octal, Decimal and Hex support fractional numbers (e.g. <code className="font-mono">1011.101</code>).</li>
          <li>Base32 and Base64 are text encodings — the decimal value is encoded as a string per RFC 4648.</li>
          <li>Hex digits are case-insensitive on input, upper-case on output.</li>
        </ul>
      </div>
    </ToolCardWrapper>
  )
}
