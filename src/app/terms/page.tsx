import Link from 'next/link'
import type { Metadata } from 'next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Scale } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Terms of Service — ToolNest',
  description:
    'The rules for using ToolNest: free fair use, acceptable use, AI output and data disclaimers, and limitation of liability.',
}

const sections = [
  {
    title: '1. The service',
    body: 'ToolNest provides free online tools for everyday tasks — PDF, image, text, developer, converter, calculator, SEO, security, media, and AI-assisted tools. The service is provided free of charge, with no account required, and may be modified, extended, or discontinued at any time.',
  },
  {
    title: '2. Fair and acceptable use',
    body: 'You may use ToolNest for any lawful purpose. You agree not to abuse the service: no automated scraping or denial-of-service attacks, no attempts to breach or probe the platform, and no use of the tools for unlawful, harmful, or deceptive activity — including generating misleading documents, spam, or infringing content.',
  },
  {
    title: '3. Your content stays yours',
    body: 'Because nearly all processing happens in your browser, your files and inputs generally never reach us — and whatever you create with the tools belongs to you. For the AI-powered tools, your prompt is transmitted to our AI provider only to produce your result and is not stored afterwards (see the Privacy Policy).',
  },
  {
    title: '4. AI-generated output',
    body: 'Content produced by the AI tools (text, images, translations, summaries, descriptions) is generated automatically and may be inaccurate, incomplete, or biased. Review AI output before relying on it for anything important. AI-generated content may not be protectable intellectual property in your jurisdiction.',
  },
  {
    title: '5. Data accuracy disclaimers',
    body: 'Some tools present third-party or computed data that should be treated as indicative, not authoritative: live currency rates are for reference only and are not financial advice; calculated results (EMI, BMI, GPA, hashes) depend on the correctness of your inputs; file conversions may lose fidelity (for example, lossy compression or format limits). Always verify critical results independently.',
  },
  {
    title: '6. Availability and warranty',
    body: 'ToolNest is provided "as is" and "as available", without warranties of any kind — express or implied — including availability, accuracy, or fitness for a particular purpose. We do our best to keep every tool fast and reliable, but we cannot guarantee uninterrupted service.',
  },
  {
    title: '7. Limitation of liability',
    body: 'To the maximum extent permitted by law, ToolNest and its maintainer are not liable for any direct, indirect, incidental, or consequential loss arising from your use of the service — including data loss, decisions made on tool output, or service interruptions. If you do not agree with these terms, please do not use the site.',
  },
  {
    title: '8. Changes to these terms',
    body: 'These terms may be updated as ToolNest grows (for example, when new tool categories are added). Material changes will be reflected in the "Last updated" date below, and continued use of the service after changes means you accept the updated terms.',
  },
]

export default function TermsPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="text-center">
        <Badge variant="secondary">Terms of Service</Badge>
        <h1 className="mt-3 flex items-center justify-center gap-2 text-3xl font-bold tracking-tight sm:text-4xl">
          <Scale className="h-8 w-8 text-primary" />
          Fair, simple terms
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
          Use the tools lawfully, don&apos;t abuse the service, and understand
          the limits of automated output. That&apos;s the essence of it.
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Last updated: September 2026
        </p>
      </div>

      <div className="mt-8 space-y-4">
        {sections.map((s) => (
          <Card key={s.title}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{s.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {s.body}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Something unclear? Ask directly — or see how we handle your data.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Button size="sm" asChild>
              <Link href="/contact">Contact us</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/privacy">Read the Privacy Policy</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
