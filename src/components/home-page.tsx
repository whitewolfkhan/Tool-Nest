'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  Search,
  Sparkles,
  Shield,
  Zap,
  Globe,
  Lock,
  Heart,
  Star,
  Clock,
  FileText,
  Image as ImageIcon,
  Code2,
  Briefcase,
  GraduationCap,
  Mail,
  CheckCircle2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  categories,
  getPopularTools,
  getToolsByCategory,
  getToolBySlug,
  searchTools,
  totalToolsCount,
  totalCategoriesCount,
} from '@/lib/tools-registry'
import { ToolCard } from '@/components/tool-card'
import { AnimatedCounter } from '@/components/animated-counter'
import { useFavorites, useRecents } from '@/hooks/use-favorites'
import { cn } from '@/lib/utils'

const features = [
  {
    icon: Lock,
    title: '100% Private',
    description: 'Tools run in your browser — your files never leave your device.',
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
  },
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'No upload wait. Instant results powered by WebAssembly & Canvas.',
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
  },
  {
    icon: Heart,
    title: 'Always Free',
    description: 'No signup, no watermark, no limits. Forever free for everyone.',
    color: 'text-rose-500',
    bg: 'bg-rose-500/10',
  },
  {
    icon: Globe,
    title: 'Works Everywhere',
    description: 'Mobile, desktop, tablet. Modern browser is all you need.',
    color: 'text-cyan-500',
    bg: 'bg-cyan-500/10',
  },
]

const useCases = [
  {
    icon: Briefcase,
    title: 'For Professionals',
    description: 'Compress PDFs, generate QR codes, convert images, write content with AI.',
    tools: ['pdf-merge', 'pdf-compress', 'qr-code-generator', 'ai-content-writer'],
    color: 'text-rose-500',
    bg: 'from-rose-500/10 to-orange-500/10',
  },
  {
    icon: Code2,
    title: 'For Developers',
    description: 'Format JSON, decode JWTs, test regex, generate UUIDs and passwords.',
    tools: ['json-formatter', 'jwt-decoder', 'regex-tester', 'uuid-generator'],
    color: 'text-violet-500',
    bg: 'from-violet-500/10 to-fuchsia-500/10',
  },
  {
    icon: GraduationCap,
    title: 'For Students',
    description: 'Calculate GPA, BMI, compound interest, and convert units instantly.',
    tools: ['gpa-calculator', 'bmi-calculator', 'compound-interest-calculator', 'unit-converter'],
    color: 'text-amber-500',
    bg: 'from-amber-500/10 to-yellow-500/10',
  },
  {
    icon: Mail,
    title: 'For Creators',
    description: 'Generate AI images, write social posts, remove backgrounds, design QR codes.',
    tools: ['ai-image-generator', 'image-compress', 'color-picker', 'open-graph-generator'],
    color: 'text-emerald-500',
    bg: 'from-emerald-500/10 to-teal-500/10',
  },
]

