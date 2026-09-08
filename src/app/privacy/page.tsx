import Link from 'next/link'
import type { Metadata } from 'next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileCheck, EyeOff, Database, Cpu, Cookie, Mail } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Privacy Policy — ToolNest',
  description:
    'How ToolNest protects your privacy: client-side processing, no accounts, no tracking, and full transparency about the AI-powered tools.',
}

const sections = [
  {
    icon: EyeOff,
    title: 'Your files never leave your device',
    body: [
      'All tools except the 7 AI-powered ones run entirely in your browser using built-in web technologies (Canvas, Web Crypto, Web Speech, and similar APIs). When you compress an image, merge a PDF, or hash a password, the processing happens on your own device.',
      'We operate no file-upload pipeline and no file storage. There is nothing on our servers that could leak, because your files are never sent to them.',
    ],
  },
  {
    icon: FileCheck,
    title: 'No accounts, no tracking',
    body: [
      'ToolNest requires no signup and sets no advertising or analytics cookies. We do not use fingerprinting, cross-site trackers, or third-party analytics.',
      'Preferences such as your color theme, favorite tools, and recently used tools are stored only in your own browser (localStorage) and can be cleared at any time from your browser settings.',
    ],
  },
  {
    icon: Cpu,
    title: 'AI-powered tools',
    body: [
      'The 7 AI tools (image generator, content writer, chat assistant, image describer, image OCR, summarizer, and translator) need server-side processing. When you use one, your prompt — and, for image tools, the image you provide — is sent to our AI provider solely to generate your result.',
      'Prompts are not stored after your response is returned, are never used for advertising, and are never sold. If you are working with sensitive material, prefer the equivalent non-AI tools, which stay fully on-device.',
    ],
  },
  {
    icon: Database,
    title: 'Data we do (and do not) keep',
    body: [
      'We do not maintain user profiles and have no database of personal information. Our application database exists only for basic operational records and contains no file contents or tool inputs.',
      'Like any website, our hosting provider may record standard technical logs (such as IP addresses and requested pages) for security and reliability. These logs are not combined with any other data about you.',
    ],
  },
  {
    icon: Cookie,
    title: 'Cookies and local storage',
    body: [
      'ToolNest does not set tracking cookies. The site uses your browser\u2019s local storage for purely functional preferences: theme (light/dark), favorited tools, recently used tools, and per-tool settings such as saved color palettes.',
      'Clearing your browser\u2019s site data removes all of it. The site keeps working — your preferences simply reset to defaults.',
    ],
  },
]

export default function PrivacyPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="text-center">
        <Badge variant="secondary">Privacy Policy</Badge>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
          Private by design, not by promise
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
          The short version: almost everything runs in your browser, we track
          nothing, and we store nothing about you. The details are below.
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Last updated: September 2026
        </p>
      </div>

      <div className="mt-8 space-y-4">
        {sections.map((s) => (
          <Card key={s.title}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <s.icon className="h-5 w-5 text-primary" />
                {s.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {s.body.map((p, i) => (
                <p key={i} className="text-sm leading-relaxed text-muted-foreground">
                  {p}
                </p>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
          <Mail className="h-6 w-6 text-primary" />
          <p className="text-sm text-muted-foreground">
            Questions about this policy? We answer every message.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Button size="sm" asChild>
              <Link href="/contact">Contact us</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/terms">Read the Terms of Service</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
