'use client'

import * as React from 'react'
import dynamic from 'next/dynamic'
import { ToolPageShell } from '@/components/tool-page-shell'

// Helper: all tool components are interactive client-side widgets that use
// Radix primitives (Tabs, Select, Dialog...). Rendering them with SSR causes
// hydration mismatches because React's useId() generates different IDs on the
// server vs client when the component is lazy-loaded. Disabling SSR for these
// dynamic imports eliminates the mismatch — the ToolPageShell shell still
// server-renders (breadcrumb, title, related tools), only the tool body
// hydrates on the client.
const dyn = (loader: () => Promise<{ default: React.ComponentType }>) =>
  dynamic(loader, { ssr: false })

const registry: Record<string, React.ComponentType> = {
  // PDF
  'pdf-merge': dyn(() => import('@/components/tools/pdf-merge')),
  'pdf-split': dyn(() => import('@/components/tools/pdf-split')),
  'pdf-compress': dyn(() => import('@/components/tools/pdf-compress')),
  'pdf-rotate': dyn(() => import('@/components/tools/pdf-rotate')),
  'pdf-reorder': dyn(() => import('@/components/tools/pdf-reorder')),
  'pdf-delete-pages': dyn(() => import('@/components/tools/pdf-delete-pages')),
  'pdf-watermark': dyn(() => import('@/components/tools/pdf-watermark')),
  'pdf-page-numbers': dyn(() => import('@/components/tools/pdf-page-numbers')),
  'pdf-protect': dyn(() => import('@/components/tools/pdf-protect')),
  'image-to-pdf': dyn(() => import('@/components/tools/image-to-pdf')),

  // IMAGE
  'image-compress': dyn(() => import('@/components/tools/image-compress')),
  'image-resize': dyn(() => import('@/components/tools/image-resize')),
  'image-convert': dyn(() => import('@/components/tools/image-convert')),
  'image-crop': dyn(() => import('@/components/tools/image-crop')),
  'image-rotate': dyn(() => import('@/components/tools/image-rotate')),
  'image-to-base64': dyn(() => import('@/components/tools/image-to-base64')),
  'image-watermark': dyn(() => import('@/components/tools/image-watermark')),
  'image-metadata': dyn(() => import('@/components/tools/image-metadata')),
  'color-picker': dyn(() => import('@/components/tools/color-picker')),
  'image-color-palette': dyn(() => import('@/components/tools/image-color-palette')),
  'color-palette-generator': dyn(() => import('@/components/tools/color-palette-generator')),
  'favicon-generator': dyn(() => import('@/components/tools/favicon-generator')),
  'base64-image-decoder': dyn(() => import('@/components/tools/base64-image-decoder')),

  // TEXT
  'word-counter': dyn(() => import('@/components/tools/word-counter')),
  'case-converter': dyn(() => import('@/components/tools/case-converter')),
  'lorem-ipsum': dyn(() => import('@/components/tools/lorem-ipsum')),
  'remove-duplicate-lines': dyn(() => import('@/components/tools/remove-duplicate-lines')),
  'sort-lines': dyn(() => import('@/components/tools/sort-lines')),
  'find-replace': dyn(() => import('@/components/tools/find-replace')),
  'text-reverse': dyn(() => import('@/components/tools/text-reverse')),
  'slug-generator': dyn(() => import('@/components/tools/slug-generator')),
  'text-diff': dyn(() => import('@/components/tools/text-diff')),
  'text-to-binary': dyn(() => import('@/components/tools/text-to-binary')),
  'text-to-morse': dyn(() => import('@/components/tools/text-to-morse')),
  'whitespace-remover': dyn(() => import('@/components/tools/whitespace-remover')),

  // DEVELOPER
  'json-formatter': dyn(() => import('@/components/tools/json-formatter')),
  'base64-encode-decode': dyn(() => import('@/components/tools/base64-encode-decode')),
  'uuid-generator': dyn(() => import('@/components/tools/uuid-generator')),
  'hash-generator': dyn(() => import('@/components/tools/hash-generator')),
  'url-encode-decode': dyn(() => import('@/components/tools/url-encode-decode')),
  'jwt-decoder': dyn(() => import('@/components/tools/jwt-decoder')),
  'password-generator': dyn(() => import('@/components/tools/password-generator')),
  'html-encode-decode': dyn(() => import('@/components/tools/html-encode-decode')),
  'markdown-preview': dyn(() => import('@/components/tools/markdown-preview')),
  'regex-tester': dyn(() => import('@/components/tools/regex-tester')),
  'css-minifier': dyn(() => import('@/components/tools/css-minifier')),
  'js-minifier': dyn(() => import('@/components/tools/js-minifier')),
  'html-formatter': dyn(() => import('@/components/tools/html-formatter')),
  'timestamp-converter': dyn(() => import('@/components/tools/timestamp-converter')),
  'json-to-csv': dyn(() => import('@/components/tools/json-to-csv')),
  'yaml-json-converter': dyn(() => import('@/components/tools/yaml-json-converter')),
  'markdown-to-html': dyn(() => import('@/components/tools/markdown-to-html')),
  'csv-viewer': dyn(() => import('@/components/tools/csv-viewer')),

  // CONVERTER
  'unit-converter': dyn(() => import('@/components/tools/unit-converter')),
  'number-base-converter': dyn(() => import('@/components/tools/number-base-converter')),
  'color-converter': dyn(() => import('@/components/tools/color-converter-tool')),
  'roman-numeral-converter': dyn(() => import('@/components/tools/roman-numeral-converter')),
  'temperature-converter': dyn(() => import('@/components/tools/temperature-converter')),
  'data-storage-converter': dyn(() => import('@/components/tools/data-storage-converter')),
  'time-converter': dyn(() => import('@/components/tools/time-converter')),
  'angle-converter': dyn(() => import('@/components/tools/angle-converter')),

  // CALCULATOR
  'bmi-calculator': dyn(() => import('@/components/tools/bmi-calculator')),
  'age-calculator': dyn(() => import('@/components/tools/age-calculator')),
  'percentage-calculator': dyn(() => import('@/components/tools/percentage-calculator')),
  'loan-emi-calculator': dyn(() => import('@/components/tools/loan-emi-calculator')),
  'date-difference-calculator': dyn(() => import('@/components/tools/date-difference-calculator')),
  'compound-interest-calculator': dyn(() => import('@/components/tools/compound-interest-calculator')),
  'tip-calculator': dyn(() => import('@/components/tools/tip-calculator')),
  'gpa-calculator': dyn(() => import('@/components/tools/gpa-calculator')),
  'scientific-calculator': dyn(() => import('@/components/tools/scientific-calculator')),

  // SEO
  'meta-tag-generator': dyn(() => import('@/components/tools/meta-tag-generator')),
  'open-graph-generator': dyn(() => import('@/components/tools/open-graph-generator')),
  'robots-txt-generator': dyn(() => import('@/components/tools/robots-txt-generator')),
  'sitemap-generator': dyn(() => import('@/components/tools/sitemap-generator')),
  'keyword-density': dyn(() => import('@/components/tools/keyword-density')),
  'slug-url-generator': dyn(() => import('@/components/tools/slug-url-generator')),
  'http-status-codes': dyn(() => import('@/components/tools/http-status-codes')),

  // SECURITY
  'password-strength-checker': dyn(() => import('@/components/tools/password-strength-checker')),
  'random-string-generator': dyn(() => import('@/components/tools/random-string-generator')),
  'credit-card-validator': dyn(() => import('@/components/tools/credit-card-validator')),
  'mac-address-lookup': dyn(() => import('@/components/tools/mac-address-lookup')),
  'hash-identifier': dyn(() => import('@/components/tools/hash-identifier')),

  // MISC
  'qr-code-generator': dyn(() => import('@/components/tools/qr-code-generator')),
  'barcode-generator': dyn(() => import('@/components/tools/barcode-generator')),
  'emoji-keyboard': dyn(() => import('@/components/tools/emoji-keyboard')),
  'dice-roller': dyn(() => import('@/components/tools/dice-roller')),
  'coin-flip': dyn(() => import('@/components/tools/coin-flip')),
  'random-number-generator': dyn(() => import('@/components/tools/random-number-generator')),
  'pomodoro-timer': dyn(() => import('@/components/tools/pomodoro-timer')),
  'stopwatch': dyn(() => import('@/components/tools/stopwatch')),

  // AI
  'ai-image-generator': dyn(() => import('@/components/tools/ai-image-generator')),
  'ai-content-writer': dyn(() => import('@/components/tools/ai-content-writer')),
  'ai-image-describer': dyn(() => import('@/components/tools/ai-image-describer')),
  'ai-chat-assistant': dyn(() => import('@/components/tools/ai-chat-assistant')),
  'ai-summarizer': dyn(() => import('@/components/tools/ai-summarizer')),
  'ai-translator': dyn(() => import('@/components/tools/ai-translator')),
  'image-ocr': dyn(() => import('@/components/tools/image-ocr')),
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
