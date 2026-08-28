'use client'

import * as React from 'react'
import { Braces, Eraser, FileDown } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CopyButton, DownloadButton, ToolCardWrapper, FieldLabel } from '@/components/tool-page-shell'
import { toast } from 'sonner'

const VOID = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link',
  'meta', 'param', 'source', 'track', 'wbr',
])

const INLINE = new Set([
  'a', 'abbr', 'b', 'bdi', 'bdo', 'cite', 'code', 'data', 'dfn', 'em',
  'i', 'kbd', 'mark', 'q', 'rp', 'rt', 'ruby', 's', 'samp', 'small',
  'span', 'strong', 'sub', 'sup', 'time', 'u', 'var', 'wbr',
])

function formatHtml(src: string, indentSize: number): string {
  if (typeof window === 'undefined') return src
  const doc = new DOMParser().parseFromString(src, 'text/html')
  const out: string[] = []
  const pad = (lvl: number) => ' '.repeat(lvl * indentSize)

  const walk = (node: Node, level: number) => {
    node.childNodes.forEach((child) => {
      switch (child.nodeType) {
        case Node.ELEMENT_NODE: {
          const el = child as Element
          const tag = el.tagName.toLowerCase()
          const attrs = Array.from(el.attributes)
            .map((a) => `${a.name}="${a.value}"`)
            .join(' ')
          const open = attrs ? `<${tag} ${attrs}>` : `<${tag}>`
          out.push(`${pad(level)}${open}`)
          if (VOID.has(tag)) break
          // For inline element with only text, keep on one line
          const onlyText =
            el.childNodes.length > 0 &&
            Array.from(el.childNodes).every((c) => c.nodeType === Node.TEXT_NODE)
          if (onlyText && INLINE.has(tag)) {
            const text = el.textContent?.replace(/\s+/g, ' ').trim() || ''
            out[out.length - 1] = `${pad(level)}${open}${text}</${tag}>`
          } else {
            walk(el, level + 1)
            out.push(`${pad(level)}</${tag}>`)
          }
          break
        }
        case Node.TEXT_NODE: {
          const raw = child.nodeValue || ''
          // Skip whitespace-only text between block elements
          if (!raw.trim()) break
          const collapsed = raw.replace(/\s+/g, ' ').trim()
          // If parent is inline/pre, keep text inline-ish
          const parent = child.parentNode as Element | null
          const isPre = parent && parent.tagName.toLowerCase() === 'pre'
          if (isPre) {
            out.push(`${pad(level)}${raw}`)
          } else if (parent && INLINE.has(parent.tagName.toLowerCase())) {
            // Inline parent — keep text inline
            if (out.length > 0) {
              out[out.length - 1] += collapsed
            } else {
              out.push(`${pad(level)}${collapsed}`)
            }
          } else {
            out.push(`${pad(level)}${collapsed}`)
          }
          break
        }
        case Node.COMMENT_NODE: {
          const txt = child.nodeValue || ''
          out.push(`${pad(level)}<!--${txt}-->`)
          break
        }
        case Node.CDATA_SECTION_NODE: {
          out.push(`${pad(level)}<![CDATA[${child.nodeValue || ''}]]>`)
          break
        }
        case Node.DOCUMENT_TYPE_NODE: {
          out.push(`${pad(level)}<!DOCTYPE ${child.nodeName}>`)
          break
        }
        default:
          break
      }
    })
  }

  walk(doc.documentElement, 0)
  // Fallback: if nothing emitted, return original
  if (out.length === 0) return src
  return out.join('\n')
}

export default function HtmlFormatter() {
  const [input, setInput] = React.useState('')
  const [output, setOutput] = React.useState('')
  const [indent, setIndent] = React.useState(2)

  const handleFormat = () => {
    if (!input.trim()) {
      setOutput('')
      return
    }
    try {
      const result = formatHtml(input, indent)
      setOutput(result)
      toast.success('HTML beautified')
    } catch {
      toast.error('Failed to format HTML')
    }
  }

  const handleClear = () => {
    setInput('')
    setOutput('')
  }

  const inputSize = new Blob([input]).size
  const outputSize = new Blob([output]).size

  const download = () => {
    const blob = new Blob([output], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'formatted.html'
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Downloaded formatted.html')
  }

  return (
    <ToolCardWrapper>
      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
            <FieldLabel className="mb-0">HTML input</FieldLabel>
            <div className="flex items-center gap-2">
              {input && (
                <Badge variant="secondary" className="font-mono">
                  {inputSize} B
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
            placeholder={'<div class="row"><h1>Title</h1><p>Body</p></div>'}
            className="min-h-[340px] resize-y font-mono text-sm"
            spellCheck={false}
          />
          <div className="flex flex-wrap gap-2 mt-3 items-center">
            <Button onClick={handleFormat} disabled={!input} className="gap-1.5">
              <Braces className="h-4 w-4" /> Beautify
            </Button>
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-xs text-muted-foreground">Indent</span>
              <div className="flex gap-1 rounded-md border border-border p-0.5">
                {[2, 4].map((n) => (
                  <button
                    key={n}
                    onClick={() => setIndent(n)}
                    className={`px-2.5 py-1 text-xs rounded-sm transition-colors ${
                      indent === n
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-accent'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
            <FieldLabel className="mb-0">Formatted output</FieldLabel>
            <div className="flex items-center gap-1.5">
              {output && (
                <Badge variant="secondary" className="font-mono">
                  {outputSize} B
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
              className="min-h-[340px] resize-y font-mono text-sm bg-muted/40"
            />
          ) : (
            <div className="min-h-[340px] rounded-md border border-dashed border-border bg-muted/20 p-3 text-sm text-muted-foreground flex items-center justify-center text-center">
              Output appears here after beautifying
            </div>
          )}
        </div>
      </div>
    </ToolCardWrapper>
  )
}
