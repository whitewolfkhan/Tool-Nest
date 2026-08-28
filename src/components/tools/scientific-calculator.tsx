'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ToolCardWrapper } from '@/components/tool-page-shell'
import { toast } from 'sonner'

/* ============================================================
   Safe expression evaluator (shunting-yard + RPN, NO eval)
   ============================================================ */

type Token =
  | { type: 'num'; value: number }
  | { type: 'op'; value: string }
  | { type: 'fn'; value: string }
  | { type: 'lparen' }
  | { type: 'rparen' }
  | { type: 'comma' }

const FUNCTIONS = ['asin', 'acos', 'atan', 'sin', 'cos', 'tan', 'log', 'ln', 'sqrt', 'abs']

function tokenize(s: string): Token[] {
  const tokens: Token[] = []
  let i = 0
  while (i < s.length) {
    const ch = s[i]
    if (ch === ' ') { i++; continue }

    // Number
    if ((ch >= '0' && ch <= '9') || ch === '.') {
      let num = ''
      while (i < s.length && ((s[i] >= '0' && s[i] <= '9') || s[i] === '.')) {
        num += s[i]
        i++
      }
      tokens.push({ type: 'num', value: parseFloat(num) })
      continue
    }

    // π constant
    if (ch === 'π') {
      tokens.push({ type: 'num', value: Math.PI })
      i++
      continue
    }
    // e constant (only if not part of an identifier)
    if (ch === 'e' && !/[a-zA-Z]/.test(s[i + 1] || '')) {
      tokens.push({ type: 'num', value: Math.E })
      i++
      continue
    }

    // Function names (longest match first since array is sorted longest-first)
    let matched = false
    for (const fn of FUNCTIONS) {
      if (s.toLowerCase().startsWith(fn, i)) {
        const next = s[i + fn.length]
        if (!next || !/[a-zA-Z]/.test(next)) {
          tokens.push({ type: 'fn', value: fn })
          i += fn.length
          matched = true
          break
        }
      }
    }
    if (matched) continue

    // Operators
    if ('+-*/%^!'.includes(ch)) {
      tokens.push({ type: 'op', value: ch })
      i++
      continue
    }
    if (ch === '(') { tokens.push({ type: 'lparen' }); i++; continue }
    if (ch === ')') { tokens.push({ type: 'rparen' }); i++; continue }
    if (ch === ',') { tokens.push({ type: 'comma' }); i++; continue }

    // Unknown — skip
    i++
  }
  return tokens
}

const PREC: Record<string, number> = {
  '+': 1, '-': 1,
  '*': 2, '/': 2, '%': 2,
  '^': 3,
  'u-': 5,
  '!': 4,
}
const RIGHT_ASSOC = new Set(['^', 'u-'])

function toRPN(tokens: Token[]): Token[] {
  const output: Token[] = []
  const stack: Token[] = []
  let prev: Token | null = null

  for (const t of tokens) {
    if (t.type === 'num') {
      output.push(t)
    } else if (t.type === 'fn') {
      stack.push(t)
    } else if (t.type === 'comma') {
      while (stack.length && stack[stack.length - 1].type !== 'lparen') {
        output.push(stack.pop()!)
      }
    } else if (t.type === 'op') {
      const isUnary =
        (t.value === '-' || t.value === '+') &&
        (prev === null ||
          (prev.type === 'op' && prev.value !== '!' && prev.value !== 'u-') ||
          prev.type === 'lparen' ||
          prev.type === 'comma')
      if (isUnary) {
        if (t.value === '-') stack.push({ type: 'op', value: 'u-' })
        // unary + is a no-op
      } else {
        while (stack.length) {
          const top = stack[stack.length - 1]
          if (top.type === 'op' && top.value !== 'u-') {
            const topPrec = PREC[top.value] ?? 0
            const curPrec = PREC[t.value] ?? 0
            if (topPrec > curPrec || (topPrec === curPrec && !RIGHT_ASSOC.has(t.value))) {
              output.push(stack.pop()!)
              continue
            }
          }
          if (top.type === 'fn') {
            output.push(stack.pop()!)
            continue
          }
          break
        }
        stack.push(t)
      }
    } else if (t.type === 'lparen') {
      stack.push(t)
    } else if (t.type === 'rparen') {
      while (stack.length && stack[stack.length - 1].type !== 'lparen') {
        output.push(stack.pop()!)
      }
      stack.pop()
      if (stack.length && stack[stack.length - 1].type === 'fn') {
        output.push(stack.pop()!)
      }
    }
    prev = t
  }
  while (stack.length) {
    const t = stack.pop()!
    if (t.type === 'lparen' || t.type === 'rparen') continue
    output.push(t)
  }
  return output
}

