'use client'

import * as React from 'react'
import { Minimize2, Eraser, FileDown } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CopyButton, DownloadButton, ToolCardWrapper, FieldLabel } from '@/components/tool-page-shell'
import { toast } from 'sonner'

type TokType = 'word' | 'string' | 'regex' | 'punct' | 'whitespace' | 'comment'
interface Token {
  type: TokType
  value: string
}

const PUNCT3 = ['===', '!==', '**=', '>>>', '...', '>>>']
const PUNCT2 = [
  '==', '!=', '<=', '>=', '&&', '||', '++', '--', '+=', '-=', '*=', '/=', '%=',
  '&=', '|=', '^=', '=>', '<<', '>>', '??', '?.', '**',
]

function tokenize(src: string): Token[] {
  const out: Token[] = []
  let i = 0
  const n = src.length

  const isWord = (c: string) => /[A-Za-z0-9_$]/.test(c)
  // Determine if `/` at position i starts a regex (true) or division (false)
  const startsRegex = () => {
    // Look back through previous emitted tokens, skipping whitespace/comments
    for (let j = out.length - 1; j >= 0; j--) {
      const t = out[j]
      if (t.type === 'whitespace' || t.type === 'comment') continue
      const v = t.value
      // After these, `/` is division
      if (t.type === 'word') {
        if (/^(?:true|false|null|undefined|this|super)$/.test(v)) return false
        return true // identifier or number → next `/` is regex
      }
      if (t.type === 'string' || t.type === 'regex') return true
      // punct
      if (v === ')' || v === ']' || v === '}') {
        // `}` after a block statement could be followed by regex; ambiguous. Treat `}` as regex-trigger.
        // This matches most common ASI expectations. Slight over-conservatism is safer than breaking regex.
        return false
      }
      // After `(` `[` `{` `,` `;` `=` `:` `?` `&&` `||` etc., `/` is regex
      return true
    }
    return true // beginning of file → regex
  }

  while (i < n) {
    const c = src[i]
    // Whitespace
    if (/\s/.test(c)) {
      let j = i + 1
      while (j < n && /\s/.test(src[j])) j++
      out.push({ type: 'whitespace', value: src.slice(i, j) })
      i = j
      continue
    }
    // Comments
    if (c === '/' && src[i + 1] === '/') {
      let j = i + 2
      while (j < n && src[j] !== '\n') j++
      out.push({ type: 'comment', value: src.slice(i, j) })
      i = j
      continue
    }
    if (c === '/' && src[i + 1] === '*') {
      let j = i + 2
      while (j < n && !(src[j] === '*' && src[j + 1] === '/')) j++
      j = Math.min(n, j + 2)
      out.push({ type: 'comment', value: src.slice(i, j) })
      i = j
      continue
    }
    // Strings
    if (c === '"' || c === "'" || c === '`') {
      const quote = c
      let j = i + 1
      while (j < n) {
        if (src[j] === '\\') {
          j += 2
          continue
        }
        if (src[j] === quote) {
          j++
          break
        }
        // Template literal: stop at `${` ... handled crudely by ignoring
        if (quote === '`' && src[j] === '$' && src[j + 1] === '{') {
          // Skip to matching } — naive: just find next `}` (works for simple cases)
          j += 2
          let depth = 1
          while (j < n && depth > 0) {
            if (src[j] === '{') depth++
            else if (src[j] === '}') depth--
            if (depth === 0) break
            j++
          }
          j++
          continue
        }
        if (src[j] === '\n' && quote !== '`') {
          // Unterminated string literal — bail out, keep as-is
          break
        }
        j++
      }
      out.push({ type: 'string', value: src.slice(i, j) })
      i = j
      continue
    }
    // Regex literal
    if (c === '/' && startsRegex()) {
      let j = i + 1
      let inClass = false
      while (j < n) {
        const cc = src[j]
        if (cc === '\\') {
          j += 2
          continue
        }
        if (cc === '[') inClass = true
        else if (cc === ']') inClass = false
        else if (cc === '/' && !inClass) {
          j++
          // Flags
          while (j < n && /[a-z]/.test(src[j])) j++
          break
        }
        if (cc === '\n') break
        j++
      }
      out.push({ type: 'regex', value: src.slice(i, j) })
      i = j
      continue
    }
    // Multi-char punctuation
    const three = src.slice(i, i + 3)
    if (PUNCT3.includes(three)) {
      out.push({ type: 'punct', value: three })
      i += 3
      continue
    }
    const two = src.slice(i, i + 2)
    if (PUNCT2.includes(two)) {
      out.push({ type: 'punct', value: two })
      i += 2
      continue
    }
    // Word
    if (isWord(c)) {
      let j = i + 1
      while (j < n && isWord(src[j])) j++
      out.push({ type: 'word', value: src.slice(i, j) })
      i = j
      continue
    }
    // Single punct
    out.push({ type: 'punct', value: c })
    i++
  }
  return out
}

