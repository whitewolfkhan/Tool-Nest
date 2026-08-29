'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronRight, Copy, Check, Download, ArrowLeft } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  getToolBySlug,
  getCategoryById,
  getToolsByCategory,
} from '@/lib/tools-registry'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface ToolPageShellProps {
  slug: string
  children: React.ReactNode
}

export function ToolPageShell({ slug, children }: ToolPageShellProps) {
  const tool = getToolBySlug(slug)
  const router = useRouter()

  if (!tool) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Tool not found</h1>
        <p className="mt-2 text-muted-foreground">The tool you are looking for does not exist.</p>
        <Button onClick={() => router.push('/')} className="mt-4">
          Back to Home
        </Button>
      </div>
    )
  }

  const category = getCategoryById(tool.category)
  const related = getToolsByCategory(tool.category)
    .filter((t) => t.slug !== tool.slug)
    .slice(0, 6)
  const Icon = category?.icon

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-4 flex-wrap">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href={`/#${tool.category}`} className="hover:text-foreground">{category?.name}</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground font-medium truncate">{tool.name}</span>
      </nav>

      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <Link href="/" className="hidden sm:flex">
          <Button variant="ghost" size="icon" className="h-9 w-9 -ml-2" aria-label="Back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        {Icon && category && (
          <div
            className={cn(
              'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br',
              category.gradient
            )}
          >
            <Icon className={cn('h-6 w-6', category.color)} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight">{tool.name}</h1>
            <Badge variant="secondary">{category?.name}</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{tool.description}</p>
        </div>
      </div>

      <Separator className="mb-6" />

      {/* Tool content */}
      <div className="mb-10">{children}</div>

      {/* Related tools */}
      {related.length > 0 && (
        <div className="mt-12 border-t border-border pt-8">
          <h2 className="text-lg font-semibold mb-3">Related tools</h2>
          <div className="flex flex-wrap gap-2">
            {related.map((t) => (
              <Link
                key={t.slug}
                href={`/tools/${t.slug}`}
                className="text-sm px-3 py-1.5 rounded-md border border-border hover:border-primary/50 hover:bg-accent transition-colors"
              >
                {t.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* Shared utility components for tool pages */

export function CopyButton({
  text,
  className,
  label = 'Copy',
}: {
  text: string
  className?: string
  label?: string
}) {
  const [copied, setCopied] = React.useState(false)
  return (
    <Button
      variant="outline"
      size="sm"
      className={cn('gap-1.5', className)}
      disabled={!text}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text)
          setCopied(true)
          toast.success('Copied to clipboard')
          setTimeout(() => setCopied(false), 2000)
        } catch {
          toast.error('Failed to copy')
        }
      }}
    >
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      {copied ? 'Copied!' : label}
    </Button>
  )
}

export function DownloadButton({
  onClick,
  disabled,
  className,
  label = 'Download',
}: {
  onClick: () => void
  disabled?: boolean
  className?: string
  label?: string
}) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      size="sm"
      className={cn('gap-1.5', className)}
    >
      <Download className="h-4 w-4" />
      {label}
    </Button>
  )
}

export function ToolCardWrapper({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <Card className={cn('p-5 sm:p-6', className)}>{children}</Card>
  )
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
      {message}
    </div>
  )
}

export function FieldLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <label className={cn('text-sm font-medium mb-1.5 block', className)}>{children}</label>
  )
}
