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
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  categories,
  getPopularTools,
  getToolsByCategory,
  searchTools,
  totalToolsCount,
  totalCategoriesCount,
} from '@/lib/tools-registry'
import { ToolCard } from '@/components/tool-card'
import { cn } from '@/lib/utils'

const features = [
  {
    icon: Lock,
    title: '100% Private',
    description: 'Tools run in your browser — your files never leave your device.',
    color: 'text-emerald-500',
  },
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'No upload wait. Instant results powered by WebAssembly & Canvas.',
    color: 'text-amber-500',
  },
  {
    icon: Heart,
    title: 'Always Free',
    description: 'No signup, no watermark, no limits. Forever free for everyone.',
    color: 'text-rose-500',
  },
  {
    icon: Globe,
    title: 'Works Everywhere',
    description: 'Mobile, desktop, tablet. Modern browser is all you need.',
    color: 'text-cyan-500',
  },
]

export function HomePage() {
  const [query, setQuery] = React.useState('')
  const results = React.useMemo(() => searchTools(query), [query])
  const popularTools = React.useMemo(() => getPopularTools(), [])

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/60">
        <div className="absolute inset-0 bg-grid opacity-40 pointer-events-none [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_70%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
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

            {/* Stats */}
            <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
              {[
                { label: 'Free Tools', value: `${totalToolsCount}+` },
                { label: 'Categories', value: totalCategoriesCount },
                { label: 'Cost', value: 'Free' },
                { label: 'Sign-up', value: 'None' },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <div className="text-2xl font-bold gradient-text">{s.value}</div>
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
              <Card key={f.title} className="p-5 border-border/60">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary">
                  <f.icon className={cn('h-5 w-5', f.color)} />
                </div>
                <h3 className="mt-4 font-semibold">{f.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{f.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Popular tools */}
      <section id="popular" className="border-b border-border/60">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Popular Tools</h2>
              <p className="mt-1 text-sm text-muted-foreground">Most used tools by our community</p>
            </div>
            <Link href="#categories" className="hidden sm:flex items-center gap-1 text-sm font-medium text-primary hover:underline">
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
                          <span className="text-xs px-2.5 py-1 text-muted-foreground">
                            +{toolsInCat.length - 6} more
                          </span>
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
            <Link href="#popular">
              <Button size="lg">
                Explore Popular Tools <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
            <Link href="#categories">
              <Button size="lg" variant="outline">Browse Categories</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
