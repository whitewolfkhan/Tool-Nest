'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, X, Star, Filter } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
  categories,
  tools,
  searchTools,
  getToolsByCategory,
  totalToolsCount,
  type Tool,
  type Category,
} from '@/lib/tools-registry'
import { useFavorites } from '@/hooks/use-favorites'
import { cn } from '@/lib/utils'

export function BrowsePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialCat = searchParams.get('cat') ?? 'all'
  const initialQ = searchParams.get('q') ?? ''

  const [query, setQuery] = React.useState(initialQ)
  const [activeCat, setActiveCat] = React.useState<string>(initialCat)
  const { favorites } = useFavorites()

  // Sync state with URL
  React.useEffect(() => {
    const params = new URLSearchParams()
    if (activeCat !== 'all') params.set('cat', activeCat)
    if (query) params.set('q', query)
    const qs = params.toString()
    router.replace(qs ? `/browse?${qs}` : '/browse', { scroll: false })
  }, [activeCat, query, router])

  const filteredTools: Tool[] = React.useMemo(() => {
    if (query.trim()) {
      const searched = searchTools(query)
      return activeCat === 'all'
        ? searched
        : searched.filter((t) => t.category === activeCat)
    }
    if (activeCat === 'all') return tools
    if (activeCat === 'favorites') {
      return tools.filter((t) => favorites.includes(t.slug))
    }
    return getToolsByCategory(activeCat)
  }, [query, activeCat, favorites])

  const favOnly = activeCat === 'favorites'

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Browse all tools</h1>
        <p className="mt-1 text-muted-foreground">
          {totalToolsCount}+ free tools across {categories.length} categories. Filter, search, and discover.
        </p>
      </div>

      {/* Search bar */}
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search tools by name or keyword..."
          className="h-12 pl-10 pr-10"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Category chips */}
      <div className="flex flex-wrap gap-2 mb-6">
        <CategoryChip
          active={activeCat === 'all'}
          onClick={() => setActiveCat('all')}
          label="All"
          count={tools.length}
        />
        <CategoryChip
          active={activeCat === 'favorites'}
          onClick={() => setActiveCat('favorites')}
          label="★ Favorites"
          count={favorites.length}
          accent
        />
        {categories.map((c) => (
          <CategoryChip
            key={c.id}
            active={activeCat === c.id}
            onClick={() => setActiveCat(c.id)}
            label={c.name}
            count={getToolsByCategory(c.id).length}
          />
        ))}
      </div>

      {/* Results */}
      <div className="mb-3 text-sm text-muted-foreground flex items-center justify-between">
        <span>
          {filteredTools.length} {filteredTools.length === 1 ? 'tool' : 'tools'}
          {query && ` matching "${query}"`}
          {favOnly && ' in your favorites'}
        </span>
      </div>

      {filteredTools.length === 0 ? (
        <Card className="p-10 text-center">
          {favOnly ? (
            <>
              <Star className="mx-auto h-10 w-10 text-muted-foreground/50" />
              <p className="mt-3 font-medium">No favorites yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Tap the <Star className="inline h-3 w-3" /> Save button on any tool to bookmark it here.
              </p>
              <Button onClick={() => setActiveCat('all')} variant="outline" className="mt-4">
                Browse all tools
              </Button>
            </>
          ) : (
            <>
              <Filter className="mx-auto h-10 w-10 text-muted-foreground/50" />
              <p className="mt-3 font-medium">No tools match your search</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Try a different keyword or browse a category.
              </p>
              {query && (
                <Button onClick={() => setQuery('')} variant="outline" className="mt-4">
                  Clear search
                </Button>
              )}
            </>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filteredTools.map((t) => (
            <BrowseToolCard key={t.slug} tool={t} isFav={favorites.includes(t.slug)} />
          ))}
        </div>
      )}
    </div>
  )
}

function CategoryChip({
  active,
  onClick,
  label,
  count,
  accent,
}: {
  active: boolean
  onClick: () => void
  label: string
  count: number
  accent?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
        active
          ? accent
            ? 'border-amber-500 bg-amber-500 text-white'
            : 'border-primary bg-primary text-primary-foreground'
          : 'border-border bg-background hover:bg-accent hover:border-primary/40'
      )}
    >
      {label}
      <span
        className={cn(
          'rounded-full px-1.5 text-[10px] leading-4',
          active ? 'bg-white/20' : 'bg-muted text-muted-foreground'
        )}
      >
        {count}
      </span>
    </button>
  )
}

function BrowseToolCard({ tool, isFav }: { tool: Tool; isFav: boolean }) {
  const cat = categories.find((c) => c.id === tool.category)
  const Icon = cat?.icon

  return (
    <Link href={`/tools/${tool.slug}`} className="group block">
      <Card className="h-full p-4 transition-all hover:shadow-md hover:border-primary/50 hover:-translate-y-0.5">
        <div className="flex items-start gap-3">
          {Icon && (
            <div
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br',
                cat?.gradient
              )}
            >
              <Icon className={cn('h-5 w-5', cat?.color)} />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <h3 className="font-semibold text-sm truncate">{tool.name}</h3>
              {isFav && <Star className="h-3 w-3 fill-amber-500 text-amber-500 shrink-0" />}
              {tool.popular && (
                <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4 shrink-0">
                  POPULAR
                </Badge>
              )}
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{tool.description}</p>
          </div>
        </div>
      </Card>
    </Link>
  )
}
