'use client'

import * as React from 'react'
import { Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useFavorites } from '@/hooks/use-favorites'
import { cn } from '@/lib/utils'

interface FavoriteButtonProps {
  slug: string
  className?: string
}

export function FavoriteButton({ slug, className }: FavoriteButtonProps) {
  const { has, toggle, hydrated } = useFavorites()
  const isFav = has(slug)

  if (!hydrated) {
    // Avoid SSR mismatch: render a placeholder with identical layout
    return (
      <Button variant="outline" size="sm" className={cn('gap-1.5', className)} disabled>
        <Star className="h-4 w-4" />
        <span className="hidden sm:inline">Save</span>
      </Button>
    )
  }

  return (
    <Button
      variant={isFav ? 'default' : 'outline'}
      size="sm"
      className={cn('gap-1.5', className)}
      onClick={() => toggle(slug)}
      aria-pressed={isFav}
      aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
    >
      <Star className={cn('h-4 w-4', isFav && 'fill-current')} />
      <span className="hidden sm:inline">{isFav ? 'Saved' : 'Save'}</span>
    </Button>
  )
}
