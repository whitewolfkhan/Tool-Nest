'use client'

import * as React from 'react'
import { Eraser, ArrowRight, Replace } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  CopyButton,
  ToolCardWrapper,
  FieldLabel,
} from '@/components/tool-page-shell'
import { toast } from 'sonner'

interface Options {
  caseSensitive: boolean
  regex: boolean
  wholeWord: boolean
}

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function performReplace(text: string, find: string, replace: string, opts: Options) {
  if (!find) return { output: text, count: 0 }
  try {
    let pattern: string
    let flags = 'g'
    if (opts.regex) {
      pattern = find
    } else if (opts.wholeWord) {
      pattern = `\\b${escapeRegex(find)}\\b`
    } else {
      pattern = escapeRegex(find)
    }
    if (!opts.caseSensitive) flags += 'i'
    const re = new RegExp(pattern, flags)
    let count = 0
    const output = text.replace(re, (match) => {
      count++
      if (opts.regex && replace) {
        // Allow backreferences $1, $2 etc. via String.replace
        return replace
      }
      return replace
    })
    // Re-run with replace fn for backreferences if regex
    if (opts.regex) {
      count = 0
      const re2 = new RegExp(pattern, flags)
      const out2 = text.replace(re2, (...args) => {
        count++
        // Replace $1, $2 ... in replace string
        return replace.replace(/\$(\d+)/g, (_, n) => {
          const idx = parseInt(n, 10)
          return args[idx] !== undefined ? String(args[idx]) : ''
        }).replace(/\$&/g, args[0] as string)
      })
      return { output: out2, count }
    }
    return { output, count }
  } catch (e) {
    throw e
  }
}

export default function FindReplace() {
  const [text, setText] = React.useState('')
  const [find, setFind] = React.useState('')
  const [replace, setReplace] = React.useState('')
  const [opts, setOpts] = React.useState<Options>({
    caseSensitive: true,
    regex: false,
    wholeWord: false,
  })
  const [error, setError] = React.useState<string | null>(null)
  const [result, setResult] = React.useState<{ output: string; count: number }>({ output: '', count: 0 })

  React.useEffect(() => {
    if (!find) {
      setError(null)
      setResult({ output: text, count: 0 })
      return
    }
    try {
      const r = performReplace(text, find, replace, opts)
      setResult(r)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid pattern')
    }
  }, [text, find, replace, opts])

  const hasResult = find.length > 0

  return (
    <div className="space-y-4">
      <ToolCardWrapper>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <FieldLabel>Find</FieldLabel>
            <Input
              value={find}
              onChange={(e) => setFind(e.target.value)}
              placeholder={opts.regex ? '/pattern/g' : 'Text to find'}
              className="font-mono"
            />
          </div>
          <div>
            <FieldLabel>Replace with</FieldLabel>
            <Input
              value={replace}
              onChange={(e) => setReplace(e.target.value)}
              placeholder="Replacement text"
              className="font-mono"
            />
          </div>
        </div>
        <div className="grid sm:grid-cols-3 gap-4 mt-4">
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <Label htmlFor="cs" className="text-sm">Case sensitive</Label>
              <p className="text-xs text-muted-foreground">Match letter case</p>
            </div>
            <Switch
              id="cs"
              checked={opts.caseSensitive}
              onCheckedChange={(v) => setOpts({ ...opts, caseSensitive: v })}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <Label htmlFor="rg" className="text-sm">Regex</Label>
              <p className="text-xs text-muted-foreground">Use RegExp pattern</p>
            </div>
            <Switch
              id="rg"
              checked={opts.regex}
              onCheckedChange={(v) =>
                setOpts({ ...opts, regex: v, wholeWord: v ? false : opts.wholeWord })
              }
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <Label htmlFor="ww" className="text-sm">Whole word</Label>
              <p className="text-xs text-muted-foreground">Match whole words only</p>
            </div>
            <Switch
              id="ww"
              checked={opts.wholeWord}
              disabled={opts.regex}
              onCheckedChange={(v) => setOpts({ ...opts, wholeWord: v })}
            />
          </div>
        </div>
        {error && (
          <p className="text-sm text-destructive mt-2">Regex error: {error}</p>
        )}
      </ToolCardWrapper>

      <div className="grid gap-4 lg:grid-cols-2">
        <ToolCardWrapper>
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <FieldLabel className="mb-0">Input text</FieldLabel>
            <Button
              variant="ghost"
              size="sm"
              disabled={!text}
              onClick={() => setText('')}
              className="gap-1.5"
            >
              <Eraser className="h-4 w-4" /> Clear
            </Button>
          </div>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste text here..."
            className="min-h-[260px] resize-y font-mono text-sm"
          />
        </ToolCardWrapper>

        <ToolCardWrapper>
          <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
            <FieldLabel className="mb-0">Preview</FieldLabel>
            <div className="flex gap-2 items-center">
              {hasResult && result.count > 0 && (
                <Badge variant="secondary">
                  <Replace className="h-3 w-3 mr-1" /> {result.count} replacement{result.count > 1 ? 's' : ''}
                </Badge>
              )}
              <CopyButton text={result.output} />
            </div>
          </div>
          <Textarea
            value={result.output}
            readOnly
            placeholder="Result preview..."
            className="min-h-[260px] resize-y font-mono text-sm bg-muted/40"
          />
          <div className="flex justify-end mt-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!hasResult || !result.output}
              onClick={() => {
                setText(result.output)
                toast.success('Applied to input')
              }}
              className="gap-1.5"
            >
              <ArrowRight className="h-4 w-4" /> Apply to input
            </Button>
          </div>
        </ToolCardWrapper>
      </div>
    </div>
  )
}