export function HomePage() {
  const [query, setQuery] = React.useState('')
  const results = React.useMemo(() => searchTools(query), [query])
  const popularTools = React.useMemo(() => getPopularTools(), [])
  const { favorites } = useFavorites()
  const { recents } = useRecents()

  const favoriteTools = React.useMemo(
    () => favorites.map((s) => getToolBySlug(s)).filter((t): t is NonNullable<typeof t> => !!t),
    [favorites]
  )
  const recentTools = React.useMemo(
    () => recents.map((s) => getToolBySlug(s)).filter((t): t is NonNullable<typeof t> => !!t),
    [recents]
  )

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/60">
        {/* Animated gradient blobs */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-primary/20 blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
          <div className="absolute top-10 right-0 h-80 w-80 rounded-full bg-amber-500/15 blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />
          <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-rose-500/10 blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }} />
        </div>
        <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />

        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-5 gap-1.5 py-1.5">
              <Sparkles className="h-3 w-3" />
              {totalToolsCount}+ free tools · No signup required
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Every free tool you need,
              <br />
              <span className="gradient-text">all in one place</span>
            </h1>
            <p className="mt-5 text-base text-muted-foreground sm:text-lg max-w-2xl mx-auto">
              PDF, image, text, developer, converter, calculator, SEO and AI tools — all 100% free, all running in your browser. No watermark, no upload, no limits.
            </p>

            {/* Search bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (results[0]) window.location.href = `/tools/${results[0].slug}`
              }}
              className="relative mx-auto mt-8 max-w-xl"
              autoComplete="off"
            >
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for a tool... e.g. merge pdf, compress image, json formatter"
                className="h-14 pl-12 pr-28 text-base shadow-sm"
              />
              <Button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-10"
                disabled={!results[0]}
              >
                Search
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
              {query && results.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-2 z-30 rounded-xl border border-border bg-popover shadow-lg overflow-hidden text-left">
                  {results.slice(0, 6).map((t) => (
                    <Link
                      key={t.slug}
                      href={`/tools/${t.slug}`}
                      className="flex flex-col px-4 py-2.5 hover:bg-accent transition-colors border-b last:border-b-0"
                    >
                      <span className="text-sm font-medium">{t.name}</span>
                      <span className="text-xs text-muted-foreground truncate">{t.description}</span>
                    </Link>
                  ))}
                </div>
              )}
            </form>

            {/* Popular search chips */}
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs">
              <span className="text-muted-foreground">Popular:</span>
              {['PDF Merge', 'Image Compress', 'JSON Formatter', 'QR Code', 'AI Image'].map((p) => (
                <button
                  key={p}
                  onClick={() => setQuery(p.toLowerCase())}
                  className="rounded-full border border-border bg-background/50 hover:bg-accent hover:border-primary/40 transition-colors px-3 py-1"
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Stats */}
            <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
              {[
                { label: 'Free Tools', value: totalToolsCount, suffix: '+' },
                { label: 'Categories', value: totalCategoriesCount, suffix: '' },
                { label: 'Cost', value: 0, suffix: '', text: 'Free' },
                { label: 'Sign-up', value: 0, suffix: '', text: 'None' },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <div className="text-2xl font-bold gradient-text">
                    {s.text ?? <AnimatedCounter value={s.value} suffix={s.suffix} />}
                  </div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((f) => (
              <Card key={f.title} className="p-5 border-border/60 hover:border-primary/30 transition-colors">
                <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl', f.bg)}>
                  <f.icon className={cn('h-5 w-5', f.color)} />
                </div>
                <h3 className="mt-4 font-semibold">{f.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{f.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Recently used (only if any) */}
      {recentTools.length > 0 && (
        <section className="border-b border-border/60">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                <div>
                  <h2 className="text-xl font-bold tracking-tight">Recently used</h2>
                  <p className="text-xs text-muted-foreground">Pick up where you left off</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
              {recentTools.slice(0, 6).map((t) => (
                <ToolCard key={t.slug} tool={t} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Favorites (only if any) */}
      {favoriteTools.length > 0 && (
        <section className="border-b border-border/60">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-4">
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
                <div>
                  <h2 className="text-xl font-bold tracking-tight">Your favorites</h2>
                  <p className="text-xs text-muted-foreground">Tools you've saved for quick access</p>
                </div>
              </div>
              <Link href="/browse?cat=favorites" className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
                View all <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
              {favoriteTools.slice(0, 6).map((t) => (
                <ToolCard key={t.slug} tool={t} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Popular tools */}
      <section id="popular" className="border-b border-border/60">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Popular Tools</h2>
              <p className="mt-1 text-sm text-muted-foreground">Most used tools by our community</p>
            </div>
            <Link href="/browse" className="hidden sm:flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              Browse all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {popularTools.map((t) => (
              <ToolCard key={t.slug} tool={t} />
            ))}
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section className="border-b border-border/60 bg-card/30">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold tracking-tight">Built for everyone</h2>
            <p className="mt-1 text-sm text-muted-foreground">No matter who you are, there's a tool here for you</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {useCases.map((u) => (
              <Card key={u.title} className={cn('p-6 bg-gradient-to-br border-border/60 hover:shadow-md transition-all', u.bg)}>
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-background/80 backdrop-blur">
                    <u.icon className={cn('h-6 w-6', u.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold">{u.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{u.description}</p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {u.tools.map((slug) => {
                        const t = getToolBySlug(slug)
                        if (!t) return null
                        return (
                          <Link
                            key={slug}
                            href={`/tools/${slug}`}
                            className="text-xs px-2.5 py-1 rounded-md border border-border bg-background/60 backdrop-blur hover:border-primary/50 hover:bg-background transition-colors"
                          >
                            {t.name}
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section id="categories" className="border-b border-border/60">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold tracking-tight">Browse by Category</h2>
            <p className="mt-1 text-sm text-muted-foreground">{totalCategoriesCount} categories, {totalToolsCount}+ tools</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categories.map((cat) => {
              const toolsInCat = getToolsByCategory(cat.id)
              return (
                <Card
                  key={cat.id}
                  id={cat.id}
                  className="p-6 hover:shadow-md hover:border-primary/40 transition-all scroll-mt-20"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={cn(
                        'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br',
                        cat.gradient
                      )}
                    >
                      <cat.icon className={cn('h-6 w-6', cat.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold">{cat.name}</h3>
                        <Badge variant="secondary" className="text-[10px]">
                          {toolsInCat.length}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{cat.description}</p>
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {toolsInCat.slice(0, 6).map((t) => (
                          <Link
                            key={t.slug}
                            href={`/tools/${t.slug}`}
                            className="text-xs px-2.5 py-1 rounded-md border border-border hover:border-primary/50 hover:bg-accent transition-colors"
                          >
                            {t.name}
                          </Link>
                        ))}
                        {toolsInCat.length > 6 && (
                          <Link
                            href={`/browse?cat=${cat.id}`}
                            className="text-xs px-2.5 py-1 text-primary hover:underline"
                          >
                            +{toolsInCat.length - 6} more
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Trust / How it works */}
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold tracking-tight">How it works</h2>
            <p className="mt-1 text-sm text-muted-foreground">Three simple steps. No accounts, no friction.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { step: '1', title: 'Pick a tool', description: 'Browse by category or search by name. 88+ tools across 10 categories.' },
              { step: '2', title: 'Do your work', description: 'Files are processed locally in your browser. Nothing is uploaded to a server.' },
              { step: '3', title: 'Download or copy', description: 'Get your result instantly. Save it, copy it, or share it — no watermarks.' },
            ].map((s) => (
              <Card key={s.step} className="p-6 relative overflow-hidden">
                <div className="absolute -top-2 -right-2 text-7xl font-bold text-muted-foreground/10 select-none">
                  {s.step}
                </div>
                <div className="relative">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                    {s.step}
                  </div>
                  <h3 className="mt-3 font-semibold">{s.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{s.description}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why ToolNest — comparison table */}
      <section className="border-b border-border/60 bg-card/30">
        <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold tracking-tight">Why ToolNest?</h2>
            <p className="mt-1 text-sm text-muted-foreground">Compared to other free tool sites</p>
          </div>
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Feature</th>
                  <th className="text-center py-3 px-4 font-semibold text-primary">
                    ToolNest
                  </th>
                  <th className="text-center py-3 px-4 font-medium text-muted-foreground">Other free sites</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: 'Number of free tools', us: `${totalToolsCount}+`, them: '5–30' },
                  { feature: 'Account required', us: 'Never', them: 'Often' },
                  { feature: 'File uploads to server', us: 'No (browser-only)', them: 'Yes' },
                  { feature: 'Watermarks on output', us: 'Never', them: 'Sometimes' },
                  { feature: 'Usage limits', us: 'Unlimited', them: 'Limited' },
                  { feature: 'Ads on tool pages', us: 'None', them: 'Many' },
                  { feature: 'AI-powered tools', us: 'Yes (6+)', them: 'Rarely' },
                  { feature: 'Dark mode', us: 'Yes', them: 'Sometimes' },
                  { feature: 'Mobile-friendly', us: 'Yes', them: 'Inconsistent' },
                  { feature: 'Open source / transparent', us: 'Yes', them: 'No' },
                ].map((row) => (
                  <tr key={row.feature} className="border-b border-border/60 last:border-b-0">
                    <td className="py-3 px-4 text-left">{row.feature}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="h-4 w-4" />
                        {row.us}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center text-muted-foreground">{row.them}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-b border-border/60 bg-gradient-to-b from-primary/5 to-transparent">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 text-center">
          <Shield className="mx-auto h-12 w-12 text-primary" />
          <h2 className="mt-4 text-3xl font-bold tracking-tight">Your files never leave your device</h2>
          <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
            Most of our tools run entirely in your browser using WebAssembly, Canvas, and modern JS APIs.
            No uploads, no servers, no tracking. Your privacy is the default.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link href="/browse">
              <Button size="lg">
                Explore All Tools <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
            <Link href="#popular">
              <Button size="lg" variant="outline">Popular Tools</Button>
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
            {['No signup', 'No watermark', 'No upload', 'No tracking', 'No limits'].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