function factorial(n: number): number {
  if (n < 0 || !Number.isInteger(n)) return NaN
  if (n > 170) return Infinity
  let r = 1
  for (let i = 2; i <= n; i++) r *= i
  return r
}

interface EvalOptions {
  angleMode: 'deg' | 'rad'
}

function evalRPN(rpn: Token[], opts: EvalOptions): number {
  const toRad = (x: number) => (opts.angleMode === 'deg' ? (x * Math.PI) / 180 : x)
  const fromRad = (x: number) => (opts.angleMode === 'deg' ? (x * 180) / Math.PI : x)
  const stack: number[] = []
  for (const t of rpn) {
    if (t.type === 'num') {
      stack.push(t.value)
    } else if (t.type === 'op') {
      if (t.value === 'u-') {
        stack.push(-(stack.pop() ?? 0))
      } else if (t.value === '!') {
        stack.push(factorial(stack.pop() ?? 0))
      } else {
        const b = stack.pop() ?? 0
        const a = stack.pop() ?? 0
        switch (t.value) {
          case '+': stack.push(a + b); break
          case '-': stack.push(a - b); break
          case '*': stack.push(a * b); break
          case '/': stack.push(a / b); break
          case '%': stack.push(a % b); break
          case '^': stack.push(Math.pow(a, b)); break
        }
      }
    } else if (t.type === 'fn') {
      const a = stack.pop() ?? 0
      switch (t.value) {
        case 'sin': stack.push(Math.sin(toRad(a))); break
        case 'cos': stack.push(Math.cos(toRad(a))); break
        case 'tan': stack.push(Math.tan(toRad(a))); break
        case 'asin': stack.push(fromRad(Math.asin(a))); break
        case 'acos': stack.push(fromRad(Math.acos(a))); break
        case 'atan': stack.push(fromRad(Math.atan(a))); break
        case 'log': stack.push(Math.log10(a)); break
        case 'ln': stack.push(Math.log(a)); break
        case 'sqrt': stack.push(Math.sqrt(a)); break
        case 'abs': stack.push(Math.abs(a)); break
      }
    }
  }
  return stack[stack.length - 1] ?? 0
}

function evaluate(expr: string, opts: EvalOptions): number {
  try {
    const tokens = tokenize(expr)
    if (tokens.length === 0) return NaN
    const rpn = toRPN(tokens)
    return evalRPN(rpn, opts)
  } catch {
    return NaN
  }
}

function formatResult(n: number): string {
  if (!isFinite(n) || isNaN(n)) return ''
  if (Math.abs(n) >= 1e15) return n.toExponential(6)
  const rounded = Math.round(n * 1e10) / 1e10
  return rounded.toString()
}

/* ============================================================
   UI
   ============================================================ */

interface BtnProps {
  label: React.ReactNode
  onClick: () => void
  variant?: 'outline' | 'secondary' | 'default' | 'destructive'
  className?: string
  ariaLabel?: string
}