function minifyJs(src: string): string {
  const tokens = tokenize(src)
  // Drop comments and whitespace, but track newlines that are needed for ASI safety.
  const kept = tokens.filter((t) => t.type !== 'comment')
  let out = ''
  for (let i = 0; i < kept.length; i++) {
    const t = kept[i]
    if (t.type === 'whitespace') {
      const prev = kept[i - 1]
      const next = kept[i + 1]
      if (!prev || !next) continue
      // Preserve a single newline if both adjacent tokens are word-like or end-start of a continuation
      const prevWord = prev.type === 'word'
      const nextWord = next.type === 'word'
      // Preserve newline if newline exists in whitespace AND adjacent tokens would merge incorrectly
      const hasNewline = t.value.includes('\n')
      if (hasNewline && (prevWord || nextWord)) {
        // ASI safety: insert a newline if both tokens are word-like or punct-end-of-statement patterns
        if (prevWord && nextWord) {
          out += '\n'
          continue
        }
        // E.g. `return\nfoo` — keep newline
        if (prevWord && (next.type === 'string' || next.type === 'regex')) {
          out += '\n'
          continue
        }
      }
      // Otherwise drop whitespace, but keep a single space if both tokens are word-like (so they don't merge into a single identifier)
      if (prevWord && nextWord) {
        out += ' '
        continue
      }
      // Special: avoid `return` followed by `++` etc. — handled by above.
      continue
    }
    out += t.value
  }
  return out.trim()
}

export default function JsMinifier() {
  const [input, setInput] = React.useState('')
  const [output, setOutput] = React.useState('')

  const handleMinify = () => {
    if (!input.trim()) {
      setOutput('')
      return
    }
    try {
      const result = minifyJs(input)
      setOutput(result)
      const savedPct = input.length > 0 ? Math.round((1 - result.length / input.length) * 100) : 0
      toast.success(`Minified — saved ${savedPct}%`)
    } catch {
      toast.error('Failed to minify')
    }
  }

  const handleClear = () => {
    setInput('')
    setOutput('')
  }

  const inputSize = new Blob([input]).size
  const outputSize = new Blob([output]).size
  const savedPct = inputSize > 0 && outputSize > 0 ? Math.round((1 - outputSize / inputSize) * 100) : 0

  const download = () => {
    const blob = new Blob([output], { type: 'text/javascript' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'minified.js'
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Downloaded minified.js')
  }

  return (
    <ToolCardWrapper>
      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
            <FieldLabel className="mb-0">JavaScript input</FieldLabel>
            <div className="flex items-center gap-2">
              {input && (
                <Badge variant="secondary" className="font-mono">
                  {(inputSize / 1024).toFixed(2)} KB
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                disabled={!input}
                onClick={handleClear}
                className="gap-1.5"
              >
                <Eraser className="h-4 w-4" /> Clear
              </Button>
            </div>
          </div>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={'// Add your JS here\nfunction greet(name) {\n  return "Hello, " + name;\n}'}
            className="min-h-[340px] resize-y font-mono text-sm"
            spellCheck={false}
          />
          <Button onClick={handleMinify} disabled={!input} className="mt-3 gap-1.5">
            <Minimize2 className="h-4 w-4" /> Minify JS
          </Button>
        </div>

        <div>
          <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
            <FieldLabel className="mb-0">Minified output</FieldLabel>
            <div className="flex items-center gap-1.5">
              {output && (
                <Badge variant="secondary" className="font-mono">
                  {(outputSize / 1024).toFixed(2)} KB
                </Badge>
              )}
              {savedPct > 0 && (
                <Badge variant="outline" className="font-mono text-emerald-600 border-emerald-500/40">
                  -{savedPct}%
                </Badge>
              )}
              <CopyButton text={output} />
              <DownloadButton onClick={download} disabled={!output} label="" className="px-2.5" />
            </div>
          </div>
          {output ? (
            <Textarea
              value={output}
              readOnly
              className="min-h-[340px] resize-y font-mono text-sm bg-muted/40 break-all"
            />
          ) : (
            <div className="min-h-[340px] rounded-md border border-dashed border-border bg-muted/20 p-3 text-sm text-muted-foreground flex items-center justify-center text-center">
              Output appears here after minification
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900 p-3 text-xs text-amber-800 dark:text-amber-300">
        <strong>Basic minifier.</strong> Token-aware: strips comments, collapses whitespace, preserves
        ASI-safe newlines, and never modifies string/regex literals. For production use Terser, esbuild,
        or SWC — they also rename identifiers and dead-code-eliminate.
      </div>
    </ToolCardWrapper>
  )
}
