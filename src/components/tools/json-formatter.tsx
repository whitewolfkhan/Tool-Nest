'use client'

import * as React from 'react'
import { Braces, Minimize2, CheckCircle2, AlertTriangle, Eraser } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { CopyButton, ToolCardWrapper, FieldLabel } from '@/components/tool-page-shell'
import { toast } from 'sonner'

interface ParseError {
  message: string
  line?: number
  column?: number
}

function getErrorPosition(input: string, rawErr: unknown): ParseError {
  // V8 / Chrome JSON parse error doesn't expose position directly.
  // We attempt to extract via message; otherwise show a generic message.
  const msg = rawErr instanceof Error ? rawErr.message : String(rawErr)
  // Try common pattern: "Unexpected token X in JSON at position N"
  const posMatch = msg.match(/position (\d+)/i)
  if (posMatch) {
    const pos = parseInt(posMatch[1], 10)
    const before = input.slice(0, pos)
    const line = before.split('\n').length
    const column = pos - before.lastIndexOf('\n')
    return { message: msg, line, column }
  }
  return { message: msg }
}

function formatJson(input: string, indent: number): { output: string; error: ParseError | null } {
  if (!input.trim()) return { output: '', error: null }
  try {
    const parsed = JSON.parse(input)
    return { output: JSON.stringify(parsed, null, indent), error: null }
  } catch (e) {
    return { output: '', error: getErrorPosition(input, e) }
  }
}

function minifyJson(input: string): { output: string; error: ParseError | null } {
  if (!input.trim()) return { output: '', error: null }
  try {
    const parsed = JSON.parse(input)
    return { output: JSON.stringify(parsed), error: null }
  } catch (e) {
    return { output: '', error: getErrorPosition(input, e) }
  }
}

function validateJson(input: string): ParseError | null {
  if (!input.trim()) return null
  try {
    JSON.parse(input)
    return null
  } catch (e) {
    return getErrorPosition(input, e)
  }
}

function syntaxHighlight(json: string): string {
  return json
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
      (match) => {
        let cls = 'text-amber-700 dark:text-amber-300' // number
        if (/^"/.test(match)) {
          if (/:$/.test(match)) {
            cls = 'text-rose-700 dark:text-rose-300' // key
          } else {
            cls = 'text-emerald-700 dark:text-emerald-300' // string
          }
        } else if (/true|false/.test(match)) {
          cls = 'text-violet-700 dark:text-violet-300' // boolean
        } else if (/null/.test(match)) {
          cls = 'text-muted-foreground' // null
        }
        return `<span class="${cls}">${match}</span>`
      },
    )
}

export default function JsonFormatter() {
  const [input, setInput] = React.useState('')
  const [output, setOutput] = React.useState('')
  const [error, setError] = React.useState<ParseError | null>(null)
  const [indent, setIndent] = React.useState(2)
  const [validated, setValidated] = React.useState<boolean | null>(null)

  const handleFormat = () => {
    const { output, error } = formatJson(input, indent)
    setOutput(output)
    setError(error)
    setValidated(!error)
    if (error) toast.error('JSON is invalid')
    else if (output) toast.success('Formatted successfully')
  }

  const handleMinify = () => {
    const { output, error } = minifyJson(input)
    setOutput(output)
    setError(error)
    setValidated(!error)
    if (error) toast.error('JSON is invalid')
    else if (output) toast.success('Minified successfully')
  }

  const handleValidate = () => {
    const err = validateJson(input)
    setError(err)
    setValidated(!err)
    if (err) toast.error('Validation failed')
    else toast.success('Valid JSON')
  }

  const handleClear = () => {
    setInput('')
    setOutput('')
    setError(null)
    setValidated(null)
  }

  const inputSize = new Blob([input]).size
  const outputSize = new Blob([output]).size

  return (
    <ToolCardWrapper>
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Input */}
        <div>
          <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
            <FieldLabel className="mb-0">JSON input</FieldLabel>
            <div className="flex gap-1.5">
              <Button
                variant="ghost"
                size="sm"
                disabled={!input}
                onClick={handleClear}
                className="gap-1.5"
              >
                <Eraser className="h-4 w-4" /> Clear
              </Button>
              {input && (
                <Badge variant="secondary" className="font-mono">
                  {inputSize} B
                </Badge>
              )}
            </div>
          </div>
          <Textarea
            value={input}
            onChange={(e) => {
              setInput(e.target.value)
              setValidated(null)
            }}
            placeholder={'{\n  "name": "ToolNest",\n  "tools": 99,\n  "free": true\n}'}
            className="min-h-[340px] resize-y font-mono text-sm"
            spellCheck={false}
          />

          <div className="flex flex-wrap gap-2 mt-3">
            <Button onClick={handleFormat} className="gap-1.5" disabled={!input}>
              <Braces className="h-4 w-4" /> Format
            </Button>
            <Button variant="outline" onClick={handleMinify} className="gap-1.5" disabled={!input}>
              <Minimize2 className="h-4 w-4" /> Minify
            </Button>
            <Button variant="outline" onClick={handleValidate} className="gap-1.5" disabled={!input}>
              <CheckCircle2 className="h-4 w-4" /> Validate
            </Button>
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-xs text-muted-foreground">Indent</span>
              <Tabs value={String(indent)} onValueChange={(v) => setIndent(Number(v))}>
                <TabsList className="h-8">
                  <TabsTrigger value="2" className="text-xs px-2.5">2</TabsTrigger>
                  <TabsTrigger value="4" className="text-xs px-2.5">4</TabsTrigger>
                  <TabsTrigger value="0" className="text-xs px-2.5">Tab</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          {/* Status row */}
          <div className="mt-3">
            {validated === true && !error && input && (
              <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" /> Valid JSON
              </div>
            )}
            {error && (
              <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                <div className="flex items-center gap-2 font-medium">
                  <AlertTriangle className="h-4 w-4" /> Parse error
                </div>
                <div className="mt-1 text-xs">{error.message}</div>
                {error.line !== undefined && error.column !== undefined && (
                  <div className="mt-0.5 text-xs font-mono">
                    Line {error.line}, Column {error.column}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Output */}
        <div>
          <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
            <FieldLabel className="mb-0">Formatted output</FieldLabel>
            <div className="flex gap-1.5 items-center">
              {output && (
                <Badge variant="secondary" className="font-mono">
                  {outputSize} B
                </Badge>
              )}
              <CopyButton text={output} />
            </div>
          </div>
          {output ? (
            <pre className="min-h-[340px] overflow-auto rounded-md border border-border bg-muted/40 p-3 font-mono text-sm whitespace-pre">
              <code dangerouslySetInnerHTML={{ __html: syntaxHighlight(output) }} />
            </pre>
          ) : (
            <div className="min-h-[340px] rounded-md border border-dashed border-border bg-muted/20 p-3 text-sm text-muted-foreground flex items-center justify-center text-center">
              Output appears here after formatting
            </div>
          )}
        </div>
      </div>
    </ToolCardWrapper>
  )
}
