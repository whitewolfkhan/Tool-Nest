'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, Wrench, Menu, LayoutGrid } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ThemeToggle } from '@/components/theme-toggle'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { tools, totalToolsCount } from '@/lib/tools-registry'

export function SiteHeader() {
  const router = useRouter()
  const [query, setQuery] = React.useState('')
  const [mobileOpen, setMobileOpen] = React.useState(false)

  // Search no longer shows a dropdown list — on submit it navigates to the
  // full browse page which has its own search/filter UI.
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const q = query.trim()
    if (q) {
      router.push(`/browse?q=${encodeURIComponent(q)}`)
      setQuery('')
      setMobileOpen(false)
    } else {
      router.push('/browse')
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Wrench className="h-5 w-5" />
          </div>
          <div className="hidden sm:flex flex-col leading-none">
            <span className="text-base font-bold tracking-tight">ToolNest</span>
            <span className="text-[10px] text-muted-foreground">Free Online Tools</span>
          </div>
        </Link>

        {/* Desktop search — navigates to /browse on submit (no dropdown) */}
        <form
          onSubmit={handleSubmit}
          className="relative hidden md:flex flex-1 max-w-md mx-2"
          autoComplete="off"
        >
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${totalToolsCount}+ tools...`}
            className="pl-9 pr-3"
          />
        </form>

        <div className="flex items-center gap-1 ml-auto">
          <Badge variant="secondary" className="hidden lg:inline-flex">
            {totalToolsCount}+ tools
          </Badge>
          <Link href="/browse" className="hidden sm:block">
            <Button variant="ghost" size="sm" className="gap-1.5">
              <LayoutGrid className="h-4 w-4" />
              Browse
            </Button>
          </Link>
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Mobile search — navigates to /browse on submit (no dropdown) */}
      <div className="md:hidden px-4 pb-3">
        <form onSubmit={handleSubmit} autoComplete="off">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tools..."
              className="pl-9 pr-3 h-10"
            />
          </div>
        </form>
      </div>

      {/* Tool-name ticker (marquee) — scrolls left to right */}
      <div className="border-t border-border/60 bg-secondary/30 overflow-hidden">
        <div className="marquee-mask">
          <div className="marquee-track" aria-hidden="false">
            <TickerItems />
            <TickerItems />
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Menu</DialogTitle>
          </DialogHeader>
          <div className="grid gap-2">
            <Link href="/" onClick={() => setMobileOpen(false)}>
              <Button variant="outline" className="w-full justify-start">Home</Button>
            </Link>
            <Link href="/browse" onClick={() => setMobileOpen(false)}>
              <Button variant="outline" className="w-full justify-start">Browse All Tools</Button>
            </Link>
            <Link href="/#categories" onClick={() => setMobileOpen(false)}>
              <Button variant="outline" className="w-full justify-start">Browse Categories</Button>
            </Link>
            <Link href="/#popular" onClick={() => setMobileOpen(false)}>
              <Button variant="outline" className="w-full justify-start">Popular Tools</Button>
            </Link>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  )
}

/** One copy of the tool-name ticker. Rendered twice for a seamless loop. */
function TickerItems() {
  return (
    <div className="flex items-center shrink-0" role="list">
      {tools.map((t) => (
        <Link
          key={t.slug}
          href={`/tools/${t.slug}`}
          role="listitem"
          className="flex items-center gap-1.5 whitespace-nowrap px-3 py-2 text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          <span className="h-1 w-1 rounded-full bg-primary/40" />
          <span className="font-medium">{t.name}</span>
        </Link>
      ))}
    </div>
  )
}