function Btn({
  label,
  onClick,
  variant = 'outline',
  className = '',
  ariaLabel,
}: BtnProps) {
  return (
    <Button
      variant={variant}
      onClick={onClick}
      className={`h-12 text-sm sm:text-base font-medium ${className}`}
      aria-label={ariaLabel}
    >
      {label}
    </Button>
  )
}

export default function ScientificCalculator() {
  const [expr, setExpr] = React.useState('')
  const [angleMode, setAngleMode] = React.useState<'deg' | 'rad'>('deg')
  const [memory, setMemory] = React.useState(0)
  const [justEvaluated, setJustEvaluated] = React.useState(false)

  const liveResult = React.useMemo(() => {
    if (!expr) return ''
    return formatResult(evaluate(expr, { angleMode }))
  }, [expr, angleMode])

  const insertAt = (text: string) => {
    setExpr((cur) => {
      if (justEvaluated) {
        const startFresh = /^[\dπe(.]/.test(text) || /^[a-z]/i.test(text)
        if (startFresh) return text
        return cur + text
      }
      return cur + text
    })
    setJustEvaluated(false)
  }

  const handleAction = (action: 'clear' | 'backspace' | 'equals') => {
    if (action === 'clear') {
      setExpr('')
      setJustEvaluated(false)
    } else if (action === 'backspace') {
      setExpr((cur) => cur.slice(0, -1))
      setJustEvaluated(false)
    } else if (action === 'equals') {
      const result = evaluate(expr, { angleMode })
      if (!isFinite(result) || isNaN(result)) {
        toast.error('Invalid expression')
        return
      }
      setExpr(formatResult(result))
      setJustEvaluated(true)
    }
  }

  const handleReciprocal = () => {
    const current = evaluate(expr, { angleMode })
    if (!isFinite(current) || isNaN(current) || current === 0) {
      toast.error('Cannot compute reciprocal')
      return
    }
    setExpr(formatResult(1 / current))
    setJustEvaluated(true)
  }

  const handleMemory = (op: 'MC' | 'MR' | 'M+' | 'M-') => {
    const current = evaluate(expr, { angleMode })
    const curValid = isFinite(current) && !isNaN(current)
    if (op === 'MC') {
      setMemory(0)
      toast.success('Memory cleared')
    } else if (op === 'MR') {
      insertAt(formatResult(memory))
    } else if (op === 'M+') {
      if (curValid) setMemory((m) => m + current)
    } else if (op === 'M-') {
      if (curValid) setMemory((m) => m - current)
    }
  }

  // Keyboard support
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return
      }
      const k = e.key
      if (k.length === 1 && /^[0-9.+\-*/^%()!]$/.test(k)) {
        insertAt(k)
        e.preventDefault()
      } else if (k === 'Enter' || k === '=') {
        handleAction('equals')
        e.preventDefault()
      } else if (k === 'Backspace') {
        handleAction('backspace')
        e.preventDefault()
      } else if (k === 'Escape') {
        handleAction('clear')
        e.preventDefault()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <ToolCardWrapper>
      {/* Display */}
      <div className="rounded-lg bg-muted/50 p-4 mb-4">
        <div className="flex items-center justify-between mb-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAngleMode((m) => (m === 'deg' ? 'rad' : 'deg'))}
              className="px-2 py-0.5 rounded border border-border bg-background font-medium hover:bg-accent"
              aria-label="Toggle angle mode"
            >
              {angleMode.toUpperCase()}
            </button>
            {memory !== 0 && (
              <Badge variant="secondary" className="text-xs">
                M = {formatResult(memory)}
              </Badge>
            )}
          </div>
          <span className="font-mono text-xs">Scientific</span>
        </div>

        {/* Live preview line */}
        <div className="text-right font-mono text-sm text-muted-foreground break-all min-h-[1.25rem]">
          {expr && !justEvaluated && liveResult ? `= ${liveResult}` : '\u00A0'}
        </div>

        {/* Main expression / result */}
        <div className="text-right font-mono text-3xl sm:text-4xl font-bold mt-1 break-all">
          {expr || '0'}
        </div>
      </div>

      {/* Button grid */}
      <div className="grid grid-cols-5 gap-2">
        {/* Row 1: memory + angle */}
        <Btn label="MC" onClick={() => handleMemory('MC')} ariaLabel="Memory clear" />
        <Btn label="MR" onClick={() => handleMemory('MR')} ariaLabel="Memory recall" />
        <Btn label="M+" onClick={() => handleMemory('M+')} ariaLabel="Memory add" />
        <Btn label="M−" onClick={() => handleMemory('M-')} ariaLabel="Memory subtract" />
        <Btn
          label={angleMode.toUpperCase()}
          onClick={() => setAngleMode((m) => (m === 'deg' ? 'rad' : 'deg'))}
          variant="secondary"
          ariaLabel="Toggle angle mode"
        />

        {/* Row 2: trig + constants */}
        <Btn label="sin" onClick={() => insertAt('sin(')} />
        <Btn label="cos" onClick={() => insertAt('cos(')} />
        <Btn label="tan" onClick={() => insertAt('tan(')} />
        <Btn label="π" onClick={() => insertAt('π')} />
        <Btn label="e" onClick={() => insertAt('e')} />

        {/* Row 3: inverse trig + log */}
        <Btn label="sin⁻¹" onClick={() => insertAt('asin(')} />
        <Btn label="cos⁻¹" onClick={() => insertAt('acos(')} />
        <Btn label="tan⁻¹" onClick={() => insertAt('atan(')} />
        <Btn label="ln" onClick={() => insertAt('ln(')} />
        <Btn label="log" onClick={() => insertAt('log(')} />

        {/* Row 4: powers + parens */}
        <Btn label="√" onClick={() => insertAt('sqrt(')} />
        <Btn label="xʸ" onClick={() => insertAt('^')} />
        <Btn label="x!" onClick={() => insertAt('!')} />
        <Btn label="(" onClick={() => insertAt('(')} />
        <Btn label=")" onClick={() => insertAt(')')} />

        {/* Row 5: clear / backspace / percent / div / mul */}
        <Btn label="C" onClick={() => handleAction('clear')} variant="destructive" />
        <Btn label="⌫" onClick={() => handleAction('backspace')} variant="secondary" ariaLabel="Backspace" />
        <Btn label="%" onClick={() => insertAt('%')} variant="secondary" />
        <Btn label="÷" onClick={() => insertAt('/')} variant="secondary" />
        <Btn label="×" onClick={() => insertAt('*')} variant="secondary" />

        {/* Row 6: 7 8 9 - + */}
        <Btn label="7" onClick={() => insertAt('7')} />
        <Btn label="8" onClick={() => insertAt('8')} />
        <Btn label="9" onClick={() => insertAt('9')} />
        <Btn label="−" onClick={() => insertAt('-')} variant="secondary" />
        <Btn label="+" onClick={() => insertAt('+')} variant="secondary" />

        {/* Row 7: 4 5 6 . 1/x */}
        <Btn label="4" onClick={() => insertAt('4')} />
        <Btn label="5" onClick={() => insertAt('5')} />
        <Btn label="6" onClick={() => insertAt('6')} />
        <Btn label="." onClick={() => insertAt('.')} />
        <Btn label="1/x" onClick={handleReciprocal} variant="secondary" />

        {/* Row 8: 1 2 3 0 = */}
        <Btn label="1" onClick={() => insertAt('1')} />
        <Btn label="2" onClick={() => insertAt('2')} />
        <Btn label="3" onClick={() => insertAt('3')} />
        <Btn label="0" onClick={() => insertAt('0')} />
        <Btn label="=" onClick={() => handleAction('equals')} variant="default" />
      </div>

      <p className="text-xs text-muted-foreground mt-4 text-center">
        Tip: Use your keyboard — Enter for =, Esc to clear, Backspace to delete.
      </p>
    </ToolCardWrapper>
  )
}
