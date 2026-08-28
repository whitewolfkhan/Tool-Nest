'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, Wrench, Menu, X } from 'lucide-react'
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
import { searchTools, totalToolsCount } from '@/lib/tools-registry'
import { cn } from '@/lib/utils'

export function SiteHeader() {
  const router = useRouter()
  const [query, setQuery] = React.useState('')
  const [open, setOpen] = React.useState(false)
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const results = React.useMemo(() => searchTools(query).slice(0, 8), [query])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const r = searchTools(query)[0]
    if (r) {
      router.push(`/tools/${r.slug}`)
      setQuery('')
      setOpen(false)
      setMobileOpen(false)
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

        {/* Desktop search */}
        <form
          onSubmit={handleSubmit}
          className="relative hidden md:flex flex-1 max-w-md mx-2"
          autoComplete="off"
        >
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setOpen(e.target.value.length > 0)
            }}
            onFocus={() => setOpen(query.length > 0)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            placeholder="Search 80+ tools..."
            className="pl-9 pr-3"
          />
          {open && results.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-2 z-50 rounded-xl border border-border bg-popover shadow-lg overflow-hidden">
              {results.map((t) => (
                <Link
                  key={t.slug}
                  href={`/tools/${t.slug}`}
                  onClick={() => {
                    setQuery('')
                    setOpen(false)
                  }}
                  className="flex flex-col px-3 py-2 hover:bg-accent transition-colors border-b last:border-b-0"
                >
                  <span className="text-sm font-medium">{t.name}</span>
                  <span className="text-xs text-muted-foreground truncate">{t.description}</span>
                </Link>
              ))}
            </div>
          )}
        </form>

        <div className="flex items-center gap-1 ml-auto">
          <Badge variant="secondary" className="hidden lg:inline-flex">
            {totalToolsCount}+ tools
          </Badge>
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

      {/* Mobile search */}
      <div className="md:hidden px-4 pb-3">
        <form onSubmit={handleSubmit} className="relative" autoComplete="off">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setOpen(e.target.value.length > 0)
            }}
            placeholder="Search tools..."
            className="pl-9 pr-3 h-10"
          />
          {open && results.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-2 z-50 rounded-xl border border-border bg-popover shadow-lg overflow-hidden max-h-96 overflow-y-auto scrollbar-thin">
              {results.map((t) => (
                <Link
                  key={t.slug}
                  href={`/tools/${t.slug}`}
                  onClick={() => {
                    setQuery('')
                    setOpen(false)
                  }}
                  className="flex flex-col px-3 py-2 hover:bg-accent transition-colors border-b last:border-b-0"
                >
                  <span className="text-sm font-medium">{t.name}</span>
                  <span className="text-xs text-muted-foreground truncate">{t.description}</span>
                </Link>
              ))}
            </div>
          )}
        </form>
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
