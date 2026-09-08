import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { ThemeProvider } from '@/components/theme-provider'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { CookieConsent } from '@/components/cookie-consent'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'ToolNest — 80+ Free Online Tools for PDF, Image, Text & More',
  description:
    'Free online tools for PDF, image, text, developer, converters, calculators, SEO and AI. No signup, no watermark, runs in your browser. 80+ tools in one place.',
  keywords: [
    'free online tools',
    'pdf tools',
    'image tools',
    'text tools',
    'developer tools',
    'converters',
    'calculators',
    'ai tools',
  ],
  authors: [{ name: 'ToolNest' }],
  icons: {
    icon: [
      { url: '/logo.svg', type: 'image/svg+xml' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'ToolNest — 80+ Free Online Tools',
    description: 'PDF, Image, Text, Developer, Converters, Calculators, AI tools — all free, all in your browser.',
    siteName: 'ToolNest',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'ToolNest — Free Online Tools',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ToolNest — 80+ Free Online Tools',
    description: 'PDF, Image, Text, Developer, Converters, Calculators, AI tools — all free.',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground min-h-screen flex flex-col`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <SiteHeader />
          <main className="flex-1 flex flex-col">{children}</main>
          <SiteFooter />
          <Toaster />
          <Sonner />
          <CookieConsent />
        </ThemeProvider>
      </body>
    </html>
  )
}
