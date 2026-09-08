import Link from 'next/link'
import type { Metadata } from 'next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Wrench,
  ShieldCheck,
  Zap,
  Heart,
  Globe,
  ArrowRight,
  Github,
  BookOpen,
} from 'lucide-react'
import { tools, categories } from '@/lib/tools-registry'

export const metadata: Metadata = {
  title: 'About — ToolNest',
  description:
    'Learn what ToolNest is: a free, privacy-first toolbox with 135+ online tools for PDF, image, text, developer, and everyday tasks. No signup, no watermark.',
}

const values = [
  {
    icon: ShieldCheck,
    title: 'Privacy by default',
    text: 'Nearly every tool runs 100% in your browser. Your files are never uploaded, never stored, and never seen by anyone.',
  },
  {
    icon: Zap,
    title: 'Fast and free forever',
    text: 'No accounts, no watermarks, no usage limits, no paywalls. Open a tool and get your result in seconds.',
  },
  {
    icon: Heart,
    title: 'Built for everyone',
    text: 'Students, developers, designers, marketers, and curious minds — every tool is designed to be obvious on first use, on any device.',
  },
  {
    icon: Globe,
    title: 'Works everywhere',
    text: 'A modern browser is all you need. Desktop, tablet, or phone — the full toolbox travels with you.',
  },
]

const steps = [
  {
    step: '1',
    title: 'Find your tool',
    text: 'Search by name or keyword, or browse by category — PDF, Image, Text, Developer, Converters, Calculators, and more.',
  },
  {
    step: '2',
    title: 'Do your work',
    text: 'Everything happens locally on your device. Drop in a file or paste text and see live results instantly.',
  },
  {
    step: '3',
    title: 'Download and go',
    text: 'Copy or download your result. Nothing is saved on our servers — when you leave, your data leaves with you.',
  },
]

export default function AboutPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
          <Wrench className="h-7 w-7" />
        </div>
        <Badge variant="secondary" className="mt-4">
          About ToolNest
        </Badge>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
          Every tool you need, all in one place
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
          ToolNest is a free online toolbox with {tools.length}+ tools across{' '}
          {categories.length} categories — from merging PDFs to generating QR
          codes, all without signups, watermarks, or uploads.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { value: `${tools.length}+`, label: 'Free tools' },
          { value: `${categories.length}`, label: 'Categories' },
          { value: '100%', label: 'Free forever' },
          { value: '0', label: 'Signups required' },
        ].map((s) => (
          <Card key={s.label} className="text-center">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-primary">{s.value}</div>
              <div className="mt-1 text-xs text-muted-foreground">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <h2 className="mt-12 text-2xl font-bold tracking-tight">What we believe</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {values.map((v) => (
          <Card key={v.title}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <v.icon className="h-5 w-5 text-primary" />
                {v.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{v.text}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <h2 className="mt-12 text-2xl font-bold tracking-tight">How it works</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        {steps.map((s) => (
          <Card key={s.step}>
            <CardContent className="p-5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                {s.step}
              </div>
              <h3 className="mt-3 font-semibold">{s.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.text}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Separator className="my-12" />

      <Card>
        <CardContent className="flex flex-col items-center gap-4 p-6 text-center sm:flex-row sm:text-left">
          <div className="flex-1">
            <h2 className="text-xl font-bold">Made by White-Wolf</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              ToolNest is designed, built, and maintained by White-Wolf — with
              feedback from the people who use it every day.
            </p>
            <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
              <Button variant="outline" size="sm" asChild>
                <a
                  href="https://github.com/whitewolfkhan"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Github className="h-4 w-4" /> GitHub
                </a>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a
                  href="https://dev.to/meheer_khan"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <BookOpen className="h-4 w-4" /> Blog
                </a>
              </Button>
              <Button size="sm" asChild>
                <Link href="/contact">
                  Get in touch <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
