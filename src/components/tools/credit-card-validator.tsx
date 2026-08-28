'use client'

import * as React from 'react'
import { CreditCard, ShieldCheck, ShieldAlert } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ToolCardWrapper, FieldLabel } from '@/components/tool-page-shell'

interface CardBrand {
  name: string
  pattern: RegExp
  length: number[]
  cvvLength: number
  color: string
  icon: string
}

const BRANDS: CardBrand[] = [
  {
    name: 'Visa',
    pattern: /^4\d{0,}$/,
    length: [13, 16, 19],
    cvvLength: 3,
    color: 'bg-blue-500',
    icon: 'VISA',
  },
  {
    name: 'Mastercard',
    pattern: /^(5[1-5]|2[2-7])\d{0,}$/,
    length: [16],
    cvvLength: 3,
    color: 'bg-orange-500',
    icon: 'MC',
  },
  {
    name: 'American Express',
    pattern: /^3[47]\d{0,}$/,
    length: [15],
    cvvLength: 4,
    color: 'bg-teal-600',
    icon: 'AMEX',
  },
  {
    name: 'Discover',
    pattern: /^(6011|65|64[4-9])\d{0,}$/,
    length: [16, 19],
    cvvLength: 3,
    color: 'bg-amber-600',
    icon: 'DISC',
  },
  {
    name: 'JCB',
    pattern: /^35\d{0,}$/,
    length: [16, 17, 18, 19],
    cvvLength: 3,
    color: 'bg-emerald-600',
    icon: 'JCB',
  },
  {
    name: 'Diners Club',
    pattern: /^(36|30[0-5]|3095|38|39)\d{0,}$/,
    length: [14, 16, 19],
    cvvLength: 3,
    color: 'bg-rose-600',
    icon: 'DC',
  },
  {
    name: 'UnionPay',
    pattern: /^(62|81)\d{0,}$/,
    length: [16, 17, 18, 19],
    cvvLength: 3,
    color: 'bg-red-700',
    icon: 'UP',
  },
  {
    name: 'Maestro',
    pattern: /^(50|56|57|58|639|6759|676[1-3])\d{0,}$/,
    length: [12, 13, 14, 15, 16, 17, 18, 19],
    cvvLength: 3,
    color: 'bg-purple-600',
    icon: 'MAE',
  },
]

function detectBrand(digits: string): CardBrand | null {
  for (const b of BRANDS) {
    if (b.pattern.test(digits)) return b
  }
  return null
}

function luhnCheck(digits: string): boolean {
  if (!/^\d+$/.test(digits)) return false
  let sum = 0
  let dbl = false
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = parseInt(digits[i], 10)
    if (dbl) {
      d *= 2
      if (d > 9) d -= 9
    }
    sum += d
    dbl = !dbl
  }
  return sum % 10 === 0
}

function formatCard(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 19)
  // Amex format: 4-6-5
  if (/^3[47]/.test(digits)) {
    const a = digits.slice(0, 4)
    const b = digits.slice(4, 10)
    const c = digits.slice(10, 15)
    return [a, b, c].filter(Boolean).join(' ')
  }
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim()
}

export default function CreditCardValidator() {
  const [raw, setRaw] = React.useState('')

  const digits = raw.replace(/\D/g, '')
  const brand = detectBrand(digits)
  const luhnValid = digits.length >= 12 ? luhnCheck(digits) : false
  const lengthValid = brand
    ? brand.length.includes(digits.length)
    : digits.length >= 12 && digits.length <= 19

  const isValid = luhnValid && lengthValid && !!brand
  const hasInput = digits.length > 0

  return (
    <div className="space-y-4">
      <ToolCardWrapper>
        <div className="flex items-center gap-2 mb-3">
          <CreditCard className="h-5 w-5 text-primary" />
          <h2 className="text-base font-semibold">Card Number</h2>
        </div>
        <FieldLabel>Enter your card number</FieldLabel>
        <Input
          value={formatCard(raw)}
          onChange={(e) => setRaw(e.target.value)}
          placeholder="0000 0000 0000 0000"
          inputMode="numeric"
          autoComplete="off"
          className="font-mono text-base h-12 tracking-wide"
        />
        <div className="mt-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 p-3 flex items-start gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
          <p className="text-xs text-emerald-700 dark:text-emerald-400">
            <strong>Privacy note:</strong> Your card number is never stored,
            transmitted, or sent to any server. All validation runs entirely in
            your browser and is discarded when you leave the page.
          </p>
        </div>
      </ToolCardWrapper>

      {hasInput && (
        <ToolCardWrapper>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-muted-foreground mb-2">
                Detected brand
              </div>
              {brand ? (
                <div
                  className={`flex items-center gap-3 rounded-xl ${brand.color} text-white p-4 shadow`}
                >
                  <div className="font-bold text-sm tracking-wide">
                    {brand.icon}
                  </div>
                  <div className="text-base font-semibold">{brand.name}</div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                  Unknown / unrecognized brand
                </div>
              )}
            </div>

            <div>
              <div className="text-xs text-muted-foreground mb-2">Validity</div>
              <div
                className={`flex items-center gap-3 rounded-xl border p-4 ${
                  isValid
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
                    : 'border-rose-500 bg-rose-50 dark:bg-rose-950/30'
                }`}
              >
                {isValid ? (
                  <ShieldCheck className="h-6 w-6 text-emerald-600" />
                ) : (
                  <ShieldAlert className="h-6 w-6 text-rose-600" />
                )}
                <div>
                  <div
                    className={`text-base font-semibold ${
                      isValid
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-rose-700 dark:text-rose-400'
                    }`}
                  >
                    {isValid ? 'Valid Card' : 'Invalid Card'}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {digits.length === 0
                      ? 'Enter a card number'
                      : !brand
                      ? 'Brand not recognized'
                      : !lengthValid
                      ? `Expected ${brand?.length.join(', ')} digits`
                      : 'Luhn checksum failed'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            <Stat label="Digits" value={String(digits.length)} />
            <Stat
              label="Luhn check"
              value={luhnValid ? 'PASS' : 'FAIL'}
              ok={luhnValid}
            />
            <Stat
              label="Length"
              value={lengthValid ? 'OK' : 'Bad'}
              ok={lengthValid}
            />
            <Stat
              label="CVV length"
              value={brand ? String(brand.cvvLength) : '—'}
            />
          </div>
        </ToolCardWrapper>
      )}

      <ToolCardWrapper>
        <div className="flex items-center gap-2 mb-3">
          <Badge variant="secondary">Supported brands</Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          {BRANDS.map((b) => (
            <div
              key={b.name}
              className={`rounded-md ${b.color} text-white px-3 py-1.5 text-xs font-medium`}
            >
              {b.name}
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          We validate using the Luhn algorithm and IIN/issuer-identification
          number ranges. This does not confirm the card actually exists or has
          funds — only that the number is structurally valid.
        </p>
      </ToolCardWrapper>
    </div>
  )
}

function Stat({
  label,
  value,
  ok,
}: {
  label: string
  value: string
  ok?: boolean
}) {
  return (
    <div className="rounded-lg border border-border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div
        className={`text-sm font-semibold font-mono ${
          ok === undefined
            ? ''
            : ok
            ? 'text-emerald-600'
            : 'text-rose-600'
        }`}
      >
        {value}
      </div>
    </div>
  )
}
