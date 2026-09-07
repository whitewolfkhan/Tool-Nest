'use client'

import * as React from 'react'
import { Minimize2, Eraser, FileDown } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CopyButton, DownloadButton, ToolCardWrapper, FieldLabel } from '@/components/tool-page-shell'
import { toast } from 'sonner'

function minifyCss(input: string): string {
  let out = input
  // Remove comments /* ... */ (non-greedy)
  out = out.replace(/\/\*[\s\S]*?\*\//g, '')
  // Remove last semicolon before } (and any whitespace around it)
  out = out.replace(/\s*;\s*}/g, '}')
  // Collapse whitespace around punctuation
  out = out.replace(/\s*([{}:;,>~+])\s*/g, (_, ch) => ch)
  // Collapse remaining whitespace/newlines into single spaces
  out = out.replace(/\s{2,}/g, ' ')
  out = out.replace(/\s+/g, ' ')
  // Trim trailing semicolons at end of file
  out = out.trim().replace(/;+$/, '')
  return out
}

export default function CssMinifier() {
  const [input, setInput] = React.useState('')
  const [output, setOutput] = React.useState('')

  const handleMinify = () => {
    if (!input.trim()) {
      setOutput('')
      return
    }
    const result = minifyCss(input)
    setOutput(result)
    const savedPct = input.length > 0 ? Math.round((1 - result.length / input.length) * 100) : 0
    toast.success(`Minified — saved ${savedPct}%`)
  }

  const handleClear = () => {
    setInput('')
    setOutput('')
  }

  const inputSize = new Blob([input]).size
  const outputSize = new Blob([output]).size
  const savedPct = inputSize > 0 && outputSize > 0 ? Math.round((1 - outputSize / inputSize) * 100) : 0

  const download = () => {
    const blob = new Blob([output], { type: 'text/css' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'minified.css'
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Downloaded minified.css')
  }

  return (
    <ToolCardWrapper>
      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
            <FieldLabel className="mb-0">CSS input</FieldLabel>
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
            placeholder={'/* Comment */\n.btn {\n  color: #fff;\n  padding: 10px 20px;\n}'}
            className="min-h-[340px] resize-y font-mono text-sm"
            spellCheck={false}
          />
          <Button onClick={handleMinify} disabled={!input} className="mt-3 gap-1.5">
            <Minimize2 className="h-4 w-4" /> Minify CSS
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

      <p className="mt-4 text-xs text-muted-foreground text-center">
        Removes comments, collapses whitespace, strips trailing semicolons. For production, consider a
        full-featured minifier like <code className="font-mono">clean-css</code> or PostCSS.
      </p>
    </ToolCardWrapper>
  )
}
