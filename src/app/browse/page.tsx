import { Suspense } from 'react'
import { BrowsePage } from '@/components/browse-page'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Browse All Tools — ToolNest',
  description:
    'Browse all 88+ free online tools by category. PDF, Image, Text, Developer, Converter, Calculator, SEO, Security, Misc, AI tools.',
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-20 text-center text-sm text-muted-foreground">
          Loading tools...
        </div>
      }
    >
      <BrowsePage />
    </Suspense>
  )
}
