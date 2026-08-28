'use client'

import * as React from 'react'
import dynamic from 'next/dynamic'
import { ToolPageShell } from '@/components/tool-page-shell'

const registry: Record<string, React.ComponentType> = {
  // PDF
  'pdf-merge': dynamic(() => import('@/components/tools/pdf-merge')),
  'pdf-split': dynamic(() => import('@/components/tools/pdf-split')),
  'pdf-compress': dynamic(() => import('@/components/tools/pdf-compress')),
  'pdf-rotate': dynamic(() => import('@/components/tools/pdf-rotate')),
  'pdf-reorder': dynamic(() => import('@/components/tools/pdf-reorder')),
  'pdf-delete-pages': dynamic(() => import('@/components/tools/pdf-delete-pages')),
  'pdf-watermark': dynamic(() => import('@/components/tools/pdf-watermark')),
  'pdf-page-numbers': dynamic(() => import('@/components/tools/pdf-page-numbers')),
  'pdf-protect': dynamic(() => import('@/components/tools/pdf-protect')),
  'image-to-pdf': dynamic(() => import('@/components/tools/image-to-pdf')),

  // IMAGE
  'image-compress': dynamic(() => import('@/components/tools/image-compress')),
  'image-resize': dynamic(() => import('@/components/tools/image-resize')),
  'image-convert': dynamic(() => import('@/components/tools/image-convert')),
  'image-crop': dynamic(() => import('@/components/tools/image-crop')),
  'image-rotate': dynamic(() => import('@/components/tools/image-rotate')),
  'image-to-base64': dynamic(() => import('@/components/tools/image-to-base64')),
  'image-watermark': dynamic(() => import('@/components/tools/image-watermark')),
  'image-metadata': dynamic(() => import('@/components/tools/image-metadata')),
  'color-picker': dynamic(() => import('@/components/tools/color-picker')),
  'image-color-palette': dynamic(() => import('@/components/tools/image-color-palette')),

  // TEXT
  'word-counter': dynamic(() => import('@/components/tools/word-counter')),
  'case-converter': dynamic(() => import('@/components/tools/case-converter')),
  'lorem-ipsum': dynamic(() => import('@/components/tools/lorem-ipsum')),
  'remove-duplicate-lines': dynamic(() => import('@/components/tools/remove-duplicate-lines')),
  'sort-lines': dynamic(() => import('@/components/tools/sort-lines')),
  'find-replace': dynamic(() => import('@/components/tools/find-replace')),
  'text-reverse': dynamic(() => import('@/components/tools/text-reverse')),
  'slug-generator': dynamic(() => import('@/components/tools/slug-generator')),
  'text-diff': dynamic(() => import('@/components/tools/text-diff')),
  'text-to-binary': dynamic(() => import('@/components/tools/text-to-binary')),
  'text-to-morse': dynamic(() => import('@/components/tools/text-to-morse')),
  'whitespace-remover': dynamic(() => import('@/components/tools/whitespace-remover')),

  // DEVELOPER
  'json-formatter': dynamic(() => import('@/components/tools/json-formatter')),
  'base64-encode-decode': dynamic(() => import('@/components/tools/base64-encode-decode')),
  'uuid-generator': dynamic(() => import('@/components/tools/uuid-generator')),
  'hash-generator': dynamic(() => import('@/components/tools/hash-generator')),
  'url-encode-decode': dynamic(() => import('@/components/tools/url-encode-decode')),
  'jwt-decoder': dynamic(() => import('@/components/tools/jwt-decoder')),
  'password-generator': dynamic(() => import('@/components/tools/password-generator')),
  'html-encode-decode': dynamic(() => import('@/components/tools/html-encode-decode')),
  'markdown-preview': dynamic(() => import('@/components/tools/markdown-preview')),
  'regex-tester': dynamic(() => import('@/components/tools/regex-tester')),
  'css-minifier': dynamic(() => import('@/components/tools/css-minifier')),
  'js-minifier': dynamic(() => import('@/components/tools/js-minifier')),
  'html-formatter': dynamic(() => import('@/components/tools/html-formatter')),
  'timestamp-converter': dynamic(() => import('@/components/tools/timestamp-converter')),

  // CONVERTER
  'unit-converter': dynamic(() => import('@/components/tools/unit-converter')),
  'number-base-converter': dynamic(() => import('@/components/tools/number-base-converter')),
  'color-converter': dynamic(() => import('@/components/tools/color-converter-tool')),
  'roman-numeral-converter': dynamic(() => import('@/components/tools/roman-numeral-converter')),
  'temperature-converter': dynamic(() => import('@/components/tools/temperature-converter')),
  'data-storage-converter': dynamic(() => import('@/components/tools/data-storage-converter')),
  'time-converter': dynamic(() => import('@/components/tools/time-converter')),
  'angle-converter': dynamic(() => import('@/components/tools/angle-converter')),

  // CALCULATOR
  'bmi-calculator': dynamic(() => import('@/components/tools/bmi-calculator')),
  'age-calculator': dynamic(() => import('@/components/tools/age-calculator')),
  'percentage-calculator': dynamic(() => import('@/components/tools/percentage-calculator')),
  'loan-emi-calculator': dynamic(() => import('@/components/tools/loan-emi-calculator')),
  'date-difference-calculator': dynamic(() => import('@/components/tools/date-difference-calculator')),
  'compound-interest-calculator': dynamic(() => import('@/components/tools/compound-interest-calculator')),
  'tip-calculator': dynamic(() => import('@/components/tools/tip-calculator')),
  'gpa-calculator': dynamic(() => import('@/components/tools/gpa-calculator')),
  'scientific-calculator': dynamic(() => import('@/components/tools/scientific-calculator')),

  // SEO
  'meta-tag-generator': dynamic(() => import('@/components/tools/meta-tag-generator')),
  'open-graph-generator': dynamic(() => import('@/components/tools/open-graph-generator')),
  'robots-txt-generator': dynamic(() => import('@/components/tools/robots-txt-generator')),
  'sitemap-generator': dynamic(() => import('@/components/tools/sitemap-generator')),
  'keyword-density': dynamic(() => import('@/components/tools/keyword-density')),
  'slug-url-generator': dynamic(() => import('@/components/tools/slug-url-generator')),
  'http-status-codes': dynamic(() => import('@/components/tools/http-status-codes')),

  // SECURITY
  'password-strength-checker': dynamic(() => import('@/components/tools/password-strength-checker')),
  'random-string-generator': dynamic(() => import('@/components/tools/random-string-generator')),
  'credit-card-validator': dynamic(() => import('@/components/tools/credit-card-validator')),
  'mac-address-lookup': dynamic(() => import('@/components/tools/mac-address-lookup')),

  // MISC
  'qr-code-generator': dynamic(() => import('@/components/tools/qr-code-generator')),
  'barcode-generator': dynamic(() => import('@/components/tools/barcode-generator')),
  'emoji-keyboard': dynamic(() => import('@/components/tools/emoji-keyboard')),
  'dice-roller': dynamic(() => import('@/components/tools/dice-roller')),
  'coin-flip': dynamic(() => import('@/components/tools/coin-flip')),
  'random-number-generator': dynamic(() => import('@/components/tools/random-number-generator')),
  'pomodoro-timer': dynamic(() => import('@/components/tools/pomodoro-timer')),
  'stopwatch': dynamic(() => import('@/components/tools/stopwatch')),

  // AI
  'ai-image-generator': dynamic(() => import('@/components/tools/ai-image-generator')),
  'ai-content-writer': dynamic(() => import('@/components/tools/ai-content-writer')),
  'ai-image-describer': dynamic(() => import('@/components/tools/ai-image-describer')),
  'ai-chat-assistant': dynamic(() => import('@/components/tools/ai-chat-assistant')),
  'ai-summarizer': dynamic(() => import('@/components/tools/ai-summarizer')),
  'ai-translator': dynamic(() => import('@/components/tools/ai-translator')),
}

export function ToolLoader({ slug }: { slug: string }) {
  const ToolComponent = registry[slug]
  return (
    <ToolPageShell slug={slug}>
      {ToolComponent ? (
        <React.Suspense
          fallback={
            <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent mr-2" />
              Loading tool...
            </div>
          }
        >
          <ToolComponent />
        </React.Suspense>
      ) : (
        <div className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          This tool is coming soon. Stay tuned!
        </div>
      )}
    </ToolPageShell>
  )
}
