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
  'pdf-to-images': dyn(() => import('@/components/tools/pdf-to-images')),

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
  'image-to-favicon-set': dyn(() => import('@/components/tools/image-to-favicon-set')),
  'color-shade-generator': dyn(() => import('@/components/tools/color-shade-generator')),
  'image-collage-maker': dyn(() => import('@/components/tools/image-collage-maker')),
  'image-to-ascii': dyn(() => import('@/components/tools/image-to-ascii')),
  'image-color-quantizer': dyn(() => import('@/components/tools/image-color-quantizer')),

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
  'text-to-speech': dyn(() => import('@/components/tools/text-to-speech')),
  'speech-to-text': dyn(() => import('@/components/tools/speech-to-text')),
  'text-repeater': dyn(() => import('@/components/tools/text-repeater')),
  'word-frequency-counter': dyn(() => import('@/components/tools/word-frequency-counter')),
  'text-stats-analyzer': dyn(() => import('@/components/tools/text-stats-analyzer')),

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
  'markdown-to-pdf': dyn(() => import('@/components/tools/markdown-to-pdf')),
  'csv-viewer': dyn(() => import('@/components/tools/csv-viewer')),
  'css-gradient-generator': dyn(() => import('@/components/tools/css-gradient-generator')),
  'box-shadow-generator': dyn(() => import('@/components/tools/box-shadow-generator')),
  'csv-to-json': dyn(() => import('@/components/tools/csv-to-json')),
  'text-escape-unescape': dyn(() => import('@/components/tools/text-escape-unescape')),
  'base64-to-file': dyn(() => import('@/components/tools/base64-to-file')),
  'css-flexbox-playground': dyn(() => import('@/components/tools/css-flexbox-playground')),
  'border-radius-generator': dyn(() => import('@/components/tools/border-radius-generator')),
  'color-contrast-checker': dyn(() => import('@/components/tools/color-contrast-checker')),
  'markdown-table-generator': dyn(() => import('@/components/tools/markdown-table-generator')),
  'html-to-markdown': dyn(() => import('@/components/tools/html-to-markdown')),

  // CONVERTER
  'unit-converter': dyn(() => import('@/components/tools/unit-converter')),
  'currency-converter': dyn(() => import('@/components/tools/currency-converter')),
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
  'password-strength-analyzer': dyn(() => import('@/components/tools/password-strength-analyzer')),

  // MISC
  'qr-code-generator': dyn(() => import('@/components/tools/qr-code-generator')),
  'barcode-generator': dyn(() => import('@/components/tools/barcode-generator')),
  'emoji-keyboard': dyn(() => import('@/components/tools/emoji-keyboard')),
  'dice-roller': dyn(() => import('@/components/tools/dice-roller')),
  'coin-flip': dyn(() => import('@/components/tools/coin-flip')),
  'random-number-generator': dyn(() => import('@/components/tools/random-number-generator')),
  'pomodoro-timer': dyn(() => import('@/components/tools/pomodoro-timer')),
  'stopwatch': dyn(() => import('@/components/tools/stopwatch')),
  'qr-code-reader': dyn(() => import('@/components/tools/qr-code-reader')),
  'invoice-generator': dyn(() => import('@/components/tools/invoice-generator')),

  // AUDIO
  'audio-trimmer': dyn(() => import('@/components/tools/audio-trimmer')),
  'audio-compressor': dyn(() => import('@/components/tools/audio-compressor')),
  'audio-converter': dyn(() => import('@/components/tools/audio-converter')),
  'audio-volume-booster': dyn(() => import('@/components/tools/audio-volume-booster')),
  'audio-merger': dyn(() => import('@/components/tools/audio-merger')),
  'audio-recorder': dyn(() => import('@/components/tools/audio-recorder')),

  // VIDEO
  'video-trimmer': dyn(() => import('@/components/tools/video-trimmer')),
  'video-compressor': dyn(() => import('@/components/tools/video-compressor')),
  'video-converter': dyn(() => import('@/components/tools/video-converter')),
  'video-to-gif': dyn(() => import('@/components/tools/video-to-gif')),
  'video-frame-extractor': dyn(() => import('@/components/tools/video-frame-extractor')),
  'video-resizer': dyn(() => import('@/components/tools/video-resizer')),

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
